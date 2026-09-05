import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
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

const router: IRouter = Router();

export async function purgeAllMockData() {
  try {
    // Purge all previous user logins / test accounts except platform administrator
    await UserModel.deleteMany({ email: { $ne: "admin@amrita.edu" } });
    await Promise.all([
      ProjectShowcaseModel.deleteMany({}),
      ResearchProjectModel.deleteMany({}),
      OpportunityModel.deleteMany({}),
      EventModel.deleteMany({}),
      CollaborationModel.deleteMany({}),
      InterviewExperienceModel.deleteMany({}),
      HelpRequestModel.deleteMany({}),
      CampusBuddyHostModel.deleteMany({}),
      CampusBuddyRequestModel.deleteMany({}),
      PostModel.deleteMany({}),
      MessageModel.deleteMany({}),
      ConnectionModel.deleteMany({}),
    ]);
  } catch (err) {
    console.error("Purge error:", err);
  }
}

// Auto-purge once when router is loaded
purgeAllMockData();

router.get("/healthz", async (_req, res) => {
  await purgeAllMockData();
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
