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

  const totalCollabs = await CollaborationModel.countDocuments();
  if (totalCollabs === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (aarav && drKarthik) {
      await CollaborationModel.insertMany([
        {
          creatorId: aarav._id,
          title: "Smart India Hackathon 2026 — Clean Energy Microgrid",
          description:
            "We are developing an AI-assisted decentralized microgrid load-balancing platform for rural institutions. Qualified for finale rounds and looking for energetic teammates from any campus to round out our stack!",
          category: "Hackathon",
          requiredSkills: ["Python", "React", "IoT/Embedded", "UI/UX"],
          rolesNeeded: ["Embedded IoT Engineer", "Fullstack Developer", "UI/UX Designer"],
          teamSize: 4,
          deadline: "2026-10-20",
          status: "open",
          memberCount: 2,
          members: [
            { userId: aarav._id, role: "Team Lead & ML", joinedAt: new Date() },
            ...(nivedita ? [{ userId: nivedita._id, role: "Alumni Advisor", joinedAt: new Date() }] : []),
          ],
          applications: [],
          createdAt: new Date(),
        },
        {
          creatorId: drKarthik._id,
          title: "Multimodal Healthcare Diagnostics with Responsible AI",
          description:
            "A funded inter-campus research initiative exploring transparent explainability in transformer-based medical imaging diagnostics. Targeting an IEEE / ACM publication in 2026.",
          category: "Research",
          requiredSkills: ["PyTorch", "Computer Vision", "Research"],
          rolesNeeded: ["Computer Vision Researcher", "PyTorch Specialist"],
          teamSize: 3,
          deadline: "2026-11-15",
          status: "open",
          memberCount: 1,
          members: [{ userId: drKarthik._id, role: "Principal Investigator", joinedAt: new Date() }],
          applications: [
            {
              userId: aarav._id,
              role: "Computer Vision Researcher",
              pitch: "I have experience training CNNs and Vision Transformers on Kaggle datasets and would love to contribute to this research under your guidance.",
              status: "pending",
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
        },
      ]);
    }
  }

  const totalInterviews = await InterviewExperienceModel.countDocuments();
  if (totalInterviews === 0) {
    const [aarav, nivedita] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
    ]);

    if (nivedita && aarav) {
      await InterviewExperienceModel.insertMany([
        {
          authorId: nivedita._id,
          company: "Microsoft",
          role: "Senior Product Engineer / SDE-2",
          employmentType: "Full-time",
          batch: 2018,
          campus: "Bengaluru",
          outcome: "Offered",
          difficulty: "Hard",
          interviewDate: "2025-09",
          rounds: [
            {
              roundNumber: 1,
              roundName: "Online Assessment (OA)",
              description:
                "3 questions on Codility in 90 minutes. 1 Sliding Window problem (Medium), 1 Tree BFS/DFS with path sum conditions, and 1 Graph shortest-path variation. Clean code and edge cases mattered heavily.",
              durationMinutes: 90,
            },
            {
              roundNumber: 2,
              roundName: "Technical DSA & Problem Solving",
              description:
                "Live coding interview focusing on LRU Cache implementation with custom thread-safety considerations and Trie-based auto-complete lookup with prefix frequencies.",
              durationMinutes: 60,
            },
            {
              roundNumber: 3,
              roundName: "Low-Level & High-Level System Design",
              description:
                "Design a global notification dispatch system (push, SMS, email) with rate limiting, deduplication, and at-least-once delivery guarantees using Kafka & Redis caching.",
              durationMinutes: 60,
            },
            {
              roundNumber: 4,
              roundName: "Partner / Director Round & Leadership Principles",
              description:
                "Deep-dive into previous architectural failures, handling cross-functional disagreements, and mentorship philosophies. Emphasized customer obsession and engineering rigor.",
              durationMinutes: 50,
            },
          ],
          keyTopics: ["System Design", "LRU Cache", "Trie", "Kafka", "Sliding Window", "Concurrency"],
          overallExperience:
            "A very structured and respectful hiring loop. Microsoft interviewers really care about clarity in communication, proactive clarifying questions, and trade-off justification rather than rushing into code.",
          prepAdvice:
            "1. Master NeetCode 150 patterns.\n2. For system design, read Alex Xu Volume 1 & 2 and know Redis data structures inside out.\n3. Be ready to explain your college final-year project down to the database indexes.",
          likes: [aarav._id],
          savedBy: [aarav._id],
          createdAt: new Date(Date.now() - 3600000 * 48),
        },
        {
          authorId: aarav._id,
          company: "Cisco Systems",
          role: "Software Engineer Intern (Networking & Cloud)",
          employmentType: "Internship",
          batch: 2027,
          campus: "Amaravati",
          outcome: "Offered",
          difficulty: "Medium",
          interviewDate: "2025-11",
          rounds: [
            {
              roundNumber: 1,
              roundName: "Campus MCQ & Coding Test",
              description:
                "30 MCQs on OS (paging, semaphores), Computer Networks (TCP/IP handshake, subnetting), and 2 coding questions on Array manipulation and Binary Search.",
              durationMinutes: 60,
            },
            {
              roundNumber: 2,
              roundName: "Technical Interview (DSA & Core CS)",
              description:
                "Live coding on Graph cycle detection and questions on TCP vs UDP socket programming in Python. Also asked to write a custom LRU eviction strategy.",
              durationMinutes: 45,
            },
            {
              roundNumber: 3,
              roundName: "Managerial & Culture Fit",
              description:
                "Discussed hackathon projects, why Cisco, handling tight deadline pressures in team sprints, and learning new tech stacks quickly.",
              durationMinutes: 30,
            },
          ],
          keyTopics: ["Computer Networks", "TCP/IP", "Graph BFS/DFS", "Operating Systems", "Python"],
          overallExperience:
            "Smooth campus recruitment process. Having solid fundamentals in Computer Networks and Operating Systems gave a massive edge.",
          prepAdvice:
            "Brush up Kurose & Ross networking concepts thoroughly and practice graph traversal problems on LeetCode.",
          likes: [],
          savedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 24),
        },
      ]);
    }
  }

  const totalHelp = await HelpRequestModel.countDocuments();
  if (totalHelp === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (aarav && nivedita && drKarthik) {
      await HelpRequestModel.insertMany([
        {
          authorId: aarav._id,
          title: "CUDA Out-of-Memory during PyTorch LoRA fine-tuning on RTX 4090",
          description:
            "I am fine-tuning Llama-3-8B with QLoRA on a batch size of 2, but getting `torch.cuda.OutOfMemoryError` during the backward pass after 14 steps. Using gradient accumulation steps = 4 and 4-bit NormalFloat quantization. How can I optimize memory allocation?",
          category: "Project / Coding",
          urgency: "High",
          tags: ["PyTorch", "Machine Learning", "CUDA", "Python"],
          status: "solved",
          campus: "Amaravati",
          department: "Computer Science & Engineering",
          replies: [
            {
              authorId: nivedita._id,
              text: "Enable `gradient_checkpointing_enable()` on your base model before calling `get_peft_model()`. Also make sure you're using `paged_adamw_8bit` optimizer from bitsandbytes instead of standard AdamW. This reduces peak optimizer VRAM footprint by ~60%!",
              isSolution: true,
              upvotes: [aarav._id, drKarthik._id],
              createdAt: new Date(Date.now() - 3600000 * 12),
            },
            {
              authorId: drKarthik._id,
              text: "Additionally, check `torch.cuda.empty_cache()` inside the validation loop. Setting `max_grad_norm=0.3` also prevents gradient explosion overhead.",
              isSolution: false,
              upvotes: [aarav._id],
              createdAt: new Date(Date.now() - 3600000 * 8),
            },
          ],
          upvotes: [nivedita._id, drKarthik._id],
          createdAt: new Date(Date.now() - 3600000 * 20),
        },
        {
          authorId: aarav._id,
          title: "Advice on Distributed Systems & Cloud Electives for Semester 6",
          description:
            "Planning course registration for next semester. For those who completed 6th sem, between Advanced Cloud Computing and Distributed Consensus & Blockchain, which one offers better hands-on labs and placement relevance?",
          category: "Academic",
          urgency: "Normal",
          tags: ["Academics", "System Design", "Cloud"],
          status: "open",
          campus: "Amaravati",
          department: "Computer Science & Engineering",
          replies: [
            {
              authorId: nivedita._id,
              text: "Advanced Cloud Computing gives you AWS/GCP credits and covers Kubernetes architectures which are directly asked in SDE-1 and DevOps interviews at Microsoft, Cisco, and Amazon. Highly recommended!",
              isSolution: false,
              upvotes: [aarav._id],
              createdAt: new Date(Date.now() - 3600000 * 4),
            },
          ],
          upvotes: [nivedita._id],
          createdAt: new Date(Date.now() - 3600000 * 10),
        },
      ]);
    }
  }

  const totalBuddies = await CampusBuddyHostModel.countDocuments();
  if (totalBuddies === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (aarav && nivedita && drKarthik) {
      await CampusBuddyHostModel.insertMany([
        {
          userId: aarav._id,
          campus: "Amaravati",
          department: "Computer Science & Engineering",
          servicesOffered: [
            "Campus Tour",
            "Hackathon Host / Stay Advice",
            "Lab & Research Guide",
            "Local Food & Transport Guide",
          ],
          bio: "Hey there! 3rd year CSE student at Amaravati campus. Happy to show visitors around our high-performance AI labs, help teams staying for hackathons, and recommend the best local spots!",
          languages: ["English", "Telugu", "Hindi"],
          availability: "Available",
          reviews: [
            {
              authorId: nivedita._id,
              rating: 5,
              comment: "Aarav gave our visiting team a wonderful tour of the Amaravati smart classrooms and labs!",
              createdAt: new Date(Date.now() - 3600000 * 48),
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 72),
        },
        {
          userId: nivedita._id,
          campus: "Bengaluru",
          department: "Computer Science & Engineering",
          servicesOffered: [
            "Campus Tour",
            "Tech Industry & Placement Guide",
            "Local Food & Transport Guide",
            "Library & Study Spot Tour",
          ],
          bio: "Alumni working in Bengaluru tech hub. Happy to guide visiting juniors around the Kasavanahalli campus, share Bangalore transit tips, and mentor students visiting for tech conferences.",
          languages: ["English", "Kannada", "Hindi", "Tamil"],
          availability: "Available",
          reviews: [
            {
              authorId: aarav._id,
              rating: 5,
              comment: "Super helpful tips regarding Bangalore metro routes and Sarjapur road transit!",
              createdAt: new Date(Date.now() - 3600000 * 24),
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 96),
        },
        {
          userId: drKarthik._id,
          campus: "Coimbatore",
          department: "Electronics & Communication",
          servicesOffered: [
            "Lab & Research Guide",
            "Campus Tour",
            "Research Symposium Host",
          ],
          bio: "Faculty member at Coimbatore campus. Welcoming visiting researchers and students interested in exploring our HuT Labs (Humanitarian Technology) and wireless sensor testbeds.",
          languages: ["English", "Tamil", "Malayalam"],
          availability: "Available",
          reviews: [],
          createdAt: new Date(Date.now() - 3600000 * 120),
        },
      ]);
    }
  }

  const totalResearch = await ResearchProjectModel.countDocuments();
  if (totalResearch === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (drKarthik) {
      await ResearchProjectModel.insertMany([
        {
          principalInvestigatorId: drKarthik._id,
          coInvestigators: nivedita ? [nivedita._id] : [],
          title: "Edge-AI Autonomous Navigation & Sensor Fusion for Precision Agriculture",
          labName: "HuT Labs (Humanitarian Technology Labs)",
          fundingSource: "DST-SERB & Amrita Seed Research Grant (₹18 Lakhs)",
          campus: "Coimbatore",
          department: "Electronics & Communication",
          category: "Robotics & IoT",
          abstract:
            "Developing low-power autonomous agricultural rovers leveraging lightweight YOLOv11 and depth camera LiDAR sensor fusion on Nvidia Jetson Orin edge boards to detect crop pest infestations in real-time.",
          objectives: [
            "Implement real-time visual odometry and multi-spectral LiDAR fusion under varying farm illumination",
            "Optimize INT8 quantized neural network inference on Jetson Orin with sub-25ms latency",
            "Deploy field trial rovers across rural farmlands in Tamil Nadu & Kerala",
          ],
          openPositions: [
            {
              roleTitle: "Undergraduate Research Assistant (Computer Vision & ROS2)",
              spots: 2,
              prerequisites: ["PyTorch", "ROS2", "OpenCV", "Python / C++"],
            },
            {
              roleTitle: "Embedded Hardware Prototyper",
              spots: 1,
              prerequisites: ["PCB Design", "STM32", "LiDAR Sensors"],
            },
          ],
          publications: [
            {
              title: "Energy-Efficient Edge Inference for Agri-Robotics via Quantized Neural Architecture Search",
              venue: "IEEE Transactions on Agri-Food Electronics 2025",
              link: "https://ieeexplore.ieee.org",
            },
          ],
          status: "recruiting",
          applications: aarav
            ? [
                {
                  applicantId: aarav._id,
                  roleAppliedFor: "Undergraduate Research Assistant (Computer Vision & ROS2)",
                  statementOfInterest:
                    "I have worked extensively with PyTorch and Jetson Nano for autonomous rovers in university hackathons. Excited to contribute to HuT Labs field trials!",
                  relevantSkills: ["PyTorch", "Computer Vision", "Python", "ROS2"],
                  status: "accepted",
                  appliedAt: new Date(Date.now() - 3600000 * 36),
                },
              ]
            : [],
          bookmarks: aarav ? [aarav._id] : [],
          createdAt: new Date(Date.now() - 3600000 * 168),
        },
        {
          principalInvestigatorId: drKarthik._id,
          coInvestigators: [],
          title: "Privacy-Preserving Federated Learning for Multi-Hospital Medical Image Diagnostics",
          labName: "Amrita Center for Computational Intelligence (ACCI)",
          fundingSource: "ICMR Health Informatics Collaborative Grant",
          campus: "Kochi",
          department: "Computer Science & Engineering",
          category: "Biotechnology & Healthcare",
          abstract:
            "Investigating decentralized differential privacy federated learning frameworks across distributed clinical imaging repositories at Amrita Hospital Kochi and collaborating institutes.",
          objectives: [
            "Benchmark DP-SGD privacy budgets against MRI tumor segmentation fidelity",
            "Develop robust aggregation algorithms resilient to non-IID hospital client data drifts",
            "Publish open-source benchmark framework for clinical ML validation",
          ],
          openPositions: [
            {
              roleTitle: "Graduate ML Research Fellow",
              spots: 2,
              prerequisites: ["Differential Privacy", "PyTorch", "Medical Imaging / MONAI"],
            },
          ],
          publications: [
            {
              title: "Robust Aggregation in Asynchronous Federated Medical Imaging",
              venue: "ACM Transactions on Computing for Healthcare 2026",
            },
          ],
          status: "recruiting",
          applications: [],
          bookmarks: [],
          createdAt: new Date(Date.now() - 3600000 * 120),
        },
      ]);
    }
  }

  const totalShowcase = await ProjectShowcaseModel.countDocuments();
  if (totalShowcase === 0) {
    const [aarav, nivedita, drKarthik] = await Promise.all([
      UserModel.findOne({ email: "aarav.student@amrita.edu" }),
      UserModel.findOne({ email: "nivedita.alumni@amrita.edu" }),
      UserModel.findOne({ email: "karthik.research@amrita.edu" }),
    ]);

    if (aarav) {
      await ProjectShowcaseModel.insertMany([
        {
          authorId: aarav._id,
          teamMembers: nivedita ? [nivedita._id] : [],
          title: "Amrita RoverBot: Autonomous Campus Delivery Rover",
          tagline: "Autonomous 4WD ground rover with LiDAR SLAM navigation delivering lab hardware across campus",
          description:
            "Built with ROS2 Humble on an Nvidia Jetson Orin Nano, RoverBot utilizes 2D LiDAR SLAM (Cartographer) and RTAB-Map for full 3D obstacle avoidance. The chassis was custom laser-cut and 3D printed at Amrita TBI Makerspace. It features a QR-code locked payload compartment and an interactive React web dashboard for dispatch tracking.",
          category: "Robotics / IoT",
          techStack: ["ROS2", "Python", "Jetson Orin", "LiDAR", "React", "FastAPI"],
          campus: "Amaravati",
          department: "Computer Science & Engineering",
          githubUrl: "https://github.com/amrita-roverbot/core",
          liveDemoUrl: "https://roverbot.amrita.edu",
          award: "🏆 1st Prize · Smart India Hackathon (SIH 2025)",
          upvotes: [
            aarav._id,
            ...(nivedita ? [nivedita._id] : []),
            ...(drKarthik ? [drKarthik._id] : []),
          ],
          comments: [
            {
              authorId: drKarthik ? drKarthik._id : aarav._id,
              text: "Incredible hardware integration and trajectory smoothing! Would love to test sensor fusion with HuT Labs rovers.",
              createdAt: new Date(Date.now() - 3600000 * 48),
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 200),
        },
        {
          authorId: nivedita ? nivedita._id : aarav._id,
          teamMembers: [aarav._id],
          title: "MediChain: Patient-Centric Consent & EHR Verification",
          tagline: "Decentralized cryptographic consent management for multi-hospital clinical trials",
          description:
            "A zero-knowledge verifiable credential system allowing clinical trial participants to grant selective medical record access to researchers without disclosing their full medical history. Built during the national Web3 Hackathon.",
          category: "Blockchain",
          techStack: ["Solidity", "Next.js", "IPFS", "TypeScript", "Ethers.js"],
          campus: "Bengaluru",
          department: "Computer Science & Engineering",
          githubUrl: "https://github.com/nivedita-amrita/medichain",
          award: "🥇 Best Web3 Innovation · ETHIndia 2025",
          upvotes: [
            aarav._id,
            ...(nivedita ? [nivedita._id] : []),
          ],
          comments: [],
          createdAt: new Date(Date.now() - 3600000 * 150),
        },
      ]);
    }
  }
}









