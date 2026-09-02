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
  CampusBuddyHostModel,
  CampusBuddyRequestModel,
  CollaborationModel,
  ConnectionModel,
  EventModel,
  EventRegistrationModel,
  HelpRequestModel,
  InterviewExperienceModel,
  MentorshipRequestModel,
  MessageModel,
  NotificationModel,
  OpportunityModel,
  PostModel,
  ProjectShowcaseModel,
  ResearchProjectModel,
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

function serializePost(post: any, currentUserId?: string) {
  if (!post) return null;
  const plain = typeof post.toObject === "function" ? post.toObject() : post;
  const likes = (plain.likes || []).map((id: any) => String(id?._id || id));
  const savedBy = (plain.savedBy || []).map((id: any) => String(id?._id || id));
  const author = serializeUser(plain.authorId);
  const comments = (plain.comments || []).map((c: any) => ({
    id: String(c._id || c.id),
    text: c.text,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    user: serializeUser(c.userId),
    isMyComment: currentUserId ? String(c.userId?._id || c.userId?.id || c.userId) === currentUserId : false,
  }));

  return {
    id: String(plain._id || plain.id),
    content: plain.content,
    imageUrl: plain.imageUrl || null,
    category: plain.category || "General",
    campus: plain.campus,
    department: plain.department,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : new Date().toISOString(),
    author,
    likesCount: likes.length,
    commentsCount: comments.length,
    isLiked: currentUserId ? likes.includes(currentUserId) : false,
    isSaved: currentUserId ? savedBy.includes(currentUserId) : false,
    isMyPost: currentUserId ? String(plain.authorId?._id || plain.authorId?.id || plain.authorId) === currentUserId : false,
    comments,
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
      connectionsCount,
      pendingConnectionRequests,
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
      ConnectionModel.countDocuments({
        $or: [
          { senderId: userObjId, status: "accepted" },
          { receiverId: userObjId, status: "accepted" },
        ],
      }),
      ConnectionModel.countDocuments({
        receiverId: userObjId,
        status: "pending",
      }),
    ]);

    const registeredIds = new Set(registeredRows.map((r) => String(r.eventId)));
    const savedIds = new Set(savedRows.map((r) => String(r.opportunityId)));

    res.json({
      profileCompletion: 72,
      peopleCount,
      connectionsCount,
      pendingConnectionRequests,
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
    const userId = getUserId(req);
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
        .populate("members.userId")
        .populate("applications.userId")
        .lean(),
      CollaborationModel.countDocuments(filter),
    ]);

    const items = rows.map((collab: any) => {
      const isCreator = String(collab.creatorId?._id || collab.creatorId) === userId;
      const members = (collab.members || []).map((m: any) => ({
        user: serializeUser(m.userId),
        role: m.role || "Team Member",
        joinedAt: m.joinedAt,
      }));

      const myApp = (collab.applications || []).find(
        (a: any) => String(a.userId?._id || a.userId) === userId
      );

      const applications = isCreator
        ? (collab.applications || []).map((a: any) => ({
            id: String(a._id),
            user: serializeUser(a.userId),
            role: a.role,
            pitch: a.pitch,
            status: a.status,
            createdAt: a.createdAt,
          }))
        : undefined;

      const isMember = isCreator || members.some((m: any) => String(m.user?.id) === userId);

      return {
        id: String(collab._id),
        creator: serializeUser(collab.creatorId),
        title: collab.title,
        description: collab.description,
        requiredSkills: collab.requiredSkills || [],
        rolesNeeded: collab.rolesNeeded || [],
        teamSize: collab.teamSize,
        deadline: collab.deadline,
        category: collab.category,
        status: collab.status || "open",
        memberCount: Math.max(collab.memberCount || 1, members.length),
        members,
        isCreator,
        isMember,
        myApplication: myApp
          ? {
              id: String(myApp._id),
              role: myApp.role,
              pitch: myApp.pitch,
              status: myApp.status,
              createdAt: myApp.createdAt,
            }
          : null,
        applications,
        pendingApplicantsCount: (collab.applications || []).filter((a: any) => a.status === "pending").length,
        createdAt: collab.createdAt,
      };
    });

    res.json({
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/collaborations/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const collab: any = await CollaborationModel.findById(req.params.id)
      .populate("creatorId")
      .populate("members.userId")
      .populate("applications.userId")
      .lean();

    if (!collab) {
      res.status(404).json({ success: false, message: "Collaboration not found" });
      return;
    }

    const isCreator = String(collab.creatorId?._id || collab.creatorId) === userId;
    const members = (collab.members || []).map((m: any) => ({
      user: serializeUser(m.userId),
      role: m.role || "Team Member",
      joinedAt: m.joinedAt,
    }));

    const myApp = (collab.applications || []).find(
      (a: any) => String(a.userId?._id || a.userId) === userId
    );

    const applications = isCreator
      ? (collab.applications || []).map((a: any) => ({
          id: String(a._id),
          user: serializeUser(a.userId),
          role: a.role,
          pitch: a.pitch,
          status: a.status,
          createdAt: a.createdAt,
        }))
      : undefined;

    const isMember = isCreator || members.some((m: any) => String(m.user?.id) === userId);

    res.json({
      id: String(collab._id),
      creator: serializeUser(collab.creatorId),
      title: collab.title,
      description: collab.description,
      requiredSkills: collab.requiredSkills || [],
      rolesNeeded: collab.rolesNeeded || [],
      teamSize: collab.teamSize,
      deadline: collab.deadline,
      category: collab.category,
      status: collab.status || "open",
      memberCount: Math.max(collab.memberCount || 1, members.length),
      members,
      isCreator,
      isMember,
      myApplication: myApp
        ? {
            id: String(myApp._id),
            role: myApp.role,
            pitch: myApp.pitch,
            status: myApp.status,
            createdAt: myApp.createdAt,
          }
        : null,
      applications,
      pendingApplicantsCount: (collab.applications || []).filter((a: any) => a.status === "pending").length,
      createdAt: collab.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations", requireAuth, async (req, res, next) => {
  try {
    const input = CreateCollaborationBody.parse(req.body);
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const rolesNeeded = Array.isArray(req.body.rolesNeeded)
      ? req.body.rolesNeeded
      : typeof req.body.rolesNeeded === "string"
      ? req.body.rolesNeeded.split(",").map((r: string) => r.trim()).filter(Boolean)
      : [];

    const collaboration = await CollaborationModel.create({
      creatorId: userObjId,
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills,
      rolesNeeded,
      teamSize: input.teamSize,
      deadline: input.deadline.toISOString().slice(0, 10),
      category: input.category,
      status: "open",
      memberCount: 1,
      members: [
        {
          userId: userObjId,
          role: "Project Lead",
          joinedAt: new Date(),
        },
      ],
      applications: [],
    });

    const creator = await UserModel.findById(userId);
    res.status(201).json({
      ...collaboration.toObject(),
      id: String(collaboration._id),
      creator: serializeUser(creator),
      members: [{ user: serializeUser(creator), role: "Project Lead", joinedAt: new Date() }],
      rolesNeeded,
      status: "open",
      myApplication: null,
      isCreator: true,
      isMember: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations/:id/apply", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const { role = "Contributor", pitch } = req.body;

    if (!pitch || !pitch.trim()) {
      res.status(400).json({ success: false, message: "Please include a short pitch note about your experience" });
      return;
    }

    const [collab, applicant] = await Promise.all([
      CollaborationModel.findById(req.params.id),
      UserModel.findById(userId),
    ]);

    if (!collab) {
      res.status(404).json({ success: false, message: "Collaboration not found" });
      return;
    }

    if (String(collab.creatorId) === userId) {
      res.status(400).json({ success: false, message: "You are the creator of this project" });
      return;
    }

    if (collab.status !== "open") {
      res.status(400).json({ success: false, message: "This collaboration is no longer accepting applications" });
      return;
    }

    const isMember = (collab.members || []).some((m) => String(m.userId) === userId);
    if (isMember) {
      res.status(400).json({ success: false, message: "You are already a member of this project" });
      return;
    }

    const existingAppIdx = (collab.applications || []).findIndex(
      (a) => String(a.userId) === userId
    );

    if (existingAppIdx !== -1) {
      const existing = collab.applications[existingAppIdx];
      if (existing.status === "pending" || existing.status === "accepted") {
        res.status(400).json({ success: false, message: `You already have an ${existing.status} application for this project` });
        return;
      }
      collab.applications[existingAppIdx].status = "pending";
      collab.applications[existingAppIdx].role = role;
      collab.applications[existingAppIdx].pitch = pitch.trim();
      collab.applications[existingAppIdx].createdAt = new Date();
    } else {
      collab.applications.push({
        userId: userObjId,
        role: role.trim(),
        pitch: pitch.trim(),
        status: "pending",
        createdAt: new Date(),
      } as any);
    }

    await collab.save();

    await NotificationModel.create({
      userId: collab.creatorId,
      type: "collaboration_application",
      title: "New Collaboration Join Request",
      message: `${applicant?.fullName ?? "A student"} requested to join "${collab.title}" as ${role.trim()}.`,
    });

    res.json({
      success: true,
      message: "Application submitted successfully! The project lead will review your pitch.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations/:id/applications/:appId/accept", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id, appId } = req.params;

    const collab = await CollaborationModel.findById(id);
    if (!collab) {
      res.status(404).json({ success: false, message: "Collaboration not found" });
      return;
    }

    if (String(collab.creatorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the project lead can accept applications" });
      return;
    }

    const app = (collab.applications || []).find((a: any) => String(a._id) === appId);
    if (!app) {
      res.status(404).json({ success: false, message: "Application not found" });
      return;
    }

    app.status = "accepted";

    const alreadyMember = (collab.members || []).some((m) => String(m.userId) === String(app.userId));
    if (!alreadyMember) {
      collab.members.push({
        userId: app.userId,
        role: app.role || "Team Member",
        joinedAt: new Date(),
      });
      collab.memberCount = collab.members.length;
    }

    if (collab.members.length >= collab.teamSize) {
      collab.status = "closed";
    }

    await collab.save();

    await NotificationModel.create({
      userId: app.userId,
      type: "collaboration_accepted",
      title: "🎉 Application Accepted!",
      message: `You were accepted to join "${collab.title}" as ${app.role}! Check your collaboration dashboard.`,
    });

    res.json({ success: true, message: "Applicant accepted to team roster" });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations/:id/applications/:appId/reject", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id, appId } = req.params;

    const collab = await CollaborationModel.findById(id);
    if (!collab) {
      res.status(404).json({ success: false, message: "Collaboration not found" });
      return;
    }

    if (String(collab.creatorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the project lead can review applications" });
      return;
    }

    const app = (collab.applications || []).find((a: any) => String(a._id) === appId);
    if (!app) {
      res.status(404).json({ success: false, message: "Application not found" });
      return;
    }

    app.status = "rejected";
    await collab.save();

    await NotificationModel.create({
      userId: app.userId,
      type: "collaboration_rejected",
      title: "Application Status Update",
      message: `Your application to join "${collab.title}" was reviewed.`,
    });

    res.json({ success: true, message: "Application declined" });
  } catch (error) {
    next(error);
  }
});

router.patch("/collaborations/:id/status", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;
    if (!["open", "closed", "completed"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    const collab = await CollaborationModel.findById(req.params.id);
    if (!collab) {
      res.status(404).json({ success: false, message: "Collaboration not found" });
      return;
    }

    if (String(collab.creatorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the project lead can update status" });
      return;
    }

    collab.status = status;
    await collab.save();

    res.json({ success: true, status: collab.status });
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

router.get("/posts", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || "20"), 10) || 20));
    const filter: Record<string, any> = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.campus) {
      filter.campus = req.query.campus;
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.search) {
      filter.content = new RegExp(String(req.query.search), "i");
    }
    if (req.query.filter === "saved") {
      filter.savedBy = userObjId;
    } else if (req.query.filter === "my_posts") {
      filter.authorId = userObjId;
    }

    const [rows, total] = await Promise.all([
      PostModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("authorId")
        .populate("comments.userId")
        .lean(),
      PostModel.countDocuments(filter),
    ]);

    res.json({
      items: rows.map((post) => serializePost(post, userId)),
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/posts", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { content, imageUrl, category } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, message: "Post content is required" });
      return;
    }
    const author = await UserModel.findById(userId);
    if (!author) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const validCategories = [
      "General",
      "Achievement",
      "Project",
      "Opportunity",
      "Interview Experience",
      "Resource",
      "Question",
      "Help Needed",
    ];
    const postCategory = validCategories.includes(category) ? category : "General";

    const post = await PostModel.create({
      authorId: author._id,
      content: content.trim(),
      imageUrl: imageUrl && typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      category: postCategory,
      campus: author.campus,
      department: author.department,
      likes: [],
      comments: [],
      savedBy: [],
    });

    const populated = await PostModel.findById(post._id)
      .populate("authorId")
      .populate("comments.userId")
      .lean();

    res.status(201).json(serializePost(populated, userId));
  } catch (error) {
    next(error);
  }
});

router.patch("/posts/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { content, imageUrl, category } = req.body;
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    if (String(post.authorId) !== userId) {
      res.status(403).json({ success: false, message: "You can only edit your own posts" });
      return;
    }

    if (content !== undefined && typeof content === "string" && content.trim()) {
      post.content = content.trim();
    }
    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl && typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
    }
    if (category !== undefined) {
      const validCategories = [
        "General",
        "Achievement",
        "Project",
        "Opportunity",
        "Interview Experience",
        "Resource",
        "Question",
        "Help Needed",
      ];
      if (validCategories.includes(category)) {
        post.category = category as any;
      }
    }
    post.updatedAt = new Date();
    await post.save();

    const populated = await PostModel.findById(post._id)
      .populate("authorId")
      .populate("comments.userId")
      .lean();

    res.json(serializePost(populated, userId));
  } catch (error) {
    next(error);
  }
});

router.delete("/posts/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    const user = await UserModel.findById(userId);
    const isAdmin = user?.role === "admin";
    if (String(post.authorId) !== userId && !isAdmin) {
      res.status(403).json({ success: false, message: "You are not authorized to delete this post" });
      return;
    }
    await PostModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:id/like", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const isLiked = post.likes.some((id) => String(id) === userId);
    if (isLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId) as any;
    } else {
      post.likes.push(userObjId);
      if (String(post.authorId) !== userId) {
        const currentUser = await UserModel.findById(userId);
        await NotificationModel.create({
          userId: post.authorId,
          type: "post_like",
          title: "New like on your post",
          message: `${currentUser?.fullName ?? "A member"} liked your ${post.category.toLowerCase()} post.`,
        });
      }
    }
    await post.save();
    res.json({ id: String(post._id), isLiked: !isLiked, likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:id/save", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const isSaved = post.savedBy.some((id) => String(id) === userId);
    if (isSaved) {
      post.savedBy = post.savedBy.filter((id) => String(id) !== userId) as any;
    } else {
      post.savedBy.push(userObjId);
    }
    await post.save();
    res.json({ id: String(post._id), isSaved: !isSaved, savedCount: post.savedBy.length });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ success: false, message: "Comment text is required" });
      return;
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    post.comments.push({
      userId: userObjId,
      text: text.trim(),
      createdAt: new Date(),
    });
    await post.save();

    if (String(post.authorId) !== userId) {
      const currentUser = await UserModel.findById(userId);
      await NotificationModel.create({
        userId: post.authorId,
        type: "post_comment",
        title: "New comment on your post",
        message: `${currentUser?.fullName ?? "A member"} commented: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "..." : ""}"`,
      });
    }

    const populated = await PostModel.findById(post._id)
      .populate("authorId")
      .populate("comments.userId")
      .lean();

    res.status(201).json(serializePost(populated, userId));
  } catch (error) {
    next(error);
  }
});

router.delete("/posts/:id/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const comment = (post.comments as any).id(req.params.commentId);
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const user = await UserModel.findById(userId);
    const isAdmin = user?.role === "admin";
    if (String(comment.userId) !== userId && String(post.authorId) !== userId && !isAdmin) {
      res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
      return;
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/connections", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const [accepted, incoming, outgoing] = await Promise.all([
      ConnectionModel.find({
        $or: [
          { senderId: userObjId, status: "accepted" },
          { receiverId: userObjId, status: "accepted" },
        ],
      })
        .populate("senderId")
        .populate("receiverId")
        .sort({ updatedAt: -1 })
        .lean(),
      ConnectionModel.find({
        receiverId: userObjId,
        status: "pending",
      })
        .populate("senderId")
        .sort({ createdAt: -1 })
        .lean(),
      ConnectionModel.find({
        senderId: userObjId,
        status: "pending",
      })
        .populate("receiverId")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const connectedItems = accepted.map((conn) => {
      const isSender = String(conn.senderId?._id || conn.senderId) === userId;
      const otherUser = isSender ? conn.receiverId : conn.senderId;
      return {
        id: String(conn._id),
        user: serializeUser(otherUser),
        connectedAt: conn.updatedAt ? new Date(conn.updatedAt).toISOString() : new Date(conn.createdAt).toISOString(),
      };
    });

    const incomingItems = incoming.map((conn) => ({
      id: String(conn._id),
      user: serializeUser(conn.senderId),
      message: conn.message || null,
      createdAt: new Date(conn.createdAt).toISOString(),
    }));

    const outgoingItems = outgoing.map((conn) => ({
      id: String(conn._id),
      user: serializeUser(conn.receiverId),
      message: conn.message || null,
      createdAt: new Date(conn.createdAt).toISOString(),
    }));

    res.json({
      connected: connectedItems,
      incoming: incomingItems,
      outgoing: outgoingItems,
      totalConnected: connectedItems.length,
      pendingCount: incomingItems.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/connections/status/:userId", requireAuth, async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      res.json({ status: "self" });
      return;
    }

    const conn = await ConnectionModel.findOne({
      $or: [
        { senderId: toObjectId(currentUserId), receiverId: toObjectId(targetUserId) },
        { senderId: toObjectId(targetUserId), receiverId: toObjectId(currentUserId) },
      ],
    }).lean();

    if (!conn) {
      res.json({ status: "none" });
      return;
    }

    if (conn.status === "accepted") {
      res.json({ status: "accepted", connectionId: String(conn._id) });
      return;
    }

    if (conn.status === "pending") {
      if (String(conn.senderId) === currentUserId) {
        res.json({ status: "pending_sent", connectionId: String(conn._id) });
      } else {
        res.json({ status: "pending_received", connectionId: String(conn._id) });
      }
      return;
    }

    res.json({ status: "none" });
  } catch (error) {
    next(error);
  }
});

router.post("/connections", requireAuth, async (req, res, next) => {
  try {
    const senderId = getUserId(req);
    const { receiverId, message } = req.body;

    if (!receiverId || typeof receiverId !== "string") {
      res.status(400).json({ success: false, message: "Target user receiverId is required" });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ success: false, message: "You cannot connect with yourself" });
      return;
    }

    const [sender, receiver] = await Promise.all([
      UserModel.findById(senderId),
      UserModel.findById(receiverId),
    ]);

    if (!receiver) {
      res.status(404).json({ success: false, message: "Target user not found" });
      return;
    }

    const existing = await ConnectionModel.findOne({
      $or: [
        { senderId: toObjectId(senderId), receiverId: toObjectId(receiverId) },
        { senderId: toObjectId(receiverId), receiverId: toObjectId(senderId) },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        res.status(400).json({ success: false, message: "You are already connected with this user" });
        return;
      }
      if (existing.status === "pending") {
        res.status(400).json({ success: false, message: "A connection request is already pending" });
        return;
      }
      existing.senderId = toObjectId(senderId);
      existing.receiverId = toObjectId(receiverId);
      existing.status = "pending";
      existing.message = message?.trim() || null;
      await existing.save();

      await NotificationModel.create({
        userId: receiver._id,
        type: "connection_request",
        title: "New Connection Request",
        message: `${sender?.fullName ?? "A member"} sent you a connection request.`,
      });

      res.status(201).json({ success: true, connectionId: String(existing._id), status: "pending_sent" });
      return;
    }

    const connection = await ConnectionModel.create({
      senderId: toObjectId(senderId),
      receiverId: toObjectId(receiverId),
      status: "pending",
      message: message?.trim() || null,
    });

    await NotificationModel.create({
      userId: receiver._id,
      type: "connection_request",
      title: "New Connection Request",
      message: `${sender?.fullName ?? "A member"} sent you a connection request.`,
    });

    res.status(201).json({ success: true, connectionId: String(connection._id), status: "pending_sent" });
  } catch (error) {
    next(error);
  }
});

router.post("/connections/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const connection = await ConnectionModel.findById(req.params.id);

    if (!connection) {
      res.status(404).json({ success: false, message: "Connection request not found" });
      return;
    }

    if (String(connection.receiverId) !== userId) {
      res.status(403).json({ success: false, message: "Only the recipient can accept this connection request" });
      return;
    }

    connection.status = "accepted";
    connection.updatedAt = new Date();
    await connection.save();

    const currentUser = await UserModel.findById(userId);
    await NotificationModel.create({
      userId: connection.senderId,
      type: "connection_accepted",
      title: "Connection Request Accepted",
      message: `${currentUser?.fullName ?? "A member"} accepted your connection request. You are now connected!`,
    });

    res.json({ success: true, message: "Connection accepted", status: "accepted" });
  } catch (error) {
    next(error);
  }
});

router.post("/connections/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const connection = await ConnectionModel.findById(req.params.id);

    if (!connection) {
      res.status(404).json({ success: false, message: "Connection request not found" });
      return;
    }

    if (String(connection.receiverId) !== userId && String(connection.senderId) !== userId) {
      res.status(403).json({ success: false, message: "You are not authorized to reject this request" });
      return;
    }

    await ConnectionModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Connection request declined" });
  } catch (error) {
    next(error);
  }
});

router.delete("/connections/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const connection = await ConnectionModel.findById(req.params.id);

    if (!connection) {
      res.status(404).json({ success: false, message: "Connection not found" });
      return;
    }

    if (String(connection.senderId) !== userId && String(connection.receiverId) !== userId) {
      res.status(403).json({ success: false, message: "You are not authorized to modify this connection" });
      return;
    }

    await ConnectionModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Connection removed" });
  } catch (error) {
    next(error);
  }
});

router.get("/connections/suggestions", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const currentUser = await UserModel.findById(userId).lean();
    if (!currentUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const existingConnections = await ConnectionModel.find({
      $or: [{ senderId: toObjectId(userId) }, { receiverId: toObjectId(userId) }],
    }).lean();

    const excludedUserIds = new Set<string>([
      userId,
      ...existingConnections.map((c) => String(c.senderId)),
      ...existingConnections.map((c) => String(c.receiverId)),
    ]);

    const candidates = await UserModel.find({
      _id: { $nin: Array.from(excludedUserIds).map((id) => toObjectId(id)) },
      status: "active",
    })
      .limit(60)
      .lean();

    const scoredCandidates = candidates.map((cand) => {
      let score = 0;
      const reasons: string[] = [];

      if (cand.campus && cand.campus === currentUser.campus) {
        score += 30;
        reasons.push(`Same campus (${cand.campus})`);
      }

      if (cand.department && cand.department === currentUser.department) {
        score += 25;
        reasons.push(`Same department`);
      }

      const candSkills = cand.skills || [];
      const mySkills = currentUser.skills || [];
      const sharedSkills = candSkills.filter((s) => mySkills.some((ms) => ms.toLowerCase() === s.toLowerCase()));
      if (sharedSkills.length > 0) {
        score += sharedSkills.length * 15;
        reasons.push(`Shares skills: ${sharedSkills.slice(0, 3).join(", ")}`);
      }

      const candInterests = cand.interests || [];
      const myInterests = currentUser.interests || [];
      const sharedInterests = candInterests.filter((i) => myInterests.some((mi) => mi.toLowerCase() === i.toLowerCase()));
      if (sharedInterests.length > 0) {
        score += sharedInterests.length * 10;
        reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(", ")}`);
      }

      if (
        (currentUser.role === "student" && cand.role === "alumni") ||
        (currentUser.role === "alumni" && cand.role === "student") ||
        (currentUser.role === "researcher" && cand.role === "faculty")
      ) {
        score += 20;
        reasons.push(`Valuable network pair (${cand.role})`);
      }

      return {
        user: serializeUser(cand),
        score,
        reason: reasons[0] || `Amrita ${cand.campus} community`,
        matchingPoints: reasons,
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    res.json({
      items: scoredCandidates.slice(0, 12),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/messages/conversations", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const messages = await MessageModel.find({
      $or: [{ senderId: userObjId }, { recipientId: userObjId }],
    })
      .sort({ createdAt: -1 })
      .populate("senderId")
      .populate("recipientId")
      .lean();

    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const isSender = String(msg.senderId?._id || msg.senderId) === userId;
      const otherUserRaw = isSender ? msg.recipientId : msg.senderId;
      const otherUserId = String(otherUserRaw?._id || otherUserRaw?.id || otherUserRaw);

      if (!otherUserId || otherUserId === userId) continue;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUser: serializeUser(otherUserRaw),
          lastMessage: {
            id: String(msg._id),
            content: msg.content,
            createdAt: new Date(msg.createdAt).toISOString(),
            isMine: isSender,
            read: msg.read,
          },
          unreadCount: !isSender && !msg.read ? 1 : 0,
        });
      } else {
        if (!isSender && !msg.read) {
          const conv = conversationMap.get(otherUserId);
          conv.unreadCount += 1;
        }
      }
    }

    res.json({
      items: Array.from(conversationMap.values()),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/messages/:recipientId", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const recipientId = req.params.recipientId;
    const recipientObjId = toObjectId(recipientId);

    const [recipient, messages] = await Promise.all([
      UserModel.findById(recipientId).lean(),
      MessageModel.find({
        $or: [
          { senderId: userObjId, recipientId: recipientObjId },
          { senderId: recipientObjId, recipientId: userObjId },
        ],
      })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    if (!recipient) {
      res.status(404).json({ success: false, message: "Recipient user not found" });
      return;
    }

    await MessageModel.updateMany(
      { senderId: recipientObjId, recipientId: userObjId, read: false },
      { $set: { read: true } }
    );

    res.json({
      recipient: serializeUser(recipient),
      messages: messages.map((msg) => ({
        id: String(msg._id),
        senderId: String(msg.senderId),
        recipientId: String(msg.recipientId),
        content: msg.content,
        read: msg.read,
        createdAt: new Date(msg.createdAt).toISOString(),
        isMine: String(msg.senderId) === userId,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/messages", requireAuth, async (req, res, next) => {
  try {
    const senderId = getUserId(req);
    const { recipientId, content } = req.body;

    if (!recipientId || typeof recipientId !== "string") {
      res.status(400).json({ success: false, message: "Recipient ID is required" });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, message: "Message content cannot be empty" });
      return;
    }

    if (senderId === recipientId) {
      res.status(400).json({ success: false, message: "You cannot message yourself" });
      return;
    }

    const [sender, recipient] = await Promise.all([
      UserModel.findById(senderId),
      UserModel.findById(recipientId),
    ]);

    if (!recipient) {
      res.status(404).json({ success: false, message: "Recipient not found" });
      return;
    }

    const message = await MessageModel.create({
      senderId: toObjectId(senderId),
      recipientId: toObjectId(recipientId),
      content: content.trim(),
      read: false,
    });

    await NotificationModel.create({
      userId: recipient._id,
      type: "direct_message",
      title: "New direct message",
      message: `${sender?.fullName ?? "A member"}: "${content.trim().slice(0, 50)}${content.trim().length > 50 ? "..." : ""}"`,
    });

    res.status(201).json({
      id: String(message._id),
      senderId: String(message.senderId),
      recipientId: String(message.recipientId),
      content: message.content,
      read: message.read,
      createdAt: new Date(message.createdAt).toISOString(),
      isMine: true,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/messages/:recipientId/read", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const recipientId = req.params.recipientId;

    await MessageModel.updateMany(
      { senderId: toObjectId(recipientId), recipientId: toObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
});

router.get("/matchmaker/find", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const currentUser = await UserModel.findById(userId).lean();
    if (!currentUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const {
      intent = "hackathon",
      skills: requestedSkillsQuery = "",
      campus = "",
      department = "",
      role = "",
    } = req.query as Record<string, string>;

    const requestedSkills = requestedSkillsQuery
      ? requestedSkillsQuery
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const filter: Record<string, any> = {
      _id: { $ne: currentUser._id },
      status: "active",
    };

    if (campus) filter.campus = campus;
    if (department) filter.department = department;
    if (role) filter.role = role;

    const candidates = await UserModel.find(filter).lean();

    const scored = candidates.map((cand) => {
      let score = 40;
      const matchedTargetSkills: string[] = [];
      const synergyReasons: string[] = [];

      const candSkillsLower = (cand.skills || []).map((s) => s.toLowerCase());
      const candHelpWithLower = (cand.helpWith || []).map((s) => s.toLowerCase());
      const candLookingForLower = (cand.lookingFor || []).map((s) => s.toLowerCase());
      const myHelpWithLower = (currentUser.helpWith || []).map((s) => s.toLowerCase());
      const myLookingForLower = (currentUser.lookingFor || []).map((s) => s.toLowerCase());

      // 1. Requested skills match
      if (requestedSkills.length > 0) {
        for (const reqSkill of requestedSkills) {
          const foundIdx = candSkillsLower.findIndex((s) => s.includes(reqSkill) || reqSkill.includes(s));
          if (foundIdx !== -1) {
            score += 35;
            const originalSkill = cand.skills?.[foundIdx] || reqSkill;
            if (!matchedTargetSkills.includes(originalSkill)) {
              matchedTargetSkills.push(originalSkill);
            }
          }
        }
        if (matchedTargetSkills.length > 0) {
          synergyReasons.push(`Has skills: ${matchedTargetSkills.join(", ")}`);
        }
      }

      // 2. Intent-specific matching
      if (intent === "hackathon") {
        if (
          candHelpWithLower.some((s) => s.includes("hackathon") || s.includes("project")) ||
          candLookingForLower.some((s) => s.includes("hackathon") || s.includes("project"))
        ) {
          score += 35;
          synergyReasons.push("Active hackathon & project builder");
        }
        if (cand.role === "student" && cand.graduationYear && currentUser.graduationYear) {
          score += 15;
        }
      } else if (intent === "research") {
        if (
          candHelpWithLower.some((s) => s.includes("research")) ||
          candLookingForLower.some((s) => s.includes("research"))
        ) {
          score += 40;
          synergyReasons.push("Actively seeking research partnerships");
        }
        if (cand.role === "faculty" || cand.role === "researcher") {
          score += 30;
          synergyReasons.push(`Experienced ${cand.role} in ${cand.department}`);
        }
      } else if (intent === "project") {
        if (
          candHelpWithLower.some((s) => s.includes("project") || s.includes("startup")) ||
          candLookingForLower.some((s) => s.includes("project") || s.includes("startup"))
        ) {
          score += 35;
          synergyReasons.push("Open to project & product building");
        }
      } else if (intent === "mentorship") {
        if (cand.role === "alumni" || cand.role === "faculty") {
          score += 35;
          synergyReasons.push(`Verified ${cand.role} mentor`);
        }
        if (candHelpWithLower.some((s) => s.includes("interview") || s.includes("career") || s.includes("resume"))) {
          score += 40;
          synergyReasons.push("Offers career & interview guidance");
        }
      }

      // 3. Mutual Help Synergy
      const myNeedTheirHelp = myLookingForLower.some((need) =>
        candHelpWithLower.some((help) => help.includes(need) || need.includes(help))
      );
      if (myNeedTheirHelp) {
        score += 30;
        synergyReasons.push("Matches what you are looking for");
      }

      const theirNeedMyHelp = candLookingForLower.some((need) =>
        myHelpWithLower.some((help) => help.includes(need) || need.includes(help))
      );
      if (theirNeedMyHelp) {
        score += 25;
        synergyReasons.push("You offer skills they need");
      }

      // 4. Campus affinity
      if (cand.campus === currentUser.campus) {
        score += 15;
        synergyReasons.push(`Same campus (${cand.campus})`);
      } else {
        synergyReasons.push(`Cross-campus (${cand.campus})`);
      }

      const matchPercentage = Math.min(99, Math.max(55, Math.round((score / 175) * 100)));

      return {
        user: serializeUser(cand),
        score,
        matchPercentage,
        matchedSkills: matchedTargetSkills,
        reasons: synergyReasons.slice(0, 3),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({
      items: scored,
      total: scored.length,
      intent,
      requestedSkills,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/matchmaker/pitch", requireAuth, async (req, res, next) => {
  try {
    const senderId = getUserId(req);
    const { targetUserId, intent, projectName, message } = req.body;

    if (!targetUserId || !message?.trim()) {
      res.status(400).json({ success: false, message: "Target user ID and pitch message are required" });
      return;
    }

    const [sender, recipient] = await Promise.all([
      UserModel.findById(senderId),
      UserModel.findById(targetUserId),
    ]);

    if (!recipient) {
      res.status(404).json({ success: false, message: "Target user not found" });
      return;
    }

    const pitchContent = `🚀 [Team / Project Pitch: ${projectName || "Collaboration"}] (${intent ? intent.toUpperCase() : "GENERAL"})\n\n${message.trim()}`;

    const newMsg = await MessageModel.create({
      senderId: toObjectId(senderId),
      recipientId: toObjectId(targetUserId),
      content: pitchContent,
      read: false,
    });

    await NotificationModel.create({
      userId: recipient._id,
      type: "collaboration_pitch",
      title: `Team Pitch from ${sender?.fullName ?? "a member"}!`,
      message: `${sender?.fullName ?? "A member"} pitched you for "${projectName || "a project"}": "${message.trim().slice(0, 60)}..."`,
    });

    res.status(201).json({
      success: true,
      messageId: String(newMsg._id),
      message: "Pitch sent successfully via Direct Message",
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// INTERVIEW EXPERIENCE SHARING & GUIDANCE
// ==========================================

router.get("/interviews", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { search, company, role, outcome, difficulty, campus, page = 1, pageSize = 20 } = req.query;
    const filter: Record<string, any> = {};

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { company: regex },
        { role: regex },
        { keyTopics: regex },
        { overallExperience: regex },
      ];
    }

    if (company && typeof company === "string" && company.trim()) {
      filter.company = new RegExp(`^${company.trim()}$`, "i");
    }

    if (role && typeof role === "string" && role.trim()) {
      filter.role = new RegExp(role.trim(), "i");
    }

    if (outcome && typeof outcome === "string" && outcome.trim()) {
      filter.outcome = outcome.trim();
    }

    if (difficulty && typeof difficulty === "string" && difficulty.trim()) {
      filter.difficulty = difficulty.trim();
    }

    if (campus && typeof campus === "string" && campus.trim()) {
      filter.campus = campus.trim();
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(pageSize) || 20));

    const [rows, total] = await Promise.all([
      InterviewExperienceModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("authorId")
        .lean(),
      InterviewExperienceModel.countDocuments(filter),
    ]);

    const items = rows.map((item: any) => {
      const isAuthor = String(item.authorId?._id || item.authorId) === userId;
      const likes = (item.likes || []).map((id: any) => String(id?._id || id));
      const savedBy = (item.savedBy || []).map((id: any) => String(id?._id || id));

      return {
        id: String(item._id),
        author: serializeUser(item.authorId),
        company: item.company,
        role: item.role,
        employmentType: item.employmentType || "Full-time",
        batch: item.batch,
        campus: item.campus,
        outcome: item.outcome,
        difficulty: item.difficulty,
        interviewDate: item.interviewDate,
        rounds: item.rounds || [],
        keyTopics: item.keyTopics || [],
        overallExperience: item.overallExperience,
        prepAdvice: item.prepAdvice,
        likesCount: likes.length,
        isLiked: likes.includes(userId),
        isSaved: savedBy.includes(userId),
        isAuthor,
        createdAt: item.createdAt,
      };
    });

    res.json({
      items,
      page: pageNum,
      pageSize: limitNum,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/interviews/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const item: any = await InterviewExperienceModel.findById(req.params.id)
      .populate("authorId")
      .lean();

    if (!item) {
      res.status(404).json({ success: false, message: "Interview experience not found" });
      return;
    }

    const isAuthor = String(item.authorId?._id || item.authorId) === userId;
    const likes = (item.likes || []).map((id: any) => String(id?._id || id));
    const savedBy = (item.savedBy || []).map((id: any) => String(id?._id || id));

    res.json({
      id: String(item._id),
      author: serializeUser(item.authorId),
      company: item.company,
      role: item.role,
      employmentType: item.employmentType || "Full-time",
      batch: item.batch,
      campus: item.campus,
      outcome: item.outcome,
      difficulty: item.difficulty,
      interviewDate: item.interviewDate,
      rounds: item.rounds || [],
      keyTopics: item.keyTopics || [],
      overallExperience: item.overallExperience,
      prepAdvice: item.prepAdvice,
      likesCount: likes.length,
      isLiked: likes.includes(userId),
      isSaved: savedBy.includes(userId),
      isAuthor,
      createdAt: item.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/interviews", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);

    const {
      company,
      role,
      employmentType = "Full-time",
      batch,
      campus,
      outcome = "Offered",
      difficulty = "Medium",
      interviewDate,
      rounds = [],
      keyTopics = [],
      overallExperience,
      prepAdvice,
    } = req.body;

    if (!company || !role || !overallExperience || !prepAdvice) {
      res.status(400).json({ success: false, message: "Company, role, experience, and prep advice are required" });
      return;
    }

    const formattedRounds = Array.isArray(rounds)
      ? rounds.map((r: any, idx: number) => ({
          roundNumber: r.roundNumber || idx + 1,
          roundName: r.roundName || `Round ${idx + 1}`,
          description: r.description || "",
          durationMinutes: Number(r.durationMinutes) || 45,
        }))
      : [];

    const formattedTopics = Array.isArray(keyTopics)
      ? keyTopics
      : typeof keyTopics === "string"
      ? keyTopics.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const newInterview = await InterviewExperienceModel.create({
      authorId: userObjId,
      company: company.trim(),
      role: role.trim(),
      employmentType,
      batch: batch ? Number(batch) : user?.graduationYear,
      campus: campus || user?.campus || "Bengaluru",
      outcome,
      difficulty,
      interviewDate: interviewDate || new Date().toISOString().slice(0, 7),
      rounds: formattedRounds,
      keyTopics: formattedTopics,
      overallExperience: overallExperience.trim(),
      prepAdvice: prepAdvice.trim(),
      likes: [],
      savedBy: [],
    });

    // Cross-link: Automatically create an announcement post on Amrita Social Feed
    try {
      await PostModel.create({
        authorId: userObjId,
        content: `🎯 Just shared my ${company.trim()} interview experience for the ${role.trim()} role (${outcome})! \n\nKey topics covered: ${formattedTopics.slice(0, 4).join(", ") || "Technical DSA, System Design"}.\n\nCheck out the full rounds breakdown and prep tips in the Interviews tab!`,
        category: "Interview Experience",
        campus: user?.campus || "Bengaluru",
        department: user?.department || "Computer Science & Engineering",
        likes: [],
        savedBy: [],
        comments: [],
      });
    } catch {
      // Social post creation is non-blocking
    }

    res.status(201).json({
      id: String(newInterview._id),
      author: serializeUser(user),
      ...newInterview.toObject(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/interviews/:id/like", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const item = await InterviewExperienceModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: "Interview experience not found" });
      return;
    }

    const likes = (item.likes || []).map((id) => String(id));
    const alreadyLiked = likes.includes(userId);

    if (alreadyLiked) {
      item.likes = item.likes.filter((id) => String(id) !== userId);
    } else {
      item.likes.push(userObjId);
      if (String(item.authorId) !== userId) {
        const user = await UserModel.findById(userId);
        await NotificationModel.create({
          userId: item.authorId,
          type: "interview_like",
          title: "Your Interview Experience was liked!",
          message: `${user?.fullName ?? "A member"} found your ${item.company} interview post helpful.`,
        });
      }
    }

    await item.save();

    res.json({
      success: true,
      isLiked: !alreadyLiked,
      likesCount: item.likes.length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/interviews/:id/save", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const item = await InterviewExperienceModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: "Interview experience not found" });
      return;
    }

    const savedBy = (item.savedBy || []).map((id) => String(id));
    const alreadySaved = savedBy.includes(userId);

    if (alreadySaved) {
      item.savedBy = item.savedBy.filter((id) => String(id) !== userId);
    } else {
      item.savedBy.push(userObjId);
    }

    await item.save();

    res.json({
      success: true,
      isSaved: !alreadySaved,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/interviews/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await UserModel.findById(userId);
    const item = await InterviewExperienceModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: "Interview experience not found" });
      return;
    }

    if (String(item.authorId) !== userId && user?.role !== "admin") {
      res.status(403).json({ success: false, message: "You can only delete your own interview experiences" });
      return;
    }

    await InterviewExperienceModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Interview experience deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/interviews/:id/request-guidance", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const { topic = "Interview Guidance", message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: "Please enter your question or request note" });
      return;
    }

    const [item, sender] = await Promise.all([
      InterviewExperienceModel.findById(req.params.id).populate("authorId"),
      UserModel.findById(userId),
    ]);

    if (!item) {
      res.status(404).json({ success: false, message: "Interview experience not found" });
      return;
    }

    if (String(item.authorId?._id || item.authorId) === userId) {
      res.status(400).json({ success: false, message: "You cannot request guidance from yourself" });
      return;
    }

    const author = item.authorId as any;

    // Send direct message
    const formattedMsg = `🎓 [Interview Prep Request: ${item.company} - ${item.role}]\n\n"Hi ${author.fullName || "there"}! I saw your interview experience for ${item.company} on Amrita Connect and would appreciate your advice:\n\n${message.trim()}"`;

    await MessageModel.create({
      senderId: userObjId,
      recipientId: author._id,
      content: formattedMsg,
      read: false,
    });

    // Send in-app notification
    await NotificationModel.create({
      userId: author._id,
      type: "interview_guidance_request",
      title: "New Interview Prep Request",
      message: `${sender?.fullName ?? "A student"} requested interview guidance regarding your ${item.company} experience.`,
    });

    res.status(201).json({
      success: true,
      message: `Your request was sent to ${author.fullName || "the author"} via Direct Message!`,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// HELP & QUESTION SYSTEM ("I NEED HELP" MATCHING)
// ==========================================

router.get("/help-requests", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { search, category, urgency, status = "all", campus, tag, page = 1, pageSize = 20 } = req.query;
    const filter: Record<string, any> = {};

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    if (category && typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    if (urgency && typeof urgency === "string" && urgency.trim()) {
      filter.urgency = urgency.trim();
    }

    if (status && status !== "all" && typeof status === "string") {
      filter.status = status.trim();
    }

    if (campus && typeof campus === "string" && campus.trim()) {
      filter.campus = campus.trim();
    }

    if (tag && typeof tag === "string" && tag.trim()) {
      filter.tags = new RegExp(`^${tag.trim()}$`, "i");
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(pageSize) || 20));

    const [rows, total] = await Promise.all([
      HelpRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("authorId")
        .populate("replies.authorId")
        .lean(),
      HelpRequestModel.countDocuments(filter),
    ]);

    const items = rows.map((item: any) => {
      const isAuthor = String(item.authorId?._id || item.authorId) === userId;
      const upvotes = (item.upvotes || []).map((id: any) => String(id?._id || id));
      const hasAcceptedSolution = (item.replies || []).some((r: any) => r.isSolution);

      return {
        id: String(item._id),
        author: serializeUser(item.authorId),
        title: item.title,
        description: item.description,
        category: item.category,
        urgency: item.urgency,
        tags: item.tags || [],
        status: item.status || "open",
        campus: item.campus,
        department: item.department,
        upvotesCount: upvotes.length,
        isUpvoted: upvotes.includes(userId),
        repliesCount: (item.replies || []).length,
        hasAcceptedSolution,
        isAuthor,
        createdAt: item.createdAt,
      };
    });

    res.json({
      items,
      page: pageNum,
      pageSize: limitNum,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/help-requests/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const item: any = await HelpRequestModel.findById(req.params.id)
      .populate("authorId")
      .populate("replies.authorId")
      .lean();

    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    const isAuthor = String(item.authorId?._id || item.authorId) === userId;
    const upvotes = (item.upvotes || []).map((id: any) => String(id?._id || id));

    const replies = (item.replies || []).map((r: any) => {
      const rUpvotes = (r.upvotes || []).map((id: any) => String(id?._id || id));
      return {
        id: String(r._id),
        author: serializeUser(r.authorId),
        text: r.text,
        isSolution: r.isSolution || false,
        upvotesCount: rUpvotes.length,
        isUpvoted: rUpvotes.includes(userId),
        isAuthor: String(r.authorId?._id || r.authorId) === userId,
        createdAt: r.createdAt,
      };
    });

    res.json({
      id: String(item._id),
      author: serializeUser(item.authorId),
      title: item.title,
      description: item.description,
      category: item.category,
      urgency: item.urgency,
      tags: item.tags || [],
      status: item.status || "open",
      campus: item.campus,
      department: item.department,
      upvotesCount: upvotes.length,
      isUpvoted: upvotes.includes(userId),
      replies,
      repliesCount: replies.length,
      hasAcceptedSolution: replies.some((r: any) => r.isSolution),
      isAuthor,
      createdAt: item.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/help-requests/:id/suggested-helpers", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const helpReq = await HelpRequestModel.findById(req.params.id).lean();

    if (!helpReq) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    const targetTags = (helpReq.tags || []).map((t) => t.toLowerCase());
    const targetAuthorId = String(helpReq.authorId);

    const candidates = await UserModel.find({
      _id: { $nin: [toObjectId(userId), toObjectId(targetAuthorId)] },
      status: "active",
    }).lean();

    const scored = candidates
      .map((user: any) => {
        let score = 0;
        const reasons: string[] = [];

        const userHelpWith = (user.helpWith || []).map((h: string) => h.toLowerCase());
        const userSkills = (user.skills || []).map((s: string) => s.toLowerCase());

        targetTags.forEach((tag) => {
          const matchHelp = userHelpWith.some((h: string) => h.includes(tag) || tag.includes(h));
          if (matchHelp) {
            score += 40;
            reasons.push(`Can help with "${tag}"`);
          }

          const matchSkill = userSkills.some((s: string) => s.includes(tag) || tag.includes(s));
          if (matchSkill) {
            score += 30;
            reasons.push(`Skilled in "${tag}"`);
          }
        });

        if (user.role === "alumni" || user.role === "faculty") {
          score += 20;
          reasons.push(`${user.role.toUpperCase()} Mentor`);
        }

        if (user.campus === helpReq.campus) {
          score += 10;
          reasons.push(`Same campus (${user.campus})`);
        }

        return {
          user: serializeUser(user),
          score,
          reasons: reasons.slice(0, 3),
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json({
      items: scored,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/help-requests", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);

    const { title, description, category = "Academic", urgency = "Normal", tags = [] } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, message: "Title and description are required" });
      return;
    }

    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const newRequest = await HelpRequestModel.create({
      authorId: userObjId,
      title: title.trim(),
      description: description.trim(),
      category,
      urgency,
      tags: formattedTags,
      status: "open",
      campus: user?.campus || "Bengaluru",
      department: user?.department || "Computer Science & Engineering",
      replies: [],
      upvotes: [],
    });

    // Cross-link: Broadcast on Social Feed
    try {
      await PostModel.create({
        authorId: userObjId,
        content: `🆘 [Help Needed · ${category}] ${title.trim()}\n\n${description.trim().slice(0, 180)}...\n\nCan you help? Open the Help Desk to answer or discuss!`,
        category: "Help Needed",
        campus: user?.campus || "Bengaluru",
        department: user?.department || "Computer Science & Engineering",
        likes: [],
        savedBy: [],
        comments: [],
      });
    } catch {
      // Social post creation is non-blocking
    }

    res.status(201).json({
      id: String(newRequest._id),
      author: serializeUser(user),
      ...newRequest.toObject(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/help-requests/:id/replies", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: "Answer text cannot be empty" });
      return;
    }

    const [item, replier] = await Promise.all([
      HelpRequestModel.findById(req.params.id),
      UserModel.findById(userId),
    ]);

    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    item.replies.push({
      authorId: userObjId,
      text: text.trim(),
      isSolution: false,
      upvotes: [],
      createdAt: new Date(),
    } as any);

    await item.save();

    if (String(item.authorId) !== userId) {
      await NotificationModel.create({
        userId: item.authorId,
        type: "help_reply",
        title: "New Answer to your Question",
        message: `${replier?.fullName ?? "A member"} answered: "${item.title.slice(0, 45)}..."`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Answer posted successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/help-requests/:id/replies/:replyId/accept", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id, replyId } = req.params;

    const item = await HelpRequestModel.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    if (String(item.authorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the question author can accept a solution" });
      return;
    }

    let solverAuthorId: any = null;

    item.replies.forEach((r: any) => {
      if (String(r._id) === replyId) {
        r.isSolution = true;
        solverAuthorId = r.authorId;
      } else {
        r.isSolution = false;
      }
    });

    item.status = "solved";
    item.solvedByReplyId = replyId;
    await item.save();

    if (solverAuthorId && String(solverAuthorId) !== userId) {
      await NotificationModel.create({
        userId: solverAuthorId,
        type: "solution_accepted",
        title: "🎉 Your Solution Was Accepted!",
        message: `Your answer to "${item.title}" was marked as the accepted solution by the author!`,
      });
    }

    res.json({ success: true, message: "Accepted solution updated!" });
  } catch (error) {
    next(error);
  }
});

router.post("/help-requests/:id/upvote", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const item = await HelpRequestModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    const upvotes = (item.upvotes || []).map((id) => String(id));
    const alreadyUpvoted = upvotes.includes(userId);

    if (alreadyUpvoted) {
      item.upvotes = item.upvotes.filter((id) => String(id) !== userId);
    } else {
      item.upvotes.push(userObjId);
    }

    await item.save();

    res.json({
      success: true,
      isUpvoted: !alreadyUpvoted,
      upvotesCount: item.upvotes.length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/help-requests/:id/replies/:replyId/upvote", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const { id, replyId } = req.params;

    const item = await HelpRequestModel.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    const reply = (item.replies || []).find((r: any) => String(r._id) === replyId);
    if (!reply) {
      res.status(404).json({ success: false, message: "Answer not found" });
      return;
    }

    const upvotes = (reply.upvotes || []).map((uid: any) => String(uid));
    const alreadyUpvoted = upvotes.includes(userId);

    if (alreadyUpvoted) {
      reply.upvotes = reply.upvotes.filter((uid: any) => String(uid) !== userId);
    } else {
      reply.upvotes.push(userObjId);
    }

    await item.save();

    res.json({
      success: true,
      isUpvoted: !alreadyUpvoted,
      upvotesCount: reply.upvotes.length,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/help-requests/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await UserModel.findById(userId);
    const item = await HelpRequestModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: "Help request not found" });
      return;
    }

    if (String(item.authorId) !== userId && user?.role !== "admin") {
      res.status(403).json({ success: false, message: "You can only delete your own help requests" });
      return;
    }

    await HelpRequestModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Help request deleted" });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CROSS-CAMPUS CAMPUS BUDDY & LOCAL GUIDES
// ==========================================

const CAMPUS_GUIDE_DATA: Record<string, any> = {
  Bengaluru: {
    campus: "Bengaluru",
    tagline: "Silicon Valley Gateway · Kasavanahalli, Off Sarjapur Road",
    highlights: [
      "AI & Robotics Research Labs with high-performance GPU clusters",
      "Vibrant central library & 24/7 collaborative workspace",
      "Close proximity to Koramangala, Bellandur, and Electronic City tech hubs",
    ],
    transit: "Nearest Metro: Silk Institute / Electronic City. Bus Route: 342F from Majestic to Amrita College stop.",
    foodSpots: "Main Dining Hall, Amriteshwari Canteen, Campus Juice Corner, and Sarjapur Road food strip.",
    hackathonHostels: "Inter-campus guest rooms available at Block 3 & 4 with high-speed WiFi.",
  },
  Coimbatore: {
    campus: "Coimbatore",
    tagline: "Ettimadai Valley · Flagship Green Campus",
    highlights: [
      "Sprawling 400+ acre campus situated at the foothills of Western Ghats",
      "CEN (Center for Computational Engineering and Networking) & HuT Labs",
      "Anokha Techfest central arena and Olympic-size sports complex",
    ],
    transit: "Direct Ettimadai Railway Station just 500m from campus entrance. Frequent local trains from Coimbatore Junction.",
    foodSpots: "Main Canteen, Nescafe Kiosk, Night Canteen at Hostels, and Ettimadai junction eateries.",
    hackathonHostels: "Dedicated guest hostels for Anokha and Pragyan visiting delegations.",
  },
  Amritapuri: {
    campus: "Amritapuri",
    tagline: "Vallikavu, Clappana · Cyber Security & Competitive Coding Hub",
    highlights: [
      "Home to FOSS@Amrita and team bi0s (India's #1 CTF Cyber Security Team)",
      "AMMACHI Labs (Robotics and Haptics) & coastal beachside campus",
      "World-class competitive programming culture (ICPC World Finalists hub)",
    ],
    transit: "Nearest Railway: Kayamkulam Junction / Karunagappally. Boat jetty connecting to campus across backwaters.",
    foodSpots: "Beachside Canteen, Western Cafe, Annapoorna Dining, and Vallikavu village eateries.",
    hackathonHostels: "Campus Guest House & Student Hostels with backwater views.",
  },
  Amaravati: {
    campus: "Amaravati",
    tagline: "Capital Region, Andhra Pradesh · Ultra-Modern Smart Campus",
    highlights: [
      "Brand new futuristic infrastructure with next-gen smart classrooms",
      "Specialized AI, Cloud, and Data Engineering research centers",
      "Innovation & Incubation center supporting student startups",
    ],
    transit: "Nearest Railway: Vijayawada Junction (BZA) or Guntur Junction. Dedicated Amrita shuttle buses.",
    foodSpots: "Central Food Court, Café Coffee Day corner, and campus student store.",
    hackathonHostels: "Newly commissioned air-conditioned hostel towers with high-speed mesh WiFi.",
  },
  Chennai: {
    campus: "Chennai",
    tagline: "Vengal, Thiruvallur · Emerging Automotive & Industrial Tech Hub",
    highlights: [
      "Advanced EV Propulsion & Autonomous Vehicle Testing Track",
      "IoT and Embedded Systems innovation center",
      "Strong industrial partnership with Chennai automotive corridor",
    ],
    transit: "Nearest Railway: Thiruvallur. College express buses from all parts of Chennai city.",
    foodSpots: "Multi-cuisine student canteen, juice corner, and bakery.",
    hackathonHostels: "Student residential blocks with seminar halls and 24/7 labs.",
  },
  Kochi: {
    campus: "Kochi",
    tagline: "Edappally / AIMS · Premier Healthcare, Biotech & Nano-Sciences",
    highlights: [
      "Amrita Center for Nanosciences and Molecular Medicine (ACNSMM)",
      "Asia's foremost robotic surgery and AI healthcare testbed",
      "Interdisciplinary biomedical engineering & hospital systems integration",
    ],
    transit: "Nearest Metro: Edappally / Changampuzha Park. Very close to Lulu Mall and NH 66.",
    foodSpots: "Hospital Central Food Court, College Canteen, and Edappally food street.",
    hackathonHostels: "Guest rooms and medical trainee residential blocks.",
  },
  Mysuru: {
    campus: "Mysuru",
    tagline: "Bogadi Road · Arts, Sciences, Education & Digital Media",
    highlights: [
      "Visual Media & Animation production studios",
      "Center for Information Technology & Commerce studies",
      "Serene cultural environment close to Mysore Palace and Chamundi Hills",
    ],
    transit: "Nearest Railway: Mysuru Junction. City buses (Route 255) from City Bus Stand to Amrita Bogadi.",
    foodSpots: "Campus Cafeteria, Nescafe Lounge, and Bogadi Road cafes.",
    hackathonHostels: "Hostel accommodation for inter-campus symposium participants.",
  },
};

router.get("/campus-buddies/guide/:campus", requireAuth, (req, res) => {
  const campus = req.params.campus;
  const guide = CAMPUS_GUIDE_DATA[campus] || CAMPUS_GUIDE_DATA.Bengaluru;
  res.json({ success: true, guide });
});

router.get("/campus-buddies", requireAuth, async (req, res, next) => {
  try {
    const { campus, service, search, availability } = req.query;
    const filter: Record<string, any> = {};

    if (campus && typeof campus === "string" && campus.trim()) {
      filter.campus = campus.trim();
    }

    if (service && typeof service === "string" && service.trim()) {
      filter.servicesOffered = new RegExp(service.trim(), "i");
    }

    if (availability && typeof availability === "string" && availability.trim()) {
      filter.availability = availability.trim();
    }

    const hosts = await CampusBuddyHostModel.find(filter).populate("userId").lean();

    let items = hosts.map((h: any) => {
      const user = serializeUser(h.userId);
      const reviews = h.reviews || [];
      const avgRating = reviews.length
        ? Number((reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
        : 5.0;

      return {
        id: String(h._id),
        user,
        campus: h.campus,
        department: h.department,
        servicesOffered: h.servicesOffered || [],
        bio: h.bio,
        languages: h.languages || ["English"],
        availability: h.availability || "Available",
        rating: avgRating,
        reviewsCount: reviews.length,
        createdAt: h.createdAt,
      };
    });

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.user?.fullName?.toLowerCase().includes(q) ||
          i.bio?.toLowerCase().includes(q) ||
          i.servicesOffered.some((s: string) => s.toLowerCase().includes(q)) ||
          i.languages.some((l: string) => l.toLowerCase().includes(q))
      );
    }

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get("/campus-buddies/my-host-profile", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const host = await CampusBuddyHostModel.findOne({ userId: toObjectId(userId) }).populate("userId").lean();

    if (!host) {
      res.json({ isHost: false, profile: null });
      return;
    }

    res.json({
      isHost: true,
      profile: {
        id: String(host._id),
        user: serializeUser(host.userId),
        campus: host.campus,
        department: host.department,
        servicesOffered: host.servicesOffered || [],
        bio: host.bio,
        languages: host.languages || ["English"],
        availability: host.availability || "Available",
        createdAt: host.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/campus-buddies/register-host", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);

    const { campus, department, servicesOffered = [], bio, languages = ["English"], availability = "Available" } = req.body;

    if (!bio || !bio.trim()) {
      res.status(400).json({ success: false, message: "A short buddy bio is required" });
      return;
    }

    const targetCampus = campus || user?.campus || "Bengaluru";
    const targetDept = department || user?.department || "Computer Science & Engineering";

    const formattedServices = Array.isArray(servicesOffered)
      ? servicesOffered
      : typeof servicesOffered === "string"
      ? (servicesOffered as string).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const formattedLanguages = Array.isArray(languages)
      ? languages
      : typeof languages === "string"
      ? (languages as string).split(",").map((l) => l.trim()).filter(Boolean)
      : ["English"];

    const host = await CampusBuddyHostModel.findOneAndUpdate(
      { userId: userObjId },
      {
        userId: userObjId,
        campus: targetCampus,
        department: targetDept,
        servicesOffered: formattedServices,
        bio: bio.trim(),
        languages: formattedLanguages,
        availability,
      },
      { upsert: true, new: true }
    );

    // Broadcast on Social Feed
    try {
      await PostModel.create({
        authorId: userObjId,
        content: `🎒 I just registered as a Campus Buddy for Amrita ${targetCampus}!\n\nVisiting our campus for hackathons, labs, or campus tours? Hit me up in the Campus Buddy hub!`,
        category: "Campus Life",
        campus: targetCampus,
        department: targetDept,
        likes: [],
        savedBy: [],
        comments: [],
      });
    } catch {
      // ignore non-critical broadcast error
    }

    res.status(201).json({
      success: true,
      message: "Campus Buddy Host profile saved successfully!",
      host,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/campus-buddies/request", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const requester = await UserModel.findById(userId);

    const { hostUserId, targetCampus, visitReason = "General Visit", visitDates, notes = "" } = req.body;

    if (!hostUserId || !targetCampus || !visitDates) {
      res.status(400).json({ success: false, message: "Host, target campus, and visit dates are required" });
      return;
    }

    const hostUser = await UserModel.findById(hostUserId);
    if (!hostUser) {
      res.status(404).json({ success: false, message: "Host user not found" });
      return;
    }

    const buddyRequest = await CampusBuddyRequestModel.create({
      requesterId: userObjId,
      hostId: toObjectId(hostUserId),
      targetCampus,
      visitReason,
      visitDates,
      notes: notes.trim(),
      status: "pending",
    });

    // Notify Host in-app
    await NotificationModel.create({
      userId: hostUser._id,
      type: "campus_buddy_request",
      title: "🎒 New Campus Buddy Request",
      message: `${requester?.fullName ?? "A student"} requested your guidance for a visit to Amrita ${targetCampus} (${visitDates}).`,
    });

    // Send direct message thread to start conversation
    await MessageModel.create({
      senderId: userObjId,
      recipientId: hostUser._id,
      content: `👋 Hi ${hostUser.fullName}! I sent you a Campus Buddy request for my upcoming visit to Amrita ${targetCampus} on ${visitDates} (${visitReason}).\n\nNotes: ${notes || "Looking forward to connecting!"}`,
      read: false,
    });

    res.status(201).json({
      success: true,
      message: `Your Campus Buddy request was sent to ${hostUser.fullName}! We also opened a direct message chat.`,
      request: buddyRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/campus-buddies/my-requests", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);

    const [incoming, outgoing] = await Promise.all([
      CampusBuddyRequestModel.find({ hostId: userObjId }).populate("requesterId").sort({ createdAt: -1 }).lean(),
      CampusBuddyRequestModel.find({ requesterId: userObjId }).populate("hostId").sort({ createdAt: -1 }).lean(),
    ]);

    const serializedIncoming = incoming.map((r: any) => ({
      id: String(r._id),
      requester: serializeUser(r.requesterId),
      targetCampus: r.targetCampus,
      visitReason: r.visitReason,
      visitDates: r.visitDates,
      notes: r.notes,
      status: r.status,
      createdAt: r.createdAt,
    }));

    const serializedOutgoing = outgoing.map((r: any) => ({
      id: String(r._id),
      host: serializeUser(r.hostId),
      targetCampus: r.targetCampus,
      visitReason: r.visitReason,
      visitDates: r.visitDates,
      notes: r.notes,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      incoming: serializedIncoming,
      outgoing: serializedOutgoing,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/campus-buddies/requests/:id/respond", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body; // 'accepted' | 'declined'

    if (!["accepted", "declined"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be 'accepted' or 'declined'" });
      return;
    }

    const item = await CampusBuddyRequestModel.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (String(item.hostId) !== userId) {
      res.status(403).json({ success: false, message: "Only the host can respond to this request" });
      return;
    }

    item.status = status;
    await item.save();

    const [hostUser, requesterUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(item.requesterId),
    ]);

    if (requesterUser && hostUser) {
      const isAccepted = status === "accepted";
      await NotificationModel.create({
        userId: requesterUser._id,
        type: isAccepted ? "campus_buddy_accepted" : "campus_buddy_declined",
        title: isAccepted ? "🎉 Campus Buddy Request Accepted!" : "Campus Buddy Request Update",
        message: isAccepted
          ? `${hostUser.fullName} accepted your Campus Buddy guide request for Amrita ${item.targetCampus} (${item.visitDates})!`
          : `${hostUser.fullName} was unavailable for your visit dates to Amrita ${item.targetCampus}.`,
      });

      if (isAccepted) {
        await MessageModel.create({
          senderId: hostUser._id,
          recipientId: requesterUser._id,
          content: `🎉 Hi ${requesterUser.fullName}! I have accepted your Campus Buddy request for ${item.targetCampus} on ${item.visitDates}. Feel free to drop me a message here regarding arrival times and meeting spots!`,
          read: false,
        });
      }
    }

    res.json({
      success: true,
      message: `Request marked as ${status}!`,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// RESEARCH & FACULTY COLLABORATION HUB
// ==========================================

router.get("/research-projects", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { campus, category, status = "all", search, page = 1, pageSize = 20 } = req.query;
    const filter: Record<string, any> = {};

    if (campus && typeof campus === "string" && campus.trim()) {
      filter.campus = campus.trim();
    }

    if (category && typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    if (status && status !== "all" && typeof status === "string") {
      filter.status = status.trim();
    }

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { labName: regex }, { abstract: regex }, { "openPositions.prerequisites": regex }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(pageSize) || 20));

    const [rows, total] = await Promise.all([
      ResearchProjectModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("principalInvestigatorId")
        .populate("coInvestigators")
        .populate("applications.applicantId")
        .lean(),
      ResearchProjectModel.countDocuments(filter),
    ]);

    const items = rows.map((p: any) => {
      const pi = serializeUser(p.principalInvestigatorId);
      const isPI = String(p.principalInvestigatorId?._id || p.principalInvestigatorId) === userId;
      const coInvestigators = (p.coInvestigators || []).map(serializeUser);
      const bookmarks = (p.bookmarks || []).map((id: any) => String(id?._id || id));

      const myApp = (p.applications || []).find(
        (a: any) => String(a.applicantId?._id || a.applicantId) === userId
      );

      return {
        id: String(p._id),
        principalInvestigator: pi,
        coInvestigators,
        title: p.title,
        labName: p.labName,
        fundingSource: p.fundingSource,
        campus: p.campus,
        department: p.department,
        category: p.category,
        abstract: p.abstract,
        objectives: p.objectives || [],
        openPositions: p.openPositions || [],
        publications: p.publications || [],
        status: p.status || "recruiting",
        applicationsCount: (p.applications || []).length,
        myApplication: myApp
          ? {
              id: String(myApp._id),
              roleAppliedFor: myApp.roleAppliedFor,
              status: myApp.status,
              appliedAt: myApp.appliedAt,
            }
          : null,
        isBookmarked: bookmarks.includes(userId),
        isPI,
        createdAt: p.createdAt,
      };
    });

    res.json({
      items,
      total,
      page: pageNum,
      pageSize: limitNum,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/research-projects/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const p: any = await ResearchProjectModel.findById(req.params.id)
      .populate("principalInvestigatorId")
      .populate("coInvestigators")
      .populate("applications.applicantId")
      .lean();

    if (!p) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    const pi = serializeUser(p.principalInvestigatorId);
    const isPI = String(p.principalInvestigatorId?._id || p.principalInvestigatorId) === userId;
    const coInvestigators = (p.coInvestigators || []).map(serializeUser);
    const bookmarks = (p.bookmarks || []).map((id: any) => String(id?._id || id));

    const applications = (p.applications || []).map((a: any) => ({
      id: String(a._id),
      applicant: serializeUser(a.applicantId),
      roleAppliedFor: a.roleAppliedFor,
      statementOfInterest: a.statementOfInterest,
      relevantSkills: a.relevantSkills || [],
      status: a.status,
      appliedAt: a.appliedAt,
    }));

    const myApp = applications.find(
      (a: any) => String(a.applicant?.id) === userId
    );

    res.json({
      id: String(p._id),
      principalInvestigator: pi,
      coInvestigators,
      title: p.title,
      labName: p.labName,
      fundingSource: p.fundingSource,
      campus: p.campus,
      department: p.department,
      category: p.category,
      abstract: p.abstract,
      objectives: p.objectives || [],
      openPositions: p.openPositions || [],
      publications: p.publications || [],
      status: p.status || "recruiting",
      applicationsCount: applications.length,
      applications: isPI ? applications : undefined,
      myApplication: myApp || null,
      isBookmarked: bookmarks.includes(userId),
      isPI,
      createdAt: p.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/research-projects", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);

    const {
      title,
      labName,
      fundingSource,
      campus,
      department,
      category = "Artificial Intelligence",
      abstract,
      objectives = [],
      openPositions = [],
      publications = [],
    } = req.body;

    if (!title || !labName || !abstract) {
      res.status(400).json({ success: false, message: "Title, lab name, and abstract are required" });
      return;
    }

    const formattedObjectives = Array.isArray(objectives)
      ? objectives
      : typeof objectives === "string"
      ? (objectives as string).split("\n").map((o) => o.trim()).filter(Boolean)
      : [];

    const project = await ResearchProjectModel.create({
      principalInvestigatorId: userObjId,
      coInvestigators: [],
      title: title.trim(),
      labName: labName.trim(),
      fundingSource: fundingSource?.trim(),
      campus: campus || user?.campus || "Coimbatore",
      department: department || user?.department || "Computer Science & Engineering",
      category,
      abstract: abstract.trim(),
      objectives: formattedObjectives,
      openPositions: Array.isArray(openPositions) ? openPositions : [],
      publications: Array.isArray(publications) ? publications : [],
      status: "recruiting",
      applications: [],
      bookmarks: [],
    });

    // Cross-link: Broadcast on Social Feed
    try {
      await PostModel.create({
        authorId: userObjId,
        content: `🔬 [Research Call · ${category}] ${title.trim()} (${labName.trim()})\n\n${abstract.trim().slice(0, 180)}...\n\nFaculty & student research positions open! Express interest on the Research Hub.`,
        category: "Research",
        campus: project.campus,
        department: project.department,
        likes: [],
        savedBy: [],
        comments: [],
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({
      success: true,
      message: "Research project published successfully!",
      id: String(project._id),
      project,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/research-projects/:id/apply", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const applicant = await UserModel.findById(userId);

    const { roleAppliedFor = "Research Assistant", statementOfInterest, relevantSkills = [] } = req.body;

    if (!statementOfInterest || !statementOfInterest.trim()) {
      res.status(400).json({ success: false, message: "Statement of interest is required" });
      return;
    }

    const project = await ResearchProjectModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    if (String(project.principalInvestigatorId) === userId) {
      res.status(400).json({ success: false, message: "You cannot apply to your own research project" });
      return;
    }

    const existingApp = (project.applications || []).find(
      (a: any) => String(a.applicantId) === userId
    );

    if (existingApp) {
      res.status(400).json({ success: false, message: "You have already applied to this research project" });
      return;
    }

    const formattedSkills = Array.isArray(relevantSkills)
      ? relevantSkills
      : typeof relevantSkills === "string"
      ? (relevantSkills as string).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    project.applications.push({
      applicantId: userObjId,
      roleAppliedFor,
      statementOfInterest: statementOfInterest.trim(),
      relevantSkills: formattedSkills,
      status: "pending",
      appliedAt: new Date(),
    } as any);

    await project.save();

    // Notify PI
    const pi = await UserModel.findById(project.principalInvestigatorId);
    if (pi) {
      await NotificationModel.create({
        userId: pi._id,
        type: "research_interest",
        title: "🔬 New Research Interest Received",
        message: `${applicant?.fullName ?? "A student"} expressed interest in "${project.title.slice(0, 40)}..." for ${roleAppliedFor}.`,
      });

      // Direct Message to PI
      await MessageModel.create({
        senderId: userObjId,
        recipientId: pi._id,
        content: `👋 Dear Professor ${pi.fullName}, I submitted an Expression of Interest for your research project "${project.title}" (${roleAppliedFor}).\n\nStatement of Interest:\n${statementOfInterest.trim()}\n\nLooking forward to contributing to ${project.labName}!`,
        read: false,
      });
    }

    res.status(201).json({
      success: true,
      message: "Your research application was submitted to the Principal Investigator!",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/research-projects/:id/applications/:appId/respond", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id, appId } = req.params;
    const { status } = req.body; // 'accepted' | 'declined'

    if (!["accepted", "declined"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be 'accepted' or 'declined'" });
      return;
    }

    const project = await ResearchProjectModel.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    if (String(project.principalInvestigatorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the Principal Investigator can respond to applications" });
      return;
    }

    const app = (project.applications || []).find((a: any) => String(a._id) === appId);
    if (!app) {
      res.status(404).json({ success: false, message: "Application not found" });
      return;
    }

    app.status = status;
    await project.save();

    const [pi, applicant] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(app.applicantId),
    ]);

    if (applicant && pi) {
      const isAccepted = status === "accepted";
      await NotificationModel.create({
        userId: applicant._id,
        type: isAccepted ? "research_accepted" : "research_declined",
        title: isAccepted ? "🎉 Research Application Accepted!" : "Research Application Update",
        message: isAccepted
          ? `Prof. ${pi.fullName} accepted your application for "${project.title}" at ${project.labName}!`
          : `Your application for "${project.title}" was not selected at this time.`,
      });

      if (isAccepted) {
        await MessageModel.create({
          senderId: pi._id,
          recipientId: applicant._id,
          content: `🎉 Congratulations ${applicant.fullName}! I have accepted your research interest for "${project.title}". Welcome to ${project.labName}! Let's schedule a kickoff call to discuss initial research milestones.`,
          read: false,
        });
      }
    }

    res.json({
      success: true,
      message: `Application marked as ${status}!`,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/research-projects/:id/bookmark", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const project = await ResearchProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    const bookmarks = (project.bookmarks || []).map((id) => String(id));
    const alreadyBookmarked = bookmarks.includes(userId);

    if (alreadyBookmarked) {
      project.bookmarks = project.bookmarks.filter((id) => String(id) !== userId);
    } else {
      project.bookmarks.push(userObjId);
    }

    await project.save();

    res.json({
      success: true,
      isBookmarked: !alreadyBookmarked,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/research-projects/:id/status", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body; // 'recruiting' | 'active' | 'completed'

    if (!["recruiting", "active", "completed"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    const project = await ResearchProjectModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    if (String(project.principalInvestigatorId) !== userId) {
      res.status(403).json({ success: false, message: "Only the Principal Investigator can update status" });
      return;
    }

    project.status = status;
    await project.save();

    res.json({ success: true, message: `Project status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

router.delete("/research-projects/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await UserModel.findById(userId);
    const project = await ResearchProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: "Research project not found" });
      return;
    }

    if (String(project.principalInvestigatorId) !== userId && user?.role !== "admin") {
      res.status(403).json({ success: false, message: "You can only delete your own research projects" });
      return;
    }

    await ResearchProjectModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Research project deleted" });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PROJECT SHOWCASE & INNOVATION GALLERY
// ==========================================

router.get("/showcase", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { category, campus, search, sortBy = "upvotes", page = 1, pageSize = 20 } = req.query;
    const filter: Record<string, any> = {};

    if (category && typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    if (campus && typeof campus === "string" && campus.trim()) {
      filter.campus = campus.trim();
    }

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { tagline: regex }, { description: regex }, { techStack: regex }, { award: regex }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(pageSize) || 20));

    let query = ProjectShowcaseModel.find(filter)
      .populate("authorId")
      .populate("teamMembers")
      .populate("comments.authorId")
      .lean();

    if (sortBy === "recent") {
      query = query.sort({ createdAt: -1 });
    } else {
      query = query.sort({ "upvotes.length": -1, createdAt: -1 });
    }

    const [rows, total] = await Promise.all([
      query.skip((pageNum - 1) * limitNum).limit(limitNum),
      ProjectShowcaseModel.countDocuments(filter),
    ]);

    const items = rows.map((p: any) => {
      const author = serializeUser(p.authorId);
      const teamMembers = (p.teamMembers || []).map(serializeUser);
      const isAuthor = String(p.authorId?._id || p.authorId) === userId;
      const upvoteIds = (p.upvotes || []).map((id: any) => String(id?._id || id));

      return {
        id: String(p._id),
        author,
        teamMembers,
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        techStack: p.techStack || [],
        campus: p.campus,
        department: p.department,
        githubUrl: p.githubUrl,
        liveDemoUrl: p.liveDemoUrl,
        videoUrl: p.videoUrl,
        imageUrl: p.imageUrl,
        award: p.award,
        upvotesCount: upvoteIds.length,
        isUpvoted: upvoteIds.includes(userId),
        commentsCount: (p.comments || []).length,
        isAuthor,
        createdAt: p.createdAt,
      };
    });

    if (sortBy === "upvotes") {
      items.sort((a, b) => b.upvotesCount - a.upvotesCount);
    }

    res.json({
      items,
      total,
      page: pageNum,
      pageSize: limitNum,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/showcase/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const p: any = await ProjectShowcaseModel.findById(req.params.id)
      .populate("authorId")
      .populate("teamMembers")
      .populate("comments.authorId")
      .lean();

    if (!p) {
      res.status(404).json({ success: false, message: "Showcase project not found" });
      return;
    }

    const author = serializeUser(p.authorId);
    const teamMembers = (p.teamMembers || []).map(serializeUser);
    const isAuthor = String(p.authorId?._id || p.authorId) === userId;
    const upvoteIds = (p.upvotes || []).map((id: any) => String(id?._id || id));

    const comments = (p.comments || []).map((c: any) => ({
      id: String(c._id),
      author: serializeUser(c.authorId),
      text: c.text,
      createdAt: c.createdAt,
    }));

    res.json({
      id: String(p._id),
      author,
      teamMembers,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      techStack: p.techStack || [],
      campus: p.campus,
      department: p.department,
      githubUrl: p.githubUrl,
      liveDemoUrl: p.liveDemoUrl,
      videoUrl: p.videoUrl,
      imageUrl: p.imageUrl,
      award: p.award,
      upvotesCount: upvoteIds.length,
      isUpvoted: upvoteIds.includes(userId),
      comments,
      commentsCount: comments.length,
      isAuthor,
      createdAt: p.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/showcase", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);

    const {
      title,
      tagline,
      description,
      category = "AI / ML",
      techStack = [],
      campus,
      department,
      githubUrl,
      liveDemoUrl,
      videoUrl,
      imageUrl,
      award,
      teamMemberIds = [],
    } = req.body;

    if (!title || !tagline || !description) {
      res.status(400).json({ success: false, message: "Title, tagline, and description are required" });
      return;
    }

    const formattedTech = Array.isArray(techStack)
      ? techStack
      : typeof techStack === "string"
      ? (techStack as string).split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const memberObjectIds = Array.isArray(teamMemberIds)
      ? teamMemberIds.map((id) => toObjectId(id))
      : [];

    const project = await ProjectShowcaseModel.create({
      authorId: userObjId,
      teamMembers: memberObjectIds,
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category,
      techStack: formattedTech,
      campus: campus || user?.campus || "Coimbatore",
      department: department || user?.department || "Computer Science & Engineering",
      githubUrl: githubUrl?.trim(),
      liveDemoUrl: liveDemoUrl?.trim(),
      videoUrl: videoUrl?.trim(),
      imageUrl: imageUrl?.trim(),
      award: award?.trim(),
      upvotes: [userObjId], // Author upvotes by default
      comments: [],
    });

    // Cross-link: Broadcast on Social Feed
    try {
      await PostModel.create({
        authorId: userObjId,
        content: `🚀 [Project Showcase · ${category}] ${title.trim()}\n\n"${tagline.trim()}"\n\n${award ? `🏆 Award: ${award.trim()}\n\n` : ""}${description.trim().slice(0, 160)}...\n\nCheck out the demo & upvote on the Showcase Gallery!`,
        category: "Project",
        campus: project.campus,
        department: project.department,
        likes: [userObjId],
        savedBy: [],
        comments: [],
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({
      success: true,
      message: "Project published to Showcase Gallery!",
      id: String(project._id),
      project,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/showcase/:id/upvote", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const project = await ProjectShowcaseModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: "Showcase project not found" });
      return;
    }

    const upvotes = (project.upvotes || []).map((id) => String(id));
    const alreadyUpvoted = upvotes.includes(userId);

    if (alreadyUpvoted) {
      project.upvotes = project.upvotes.filter((id) => String(id) !== userId);
    } else {
      project.upvotes.push(userObjId);

      // Notify project author if not self
      if (String(project.authorId) !== userId) {
        const upvoter = await UserModel.findById(userId);
        await NotificationModel.create({
          userId: project.authorId,
          type: "showcase_upvote",
          title: "🔥 New Project Upvote!",
          message: `${upvoter?.fullName ?? "A member"} upvoted your showcase project "${project.title}".`,
        });
      }
    }

    await project.save();

    res.json({
      success: true,
      isUpvoted: !alreadyUpvoted,
      upvotesCount: project.upvotes.length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/showcase/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: "Comment text is required" });
      return;
    }

    const project = await ProjectShowcaseModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: "Showcase project not found" });
      return;
    }

    project.comments.push({
      authorId: userObjId,
      text: text.trim(),
      createdAt: new Date(),
    } as any);

    await project.save();

    // Notify author if not self
    if (String(project.authorId) !== userId) {
      await NotificationModel.create({
        userId: project.authorId,
        type: "showcase_comment",
        title: "💬 New Project Feedback",
        message: `${user?.fullName ?? "A member"} commented on your project "${project.title}".`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Comment added!",
      commentsCount: project.comments.length,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/showcase/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await UserModel.findById(userId);
    const project = await ProjectShowcaseModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: "Showcase project not found" });
      return;
    }

    if (String(project.authorId) !== userId && user?.role !== "admin") {
      res.status(403).json({ success: false, message: "You can only delete your own projects" });
      return;
    }

    await ProjectShowcaseModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Showcase project deleted" });
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



