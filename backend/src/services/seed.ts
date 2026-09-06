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
  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const adminPasswordHash = await bcrypt.hash("amrita-admin-2026", 10);

  // Ensure default administrator account exists
  let admin = await UserModel.findOne({ email: "admin@amrita.edu" });
  if (!admin) {
    admin = await UserModel.create({
      fullName: "Platform Admin",
      handle: "admin",
      email: "admin@amrita.edu",
      passwordHash: adminPasswordHash,
      role: "admin",
      campus: "Coimbatore",
      department: "Administration",
      graduationYear: null,
      headline: "Amrita Connect Platform Administrator",
      bio: "Platform operations, safety, and community governance across 7 campuses.",
      skills: ["Administration", "Governance", "Community"],
      interests: ["Higher Ed", "Open Source"],
      helpWith: ["Account verification", "Platform support"],
      lookingFor: ["Student ambassadors"],
      verified: true,
      status: "active",
    });
  }

  // Ensure Harsh exists (Amritapuri campus)
  let harsh = await UserModel.findOne({
    $or: [{ email: "harsh@amrita.edu" }, { handle: "harsh" }, { fullName: "Harsh Vardhan" }],
  });
  if (!harsh) {
    harsh = await UserModel.create({
      fullName: "Harsh Vardhan",
      handle: "harsh",
      email: "harsh@amrita.edu",
      passwordHash,
      role: "student",
      campus: "Amritapuri",
      department: "Computer Science",
      graduationYear: 2026,
      headline: "B.Tech CSE '26 · Distributed Systems & Cloud Computing Enthusiast",
      bio: "Passionate about building scalable backend services, participating in hackathons, and collaborating with cross-campus peers.",
      skills: ["Node.js", "Go", "Kubernetes", "MongoDB", "TypeScript"],
      interests: ["Cloud Systems", "Competitive Programming", "Robotics"],
      helpWith: ["Backend architecture", "Docker setup", "DSA interview prep"],
      lookingFor: ["Research collaborators", "Hackathon teammates"],
      verified: true,
      status: "active",
    });
  }

  // Ensure Priya Nair exists (Bengaluru campus)
  let priya = await UserModel.findOne({
    $or: [{ email: "priya@amrita.edu" }, { handle: "priya_nair" }, { fullName: "Priya Nair" }],
  });
  if (!priya) {
    priya = await UserModel.create({
      fullName: "Priya Nair",
      handle: "priya_nair",
      email: "priya@amrita.edu",
      passwordHash,
      role: "student",
      campus: "Bengaluru",
      department: "Artificial Intelligence",
      graduationYear: 2025,
      headline: "B.Tech AI & Data Science '25 · NLP Researcher · Student Mentor",
      bio: "Working on low-resource Indic language models and computer vision applications for healthcare.",
      skills: ["PyTorch", "NLP", "Transformers", "Python", "FastAPI"],
      interests: ["Deep Learning", "Generative AI", "Bioinformatics"],
      helpWith: ["Machine learning projects", "Resume reviews"],
      lookingFor: ["Junior mentees", "Industry connections"],
      verified: true,
      status: "active",
    });
  }

  // Ensure Dr. Raman exists (Coimbatore campus faculty)
  let raman = await UserModel.findOne({
    $or: [{ email: "raman@amrita.edu" }, { handle: "dr_raman" }, { fullName: "Dr. S. Raman" }],
  });
  if (!raman) {
    raman = await UserModel.create({
      fullName: "Dr. S. Raman",
      handle: "dr_raman",
      email: "raman@amrita.edu",
      passwordHash,
      role: "faculty",
      campus: "Coimbatore",
      department: "Computer Science",
      graduationYear: null,
      headline: "Professor & Head of Research · High Performance Computing Lab",
      bio: "Guiding postgraduate and undergraduate research in parallel architectures, quantum algorithms, and distributed databases.",
      skills: ["HPC", "Parallel Algorithms", "Quantum Computing", "Research Mentorship"],
      interests: ["Distributed Systems", "Academic Research", "Grant Writing"],
      helpWith: ["Research paper reviews", "PhD guidance", "Grant proposals"],
      lookingFor: ["Enthusiastic student researchers"],
      verified: true,
      status: "active",
    });
  }

  // Ensure seed posts exist if total posts are low
  const postCount = await PostModel.countDocuments();
  if (postCount < 3) {
    if (harsh) {
      const harshPost = await PostModel.findOne({ authorId: harsh._id });
      if (!harshPost) {
        await PostModel.create({
          authorId: harsh._id,
          content: "🚀 Excited to share our team's progress on building a fault-tolerant distributed key-value store using Raft consensus in Go! Looking for feedback and collaborators from Bengaluru and Coimbatore campuses.",
          category: "Project",
          campus: harsh.campus,
          department: harsh.department,
          likes: [priya._id, admin._id],
          reactions: [
            { userId: priya._id, type: "celebrate", createdAt: new Date() },
            { userId: admin._id, type: "insightful", createdAt: new Date() },
          ],
          comments: [
            {
              userId: priya._id,
              text: "Looks incredible Harsh! Would love to benchmark this against our microservices cluster.",
              likes: [harsh._id],
              createdAt: new Date(),
            },
          ],
          savedBy: [priya._id],
        });
      }
    }

    if (priya) {
      const priyaPost = await PostModel.findOne({ authorId: priya._id });
      if (!priyaPost) {
        await PostModel.create({
          authorId: priya._id,
          content: "📚 Published a comprehensive guide on 'Fine-Tuning Transformer Models for Low-Resource Indian Languages' based on our latest experiments at the AI lab. Check it out and let me know your thoughts!",
          category: "Blog",
          campus: priya.campus,
          department: priya.department,
          linkUrl: "https://arxiv.org",
          likes: [harsh._id, raman._id],
          reactions: [
            { userId: harsh._id, type: "love", createdAt: new Date() },
            { userId: raman._id, type: "insightful", createdAt: new Date() },
          ],
          comments: [
            {
              userId: raman._id,
              text: "Excellent methodology and clear benchmarks, Priya. Keep up the high standard of work.",
              likes: [priya._id],
              createdAt: new Date(),
            },
          ],
          savedBy: [harsh._id],
        });
      }
    }

    if (raman) {
      const ramanPost = await PostModel.findOne({ authorId: raman._id });
      if (!ramanPost) {
        await PostModel.create({
          authorId: raman._id,
          content: "🏆 Congratulations to our student research group for securing the National Quantum Computing Innovation Award! Proud of the inter-campus collaboration between Coimbatore and Amritapuri.",
          category: "Achievement",
          campus: raman.campus,
          department: raman.department,
          likes: [harsh._id, priya._id, admin._id],
          reactions: [
            { userId: harsh._id, type: "celebrate", createdAt: new Date() },
            { userId: priya._id, type: "celebrate", createdAt: new Date() },
            { userId: admin._id, type: "support", createdAt: new Date() },
          ],
          comments: [],
          savedBy: [],
        });
      }
    }
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
