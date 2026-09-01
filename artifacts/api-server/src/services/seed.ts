import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { eventsTable, opportunitiesTable, usersTable } from "@workspace/db";

export async function seedDevelopmentData() {
  const [{ total }] = await db.select({ total: count() }).from(usersTable);
  if (Number(total) > 0) return;

  const passwordHash = await bcrypt.hash("amrita-demo-2026", 10);
  const [student, alumni, faculty] = await db
    .insert(usersTable)
    .values([
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
      },
    ])
    .returning();

  await db.insert(opportunitiesTable).values([
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

  await db.insert(eventsTable).values([
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

  await db.insert(usersTable).values({
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
  }).onConflictDoNothing({ target: usersTable.email });

  void student;
  void alumni;
  void faculty;
}