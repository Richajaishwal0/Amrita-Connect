import bcrypt from "bcryptjs";
import {
  CampusBuddyHostModel,
  CampusBuddyRequestModel,
  CollaborationModel,
  ConnectionModel,
  EventModel,
  HelpRequestModel,
  InterviewExperienceModel,
  MessageModel,
  OpportunityModel,
  PostModel,
  ProjectShowcaseModel,
  ResearchProjectModel,
  UserModel,
} from "@workspace/db";

export async function seedDevelopmentData() {
  // Ensure default administrator account exists for platform administration
  const adminExists = await UserModel.findOne({ email: "admin@amrita.edu" });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("amrita-admin-2026", 10);
    await UserModel.create({
      fullName: "Platform Admin",
      handle: "admin",
      email: "admin@amrita.edu",
      passwordHash,
      role: "admin",
      campus: "Coimbatore",
      department: "Administration",
      graduationYear: null,
      headline: "Amrita Connect Administrator",
      bio: "Platform operations and verification.",
      skills: [],
      interests: [],
      helpWith: [],
      lookingFor: [],
      verified: true,
      status: "active",
    });
  }

  // Backfill unique handle for any existing users missing handle
  const usersWithoutHandle = await UserModel.find({
    $or: [{ handle: null }, { handle: { $exists: false } }, { handle: "" }],
  });
  for (const u of usersWithoutHandle) {
    let baseHandle = u.email ? u.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "") : "";
    if (!baseHandle || baseHandle.length < 3) {
      baseHandle = (u.fullName || "member").toLowerCase().replace(/[^a-z0-9_.-]/g, "_").replace(/_+/g, "_").slice(0, 20);
    }
    let uniqueHandle = baseHandle;
    let counter = 1;
    while (await UserModel.findOne({ handle: uniqueHandle, _id: { $ne: u._id } })) {
      uniqueHandle = `${baseHandle}${counter++}`;
    }
    u.handle = uniqueHandle;
    await u.save();
  }
}
