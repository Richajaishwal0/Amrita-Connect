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
}
