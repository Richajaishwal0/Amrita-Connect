import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
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
  RegisterBody,
  UpdateMentorshipRequestStatusBody,
  UpdateMentorshipRequestStatusParams,
  UpdateMyProfileBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  collaborationsTable,
  eventsTable,
  mentorshipRequestsTable,
  notificationsTable,
  opportunitiesTable,
  usersTable,
} from "@workspace/db";
import { issueToken, requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

const publicUserFields = {
  id: usersTable.id,
  fullName: usersTable.fullName,
  role: usersTable.role,
  campus: usersTable.campus,
  department: usersTable.department,
  graduationYear: usersTable.graduationYear,
  headline: usersTable.headline,
  bio: usersTable.bio,
  company: usersTable.company,
  jobRole: usersTable.jobRole,
  skills: usersTable.skills,
  interests: usersTable.interests,
  helpWith: usersTable.helpWith,
  lookingFor: usersTable.lookingFor,
  avatarUrl: usersTable.avatarUrl,
  verified: usersTable.verified,
  createdAt: usersTable.createdAt,
};

function serializeUser(user: typeof usersTable.$inferSelect, includeEmail = false) {
  const {
    passwordHash: _passwordHash,
    status: _status,
    email: _email,
    ...safeUser
  } = user;
  return {
    ...safeUser,
    ...(includeEmail ? { email: user.email } : {}),
    id: String(user.id),
    createdAt: user.createdAt.toISOString(),
  };
}

function getUserId(req: Parameters<typeof requireAuth>[0]) {
  if (!req.userId) throw new Error("Missing authenticated user");
  return req.userId;
}

function parseListParams<T extends object>(parser: { parse: (value: unknown) => T }, value: unknown) {
  return parser.parse(value);
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const input = RegisterBody.parse(req.body);
    if ((input.role as string) === "admin") {
      res.status(403).json({ success: false, message: "Admin accounts must be provisioned by the platform team" });
      return;
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const [user] = await db.insert(usersTable).values({
      ...input,
      email: input.email.toLowerCase().trim(),
      graduationYear: input.graduationYear ?? null,
      passwordHash,
      skills: [],
      interests: [],
      helpWith: [],
      lookingFor: [],
    }).returning();
    res.status(201).json({ token: issueToken(user.id, user.role), user: serializeUser(user, true) });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const input = LoginBody.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, input.email.toLowerCase())).limit(1);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ success: false, message: "Email or password is incorrect" });
      return;
    }
    res.json({ token: issueToken(user.id, user.role), user: serializeUser(user, true) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, getUserId(req))).limit(1);
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
    const [user] = await db.update(usersTable).set(input).where(eq(usersTable.id, getUserId(req))).returning();
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
    const filters = [];
    if (query.search) {
      const term = `%${query.search}%`;
      filters.push(or(
        ilike(usersTable.fullName, term),
        ilike(usersTable.headline, term),
        ilike(usersTable.bio, term),
        ilike(usersTable.company, term),
        ilike(usersTable.jobRole, term),
        ilike(usersTable.department, term),
      ));
    }
    if (query.role) filters.push(eq(usersTable.role, query.role));
    if (query.campus) filters.push(eq(usersTable.campus, query.campus));
    if (query.department) filters.push(eq(usersTable.department, query.department));
    const where = filters.length ? and(...filters) : undefined;
    const [items, [{ total }]] = await Promise.all([
      db.select(publicUserFields).from(usersTable).where(where).orderBy(asc(usersTable.fullName))
        .limit(query.pageSize).offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);
    res.json({
      items: items.map((user) => serializeUser(user as typeof usersTable.$inferSelect)),
      page: query.page,
      pageSize: query.pageSize,
      total: Number(total),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = GetUserParams.parse(req.params);
    const [user] = await db.select(publicUserFields).from(usersTable).where(eq(usersTable.id, Number(id))).limit(1);
    if (!user) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    res.json(serializeUser(user as typeof usersTable.$inferSelect));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/summary", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [[people], [pending], [upcomingEvents], [opportunities], [unread], recentPeople, upcoming, opportunityItems] = await Promise.all([
      db.select({ total: count() }).from(usersTable),
      db.select({ total: count() }).from(mentorshipRequestsTable).where(and(eq(mentorshipRequestsTable.requesterId, userId), eq(mentorshipRequestsTable.status, "pending"))),
      db.select({ total: count() }).from(eventsTable),
      db.select({ total: count() }).from(opportunitiesTable),
      db.select({ total: count() }).from(notificationsTable).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false))),
      db.select(publicUserFields).from(usersTable).where(eq(usersTable.verified, true)).orderBy(desc(usersTable.createdAt)).limit(3),
      db.select().from(eventsTable).orderBy(asc(eventsTable.date)).limit(3),
      db.select().from(opportunitiesTable).orderBy(asc(opportunitiesTable.deadline)).limit(3),
    ]);
    res.json({
      profileCompletion: 72,
      peopleCount: Number(people.total),
      mentorshipPending: Number(pending.total),
      savedOpportunities: 0,
      upcomingEvents: Number(upcomingEvents.total),
      unreadNotifications: Number(unread.total),
      recentPeople: recentPeople.map((user) => serializeUser(user as typeof usersTable.$inferSelect)),
      upcoming: upcoming.map((event) => ({ ...event, id: String(event.id), date: event.date.toISOString(), registered: false })),
      opportunities: opportunityItems.map((opportunity) => ({ ...opportunity, id: String(opportunity.id), saved: false })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/mentorship/requests", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const rows = await db.select({
      request: mentorshipRequestsTable,
      mentor: usersTable,
    }).from(mentorshipRequestsTable)
      .innerJoin(usersTable, eq(mentorshipRequestsTable.mentorId, usersTable.id))
      .where(or(eq(mentorshipRequestsTable.requesterId, userId), eq(mentorshipRequestsTable.mentorId, userId)))
      .orderBy(desc(mentorshipRequestsTable.createdAt));
    const requesters = await db.select().from(usersTable);
    res.json(rows.map(({ request, mentor }) => ({
      id: String(request.id),
      mentor: serializeUser(mentor),
      requester: serializeUser(requesters.find((person) => person.id === request.requesterId) ?? mentor),
      message: request.message,
      reason: request.reason,
      topic: request.topic,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/mentorship/requests", requireAuth, async (req, res, next) => {
  try {
    const input = CreateMentorshipRequestBody.parse(req.body);
    const requesterId = getUserId(req);
    const [mentor] = await db.select().from(usersTable).where(eq(usersTable.id, Number(input.mentorId))).limit(1);
    if (!mentor) {
      res.status(400).json({ success: false, message: "Mentor not found" });
      return;
    }
    const [request] = await db.insert(mentorshipRequestsTable).values({
      requesterId,
      mentorId: mentor.id,
      message: input.message,
      reason: input.reason,
      topic: input.topic,
      status: "pending",
    }).returning();
    const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, requesterId)).limit(1);
    await db.insert(notificationsTable).values({
      userId: mentor.id,
      type: "mentorship_request",
      title: "New mentorship request",
      message: `${requester?.fullName ?? "A member"} would value your guidance.`,
    });
    res.status(201).json({
      id: String(request.id),
      mentor: serializeUser(mentor),
      requester: serializeUser(requester!),
      message: request.message,
      reason: request.reason,
      topic: request.topic,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/mentorship/requests/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { id } = UpdateMentorshipRequestStatusParams.parse(req.params);
    const { status } = UpdateMentorshipRequestStatusBody.parse(req.body);
    const [existing] = await db.select().from(mentorshipRequestsTable).where(eq(mentorshipRequestsTable.id, Number(id))).limit(1);
    if (!existing || existing.mentorId !== getUserId(req)) {
      res.status(404).json({ success: false, message: "Mentorship request not found" });
      return;
    }
    const [request] = await db.update(mentorshipRequestsTable).set({ status }).where(eq(mentorshipRequestsTable.id, Number(id))).returning();
    const [mentor] = await db.select().from(usersTable).where(eq(usersTable.id, request.mentorId)).limit(1);
    const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, request.requesterId)).limit(1);
    await db.insert(notificationsTable).values({
      userId: request.requesterId,
      type: "mentorship_status",
      title: `Mentorship request ${status}`,
      message: `${mentor?.fullName ?? "Your mentor"} ${status} your request.`,
    });
    res.json({
      id: String(request.id),
      mentor: serializeUser(mentor!),
      requester: serializeUser(requester!),
      message: request.message,
      reason: request.reason,
      topic: request.topic,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/collaborations", requireAuth, async (req, res, next) => {
  try {
    const query = parseListParams(ListCollaborationsQueryParams, req.query);
    const filters = query.search ? [or(ilike(collaborationsTable.title, `%${query.search}%`), ilike(collaborationsTable.description, `%${query.search}%`))] : [];
    if (query.category) filters.push(eq(collaborationsTable.category, query.category));
    const where = filters.length ? and(...filters) : undefined;
    const rows = await db.select({ collaboration: collaborationsTable, creator: usersTable })
      .from(collaborationsTable).innerJoin(usersTable, eq(collaborationsTable.creatorId, usersTable.id))
      .where(where).orderBy(desc(collaborationsTable.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize);
    const [{ total }] = await db.select({ total: count() }).from(collaborationsTable).where(where);
    res.json({
      items: rows.map(({ collaboration, creator }) => ({
        ...collaboration,
        id: String(collaboration.id),
        creator: serializeUser(creator),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total: Number(total),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborations", requireAuth, async (req, res, next) => {
  try {
    const input = CreateCollaborationBody.parse(req.body);
    const [collaboration] = await db.insert(collaborationsTable).values({
      creatorId: getUserId(req),
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills,
      teamSize: input.teamSize,
      deadline: input.deadline.toISOString().slice(0, 10),
      category: input.category,
      memberCount: 1,
    }).returning();
    const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, getUserId(req))).limit(1);
    res.status(201).json({ ...collaboration, id: String(collaboration.id), creator: serializeUser(creator!) });
  } catch (error) {
    next(error);
  }
});

router.get("/opportunities", requireAuth, async (req, res, next) => {
  try {
    const query = parseListParams(ListOpportunitiesQueryParams, req.query);
    const filters = query.search ? [or(ilike(opportunitiesTable.title, `%${query.search}%`), ilike(opportunitiesTable.description, `%${query.search}%`), ilike(opportunitiesTable.organization, `%${query.search}%`))] : [];
    if (query.category) filters.push(eq(opportunitiesTable.category, query.category));
    const where = filters.length ? and(...filters) : undefined;
    const [items, [{ total }]] = await Promise.all([
      db.select().from(opportunitiesTable).where(where).orderBy(asc(opportunitiesTable.deadline)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(opportunitiesTable).where(where),
    ]);
    res.json({ items: items.map((item) => ({ ...item, id: String(item.id), saved: false })), page: query.page, pageSize: query.pageSize, total: Number(total) });
  } catch (error) {
    next(error);
  }
});

router.get("/events", requireAuth, async (req, res, next) => {
  try {
    const query = parseListParams(ListEventsQueryParams, req.query);
    const where = query.campus ? eq(eventsTable.campus, query.campus) : undefined;
    const [items, [{ total }]] = await Promise.all([
      db.select().from(eventsTable).where(where).orderBy(asc(eventsTable.date)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(eventsTable).where(where),
    ]);
    res.json({ items: items.map((item) => ({ ...item, id: String(item.id), date: item.date.toISOString(), registered: false })), page: query.page, pageSize: query.pageSize, total: Number(total) });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const items = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, getUserId(req))).orderBy(desc(notificationsTable.createdAt));
    res.json(items.map((item) => ({ ...item, id: String(item.id), createdAt: item.createdAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = MarkNotificationReadParams.parse(req.params);
    const [item] = await db.update(notificationsTable).set({ read: true }).where(and(eq(notificationsTable.id, Number(id)), eq(notificationsTable.userId, getUserId(req)))).returning();
    if (!item) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }
    res.json({ ...item, id: String(item.id), createdAt: item.createdAt.toISOString() });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/summary", requireAuth, requireRole("admin"), async (_req, res) => {
  const [[users], [opportunities], [events]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({ total: count() }).from(opportunitiesTable),
    db.select({ total: count() }).from(eventsTable),
  ]);
  res.json({ users: Number(users.total), opportunities: Number(opportunities.total), events: Number(events.total) });
});

export default router;