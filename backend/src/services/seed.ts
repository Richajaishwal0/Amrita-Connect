import bcrypt from "bcryptjs";
import { ConnectionModel, EventModel, MessageModel, OpportunityModel, PostModel, UserModel } from "@workspace/db";

export async function seedDevelopmentData() {
  const totalUsers = await UserModel.countDocuments();
  if (totalUsers === 0) {
    const passwordHash = await bcrypt.hash("amrita-demo-2026", 10);

    await UserModel.insertMany([
      {
        fullName: "Aarav Menon",
        email: "aarav.student@amrita.edu",
        passwordHash,
        role: "student",
        campus: "Amaravati",
        department: "Computer Science & Engineering",
        graduationYear: 2027,
        headline: "Building useful products with ML",
        bio: "Computer science student exploring machine learning, product design, and ambitious student teams.",
        skills: ["Python", "Machine Learning", "React"],
        interests: ["Artificial Intelligence", "Entrepreneurship"],
        helpWith: ["Hackathon teammates", "Project development"],
        lookingFor: ["Career mentorship", "Research partners"],
        verified: true,
        status: "active",
      },
      {
        fullName: "Nivedita Rao",
        email: "nivedita.alumni@amrita.edu",
        passwordHash,
        role: "alumni",
        campus: "Bengaluru",
        department: "Computer Science & Engineering",
        graduationYear: 2018,
        headline: "Senior Product Engineer at Microsoft",
        bio: "Product engineer and mentor helping early-career builders become confident interviewers and teammates.",
        company: "Microsoft",
        jobRole: "Senior Product Engineer",
        skills: ["System Design", "Java", "Interview Preparation"],
        interests: ["Career Growth", "Developer Experience"],
        helpWith: ["Interview preparation", "Resume review"],
        lookingFor: ["Research collaborators"],
        verified: true,
        status: "active",
      },
      {
        fullName: "Dr. Karthik Iyer",
        email: "karthik.research@amrita.edu",
        passwordHash,
        role: "faculty",
        campus: "Coimbatore",
        department: "Artificial Intelligence",
        graduationYear: null,
        headline: "Faculty researcher in trustworthy AI",
        bio: "Working with students on responsible, human-centered machine learning systems.",
        skills: ["Research", "Data Science", "Machine Learning"],
        interests: ["Artificial Intelligence", "Research"],
        helpWith: ["Research guidance", "Project development"],
        lookingFor: ["Research partners"],
        verified: true,
        status: "active",
      },
      {
        fullName: "Platform Admin",
        email: "admin@amrita.edu",
        passwordHash,
        role: "admin",
        campus: "Coimbatore",
        department: "Administration",
        graduationYear: null,
        headline: "Amrita Connect administrator",
        bio: "Platform operations.",
        skills: [],
        interests: [],
        helpWith: [],
        lookingFor: [],
        verified: true,
        status: "active",
      },
    ]);
  }

  const totalOpportunities = await OpportunityModel.countDocuments();
  if (totalOpportunities === 0) {
    await OpportunityModel.insertMany([
      {
        title: "AI Research Fellow — Responsible Systems",
        description: "Join a cross-campus research team exploring transparent evaluation methods for language models.",
        category: "Research",
        organization: "Amrita School of Computing",
        requiredSkills: ["Python", "Research", "Machine Learning"],
        eligibility: "Students and recent graduates with a strong interest in responsible AI.",
        deadline: "2026-10-15",
        applicationUrl: "https://www.amrita.edu",
      },
      {
        title: "Campus Product Sprint",
        description: "A 48-hour product sprint for teams solving meaningful problems in student life.",
        category: "Hackathon",
        organization: "Amrita Innovation Hub",
        requiredSkills: ["React", "Product Design", "Prototyping"],
        eligibility: "Open to current Amrita students across all campuses.",
        deadline: "2026-09-28",
        applicationUrl: "https://www.amrita.edu",
      },
      {
        title: "Women in Engineering Mentorship Circle",
        description: "A guided six-week circle connecting students with experienced engineering leaders.",
        category: "Mentorship",
        organization: "Amrita Alumni Network",
        requiredSkills: ["Communication", "Curiosity"],
        eligibility: "Open to students in their second year or later.",
        deadline: "2026-09-20",
        applicationUrl: "https://www.amrita.edu",
      },
    ]);
  }

  const totalEvents = await EventModel.countDocuments();
  if (totalEvents === 0) {
    await EventModel.insertMany([
      {
        title: "Cross-campus Builder Meetup",
        description: "Meet builders from every campus, share what you are working on, and find your next teammate.",
        date: new Date("2026-09-12T10:00:00+05:30"),
        campus: "Bengaluru",
        venue: "Innovation Lab · Hybrid",
        organizer: "Amrita Innovation Hub",
        registrationUrl: "https://www.amrita.edu",
        capacity: 120,
      },
      {
        title: "Research Paths: From Curiosity to Publication",
        description: "Faculty and alumni share how to choose a research question and build a strong collaboration.",
        date: new Date("2026-09-18T17:30:00+05:30"),
        campus: "Coimbatore",
        venue: "AUMS Auditorium · Online",
        organizer: "Office of Research",
        registrationUrl: "https://www.amrita.edu",
        capacity: 300,
      },
      {
        title: "SDE Interview Studio",
        description: "A practical evening of mock interviews, feedback, and honest career conversations.",
        date: new Date("2026-09-25T18:00:00+05:30"),
        campus: "Amaravati",
        venue: "Learning Commons",
        organizer: "Amrita Alumni Network",
        registrationUrl: "https://www.amrita.edu",
        capacity: 80,
      },
    ]);
  }

  const totalPosts = await PostModel.countDocuments();
  if (totalPosts === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (nivedita && aarav && drKarthik) {
      await PostModel.insertMany([
        {
          authorId: nivedita._id,
          content:
            "🚀 Excited to share my Microsoft SDE II Interview Experience! Key topics covered: Distributed caching, LLD for rate limiters, and behavioral scenarios. Happy to review resumes for 2025/2026 batches—feel free to drop a mentorship request!",
          category: "Interview Experience",
          campus: nivedita.campus,
          department: nivedita.department,
          likes: [aarav._id, drKarthik._id],
          comments: [
            {
              userId: aarav._id,
              text: "Thank you for sharing this Nivedita! Looking forward to applying these insights.",
              createdAt: new Date(),
            },
          ],
          savedBy: [aarav._id],
        },
        {
          authorId: drKarthik._id,
          content:
            "🔬 Our AI Research Lab at Amrita Coimbatore is looking for 2 enthusiastic student researchers for a funded project on 'Trustworthy Multimodal Healthcare Diagnostics'. Experience with PyTorch or OpenCV is preferred. Express interest via collaborations or reach out directly!",
          category: "Opportunity",
          campus: drKarthik.campus,
          department: drKarthik.department,
          likes: [aarav._id, nivedita._id],
          comments: [],
          savedBy: [aarav._id],
        },
        {
          authorId: aarav._id,
          content:
            "🏆 Our cross-campus team with peers from Amritapuri and Bengaluru just qualified for the Grand Finale of Smart India Hackathon 2026! Huge thanks to senior alumni mentors for the late-night architecture reviews. We are looking for UI/UX feedback before demo day.",
          category: "Achievement",
          campus: aarav.campus,
          department: aarav.department,
          likes: [nivedita._id, drKarthik._id],
          comments: [
            {
              userId: nivedita._id,
              text: "Proud of the team! Rooting for the win!",
              createdAt: new Date(),
            },
          ],
          savedBy: [],
        },
      ]);
    }
  }

  const totalConnections = await ConnectionModel.countDocuments();
  if (totalConnections === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (aarav && nivedita && drKarthik) {
      await ConnectionModel.insertMany([
        {
          senderId: aarav._id,
          receiverId: nivedita._id,
          status: "accepted",
          message: "Hi Nivedita! Looking forward to connecting on Microsoft and engineering careers.",
        },
        {
          senderId: drKarthik._id,
          receiverId: aarav._id,
          status: "pending",
          message: "Hello Aarav, I noticed your interest in Machine Learning and would like to stay connected.",
        },
      ]);
    }
  }

  const totalMessages = await MessageModel.countDocuments();
  if (totalMessages === 0) {
    const [aarav, nivedita] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
    ]);

    if (aarav && nivedita) {
      await MessageModel.insertMany([
        {
          senderId: aarav._id,
          recipientId: nivedita._id,
          content: "Hi Nivedita! Loved your post on distributed caching patterns. Are you open to giving some advice on system design for college students?",
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 5),
        },
        {
          senderId: nivedita._id,
          recipientId: aarav._id,
          content: "Hello Aarav! Absolutely, happy to help. A great place to start is understanding Redis caching strategies and consistency tradeoffs.",
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 3),
        },
        {
          senderId: nivedita._id,
          recipientId: aarav._id,
          content: "Feel free to share any questions or architecture diagrams you're currently sketching out!",
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 1),
        },
      ]);
    }
  }
}



