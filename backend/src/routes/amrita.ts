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
  ConnectionModel,
  EventModel,
  EventRegistrationModel,
  MentorshipRequestModel,
  MessageModel,
  NotificationModel,
  OpportunityModel,
  PostModel,
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

router.get("/admin/summary", requireAuth, requireRole("admin"), async (_req, res) => {
  const [users, opportunities, events] = await Promise.all([
    UserModel.countDocuments(),
    OpportunityModel.countDocuments(),
    EventModel.countDocuments(),
  ]);
  res.json({ users, opportunities, events });
});

export default router;



