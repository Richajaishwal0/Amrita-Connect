import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  CreateCollaborationBody,
  CreateMentorshipRequestBody,
  GetUserParams,
  ListCollaborationsQueryParams,
  ListEventsQueryParams,
  ListOpportunitiesQueryParams,
  ListUsersQueryParams,
  LoginBody,
  MarkNotificationReadParams,
  RegisterForEventParams,
  RegisterBody,
  SaveOpportunityParams,
  UnregisterFromEventParams,
  UnsaveOpportunityParams,
  UpdateMentorshipRequestStatusBody,
  UpdateMentorshipRequestStatusParams,
  UpdateMyProfileBody,
} from "@workspace/api-zod";
import {
  CollaborationModel,
  EventModel,
  EventRegistrationModel,
  MentorshipRequestModel,
  NotificationModel,
  OpportunityModel,
  SavedOpportunityModel,
  UserModel,
} from "@workspace/db";
import { issueToken, requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

function serializeUser(user: any, includeEmail = false) {
  if (!user) return null;
  const plain = typeof user.toObject === "function" ? user.toObject() : user;
  const { passwordHash: _p, status: _s, email: _e, _id, id, ...rest } = plain;
  return {
    ...rest,
    ...(includeEmail ? { email: plain.email } : {}),
    id: String(_id || id),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : new Date().toISOString(),
  };
}

function getUserId(req: Parameters<typeof requireAuth>[0]): string {
  if (!req.userId) throw new Error("Missing authenticated user");
  return String(req.userId);
}

function parseListParams<T extends object>(parser: { parse: (value: unknown) => T }, value: unknown) {
  return parser.parse(value);
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const input = RegisterBody.parse(req.body);
    if ((input.role as string) === "admin") {
      res.status(403).json({ success: false, message: "Admin accounts must be provisioned by the platform team" });
      return;
    }
    const email = input.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.create({
      ...input,
      email,
      graduationYear: input.graduationYear ?? null,
      passwordHash,
      skills: [],
      interests: [],
      helpWith: [],
      lookingFor: [],
    });
    res.status(201).json({ token: issueToken(user._id, user.role), user: serializeUser(user, true) });
  } catch (error: any) {
    if (error && error.code === 11000) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const input = LoginBody.parse(req.body);
    const user = await UserModel.findOne({ email: input.email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ success: false, message: "Email or password is incorrect" });
      return;
    }
    res.json({ token: issueToken(user._id, user.role), user: serializeUser(user, true) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(getUserId(req));
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json(serializeUser(user, true));
  } catch (error) {
    next(error);
  }
});

router.patch("/users/me", requireAuth, async (req, res, next) => {
  try {
    const input = UpdateMyProfileBody.parse(req.body);
    const user = await UserModel.findByIdAndUpdate(getUserId(req), { $set: input }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json(serializeUser(user, true));
  } catch (error) {
    next(error);
  }
});

router.get("/users", requireAuth, async (req, res, next) => {
  try {
    const query = parseListParams(ListUsersQueryParams, req.query);
    const filter: Record<string, any> = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { fullName: searchRegex },
        { headline: searchRegex },
        { bio: searchRegex },
        { company: searchRegex },
        { jobRole: searchRegex },
        { department: searchRegex },
      ];
    }
    if (query.role) filter.role = query.role;
    if (query.campus) filter.campus = query.campus;
    if (query.department) filter.department = query.department;

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ fullName: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      items: items.map((user) => serializeUser(user)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = GetUserParams.parse(req.params);
    const user = await UserModel.findById(id).lean();
    if (!user) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/summary", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const [
      peopleCount,
      mentorshipPending,
      upcomingEvents,
      opportunitiesCount,
      unreadNotifications,
      savedOpportunities,
      registeredRows,
      recentPeople,
      upcoming,
      opportunityItems,
      savedRows,
    ] = await Promise.all([
      UserModel.countDocuments(),
      MentorshipRequestModel.countDocuments({ requesterId: userObjId, status: "pending" }),
      EventModel.countDocuments(),
      OpportunityModel.countDocuments(),
      NotificationModel.countDocuments({ userId: userObjId, read: false }),
      SavedOpportunityModel.countDocuments({ userId: userObjId }),
      EventRegistrationModel.find({ userId: userObjId }).select("eventId").lean(),
      UserModel.find({ verified: true }).sort({ createdAt: -1 }).limit(3).lean(),
      EventModel.find().sort({ date: 1 }).limit(3).lean(),
      OpportunityModel.find().sort({ deadline: 1 }).limit(3).lean(),
      SavedOpportunityModel.find({ userId: userObjId }).select("opportunityId").lean(),
    ]);

    const registeredIds = new Set(registeredRows.map((r) => String(r.eventId)));
    const savedIds = new Set(savedRows.map((r) => String(r.opportunityId)));

    res.json({
      profileCompletion: 72,
      peopleCount,
      mentorshipPending,
      savedOpportunities,
      upcomingEvents,
      unreadNotifications,
      recentPeople: recentPeople.map((user) => serializeUser(user)),
      upcoming: upcoming.map((event) => ({
        ...event,
        id: String(event._id),
        date: new Date(event.date).toISOString(),
        registered: registeredIds.has(String(event._id)),
      })),
      opportunities: opportunityItems.map((opportunity) => ({
        ...opportunity,
        id: String(opportunity._id),
        saved: savedIds.has(String(opportunity._id)),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/mentorship/requests", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const requests = await MentorshipRequestModel.find({
      $or: [{ requesterId: userObjId }, { mentorId: userObjId }],
    })
      .sort({ createdAt: -1 })
      .populate("mentorId")
      .populate("requesterId")
      .lean();

    res.json(
      requests.map((request: any) => ({
        id: String(request._id),
        mentor: serializeUser(request.mentorId),
        requester: serializeUser(request.requesterId),
        message: request.message,
        reason: request.reason,
        topic: request.topic,
        status: request.status,
        createdAt: new Date(request.createdAt).toISOString(),
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/mentorship/requests", requireAuth, async (req, res, next) => {
  try {
    const input = CreateMentorshipRequestBody.parse(req.body);
    const requesterId = getUserId(req);
    const mentor = await UserModel.findById(input.mentorId);
    if (!mentor) {
      res.status(400).json({ success: false, message: "Mentor not found" });
      return;
    }
    const requester = await UserModel.findById(requesterId);
    const request = await MentorshipRequestModel.create({
      requesterId: toObjectId(requesterId),
      mentorId: mentor._id,
      message: input.message,
      reason: input.reason,
      topic: input.topic,
      status: "pending",
    });

    await NotificationModel.create({
      userId: mentor._id,
      type: "mentorship_request",
      title: "New mentorship request",
      message: `${requester?.fullName ?? "A member"} would value your guidance.`,
    });

    res.status(201).json({
      id: String(request._id),
      mentor: serializeUser(mentor),
      requester: serializeUser(requester),
      message: request.message,
      reason: request.reason,
      topic: request.topic,
      status: request.status,
      createdAt: new Date(request.createdAt).toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/mentorship/requests/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { id } = UpdateMentorshipRequestStatusParams.parse(req.params);
    const { status } = UpdateMentorshipRequestStatusBody.parse(req.body);
    const existing = await MentorshipRequestModel.findById(id);
    if (!existing || String(existing.mentorId) !== getUserId(req)) {
      res.status(404).json({ success: false, message: "Mentorship request not found" });
      return;
    }
    existing.status = status as any;
    await existing.save();

    const [mentor, requester] = await Promise.all([
      UserModel.findById(existing.mentorId),
      UserModel.findById(existing.requesterId),
    ]);

    await NotificationModel.create({
      userId: existing.requesterId,
      type: "mentorship_status",
      title: `Mentorship request ${status}`,
      message: `${mentor?.fullName ?? "Your mentor"} ${status} your request.`,
    });

    res.json({
      id: String(existing._id),
      mentor: serializeUser(mentor),
      requester: serializeUser(requester),
      message: existing.message,
      reason: existing.reason,
      topic: existing.topic,
      status: existing.status,
      createdAt: new Date(existing.createdAt).toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/collaborations", requireAuth, async (req, res, next) => {
  try {
    const query = parseListParams(ListCollaborationsQueryParams, req.query);
    const filter: Record<string, any> = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
    if (query.category) filter.category = query.category;

    const [rows, total] = await Promise.all([
      CollaborationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .populate("creatorId")
        .lean(),
      CollaborationModel.countDocuments(filter),
    ]);

    res.json({
      items: rows.map((collab: any) => ({
        ...collab,
        id: String(collab._id),
        creator: serializeUser(collab.creatorId),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations", requireAuth, async (req, res, next) => {
  try {
    const input = CreateCollaborationBody.parse(req.body);
    const userId = getUserId(req);
    const collaboration = await CollaborationModel.create({
      creatorId: toObjectId(userId),
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills,
      teamSize: input.teamSize,
      deadline: input.deadline.toISOString().slice(0, 10),
      category: input.category,
      memberCount: 1,
    });
    const creator = await UserModel.findById(userId);
    res.status(201).json({
      ...collaboration.toObject(),
      id: String(collaboration._id),
      creator: serializeUser(creator),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/opportunities", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const query = parseListParams(ListOpportunitiesQueryParams, req.query);
    const filter: Record<string, any> = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { organization: searchRegex }];
    }
    if (query.category) filter.category = query.category;

    const [items, total, savedRows] = await Promise.all([
      OpportunityModel.find(filter)
        .sort({ deadline: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      OpportunityModel.countDocuments(filter),
      SavedOpportunityModel.find({ userId: userObjId }).select("opportunityId").lean(),
    ]);

    const savedIds = new Set(savedRows.map((r) => String(r.opportunityId)));

    res.json({
      items: items.map((item) => ({
        ...item,
        id: String(item._id),
        saved: savedIds.has(String(item._id)),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/opportunities/:id/save", requireAuth, async (req, res, next) => {
  try {
    const { id } = SaveOpportunityParams.parse(req.params);
    const opportunity = await OpportunityModel.findById(id);
    if (!opportunity) {
      res.status(404).json({ success: false, message: "Opportunity not found" });
      return;
    }
    const userId = toObjectId(getUserId(req));
    await SavedOpportunityModel.updateOne(
      { userId, opportunityId: opportunity._id },
      { userId, opportunityId: opportunity._id },
      { upsert: true },
    );
    res.json({ opportunityId: String(id), saved: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/opportunities/:id/save", requireAuth, async (req, res, next) => {
  try {
    const { id } = UnsaveOpportunityParams.parse(req.params);
    const userId = toObjectId(getUserId(req));
    await SavedOpportunityModel.deleteOne({ userId, opportunityId: toObjectId(id) });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/events", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const query = parseListParams(ListEventsQueryParams, req.query);
    const filter: Record<string, any> = {};

    if (query.campus) filter.campus = query.campus;

    const [items, total, registrationRows] = await Promise.all([
      EventModel.find(filter)
        .sort({ date: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      EventModel.countDocuments(filter),
      EventRegistrationModel.find({ userId: userObjId }).select("eventId").lean(),
    ]);

    const registeredIds = new Set(registrationRows.map((r) => String(r.eventId)));

    res.json({
      items: items.map((item) => ({
        ...item,
        id: String(item._id),
        date: new Date(item.date).toISOString(),
        registered: registeredIds.has(String(item._id)),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/events/:id/register", requireAuth, async (req, res, next) => {
  try {
    const { id } = RegisterForEventParams.parse(req.params);
    const event = await EventModel.findById(id);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }
    const userId = toObjectId(getUserId(req));
    const eventId = event._id;

    const existing = await EventRegistrationModel.findOne({ userId, eventId });
    if (!existing && event.capacity !== null && event.capacity !== undefined) {
      const total = await EventRegistrationModel.countDocuments({ eventId });
      if (total >= event.capacity) {
        res.status(409).json({ success: false, message: "This event has reached capacity" });
        return;
      }
    }
    await EventRegistrationModel.updateOne({ userId, eventId }, { userId, eventId }, { upsert: true });
    res.json({ eventId: String(id), registered: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/events/:id/register", requireAuth, async (req, res, next) => {
  try {
    const { id } = UnregisterFromEventParams.parse(req.params);
    const userId = toObjectId(getUserId(req));
    await EventRegistrationModel.deleteOne({ userId, eventId: toObjectId(id) });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    const items = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(
      items.map((item) => ({
        ...item,
        id: String(item._id),
        createdAt: new Date(item.createdAt).toISOString(),
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = MarkNotificationReadParams.parse(req.params);
    const userId = toObjectId(getUserId(req));
    const item = await NotificationModel.findOneAndUpdate(
      { _id: toObjectId(id), userId },
      { $set: { read: true } },
      { new: true },
    ).lean();

    if (!item) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }
    res.json({ ...item, id: String(item._id), createdAt: new Date(item.createdAt).toISOString() });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/summary", requireAuth, requireRole("admin"), async (_req, res) => {
  const [users, opportunities, events] = await Promise.all([
    UserModel.countDocuments(),
    OpportunityModel.countDocuments(),
    EventModel.countDocuments(),
  ]);
  res.json({ users, opportunities, events });
});

export default router;
