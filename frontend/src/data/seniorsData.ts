import kavyaPhoto from '@photos/kavya.png';
import niteshPhoto from '@photos/nitesh.png';
import richaPhoto from '@photos/richa.png';
import rupaPhoto from '@photos/rupa.png';
import shudarsanPhoto from '@photos/shudarsan.png';

export interface PlacementOffer {
  company: string;
  role: string;
  category: 'Super Dream' | 'Dream' | 'Enterprise' | 'Tier-1 Tech';
  year: string;
  logo: string;
}

export interface ArticleGuide {
  id: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  summary: string;
  content: string;
  keyTakeaways: string[];
}

export interface MentorshipSessionType {
  id: string;
  title: string;
  duration: string;
  description: string;
  topics: string[];
}

export interface PostActivity {
  id: string;
  date: string;
  content: string;
  likes: number;
  comments: number;
  tag: string;
}

export interface SeniorProfile {
  slug: string;
  name: string;
  avatar: string;
  role: string;
  roleColor: string;
  companies: string[];
  companyDisplay: string;
  location: string;
  campus: string;
  department: string;
  batch: string;
  graduationYear: string;
  ringClass: string;
  btnClass: string;
  badgeClass: string;
  logos: string[];
  headline: string;
  bio: string;
  verified: boolean;
  type: 'senior' | 'alumni';
  skills: string[];
  tools: string[];
  helpWith: string[];
  offers: PlacementOffer[];
  blogs: ArticleGuide[];
  posts: PostActivity[];
  mentorshipSessions: MentorshipSessionType[];
}

export const PLACED_SENIORS: SeniorProfile[] = [
  {
    slug: 'nitesh',
    name: 'Nitesh Kumar',
    avatar: niteshPhoto,
    role: 'Software Development Engineer (SDE)',
    roleColor: 'text-amber-600 dark:text-amber-400',
    companies: ['Amazon', 'Infosys'],
    companyDisplay: 'Amazon · Infosys',
    location: 'Bengaluru / Hyderabad',
    campus: 'Bengaluru Campus',
    department: 'Computer Science & Engineering',
    batch: 'Batch of 2023',
    graduationYear: '2023',
    ringClass: 'ring-amber-500/90 hover:ring-amber-400',
    btnClass: 'bg-amber-50/90 text-amber-700 hover:bg-amber-100 border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    logos: ['amazon', 'infosys'],
    headline: 'Incoming SDE @ Amazon | Former Offer @ Infosys | Backend Systems & DSA Enthusiast',
    bio: `Final-year CSE senior placed at Amazon (Super Dream) and Infosys. Passionate about large-scale distributed architectures, algorithms, and cloud infrastructure. Solved over 850+ problems on LeetCode and Codeforces, with deep practical experience in low-level system design (LLD) and Java Spring Boot. Actively mentoring Amrita juniors to prepare effectively for campus placement drives and technical bar-raisers.`,
    verified: true,
    type: 'senior',
    skills: ['Data Structures & Algorithms', 'Java & Spring Boot', 'AWS (EC2, S3, DynamoDB)', 'System Design (LLD & HLD)', 'Distributed Systems', 'PostgreSQL & Redis', 'Microservices'],
    tools: ['Git/GitHub', 'Docker', 'IntelliJ IDEA', 'Postman', 'Linux Shell', 'AWS CloudWatch'],
    helpWith: [
      'Amazon SDE interview preparation & Leadership Principles breakdown',
      'Data Structures & Algorithms problem-solving strategies',
      'Resume review and portfolio feedback for product companies',
      'Low-Level Design (LLD) and Object-Oriented design patterns',
      'Mock technical interviews with real-time feedback'
    ],
    offers: [
      {
        company: 'Amazon',
        role: 'Software Development Engineer (SDE-1)',
        category: 'Super Dream',
        year: '2024',
        logo: 'amazon',
      },
      {
        company: 'Infosys',
        role: 'Specialist Programmer (SES)',
        category: 'Dream',
        year: '2024',
        logo: 'infosys',
      },
    ],
    blogs: [
      {
        id: 'amazon-sde-roadmap',
        title: 'How I Cracked Amazon SDE from Amrita: DSA, System Design & Leadership Principles',
        date: 'August 2024',
        readTime: '6 min read',
        tags: ['Amazon SDE', 'Campus Placements', 'DSA', 'Interview Prep'],
        summary: 'A complete step-by-step roadmap detailing the exact problem types, dynamic programming patterns, and how to formulate STAR responses for Amazon Leadership Principles.',
        content: `Preparing for Amazon off-campus and on-campus recruitment requires a disciplined, structured approach. Here is the framework that worked for me:

1. Mastering DSA Core Patterns:
Instead of randomly grinding questions, focus on core algorithmic paradigms:
- Graphs: BFS/DFS traversals, Dijkstra, Topological Sort, Union-Find.
- Dynamic Programming: 0/1 Knapsack, Longest Common Subsequence, Grid-based DP.
- Trees & Heaps: Lowest Common Ancestor, Trie for prefix lookups, Median in a stream.

2. Low-Level Design (LLD) & Clean Code:
Amazon technical rounds place heavy weight on object-oriented programming:
- SOLID principles application in real scenarios (e.g., Designing a Parking Lot or Elevator System).
- Design Patterns: Strategy, Observer, Factory, and Singleton.
- Exception handling, modularity, and readable variable naming.

3. The Amazon Leadership Principles (LP):
Many candidates fail not because of DSA, but because of weak LP answers. Prepare at least 2 real STAR (Situation, Task, Action, Result) stories for principles like "Customer Obsession", "Ownership", "Bias for Action", and "Deliver Results".

Feel free to book a mock interview slot with me on Amrita Connect if you want personalized feedback!`,
        keyTakeaways: [
          'Solve 150-200 curated questions across core graph, tree, and DP patterns.',
          'Always state time and space complexity before writing a single line of code.',
          'Quantify results in your behavioral STAR stories (e.g., "reduced latency by 35%").'
        ]
      },
      {
        id: 'infosys-ses-prep',
        title: 'Infosys Specialist Programmer (SES) Assessment & Interview Strategy',
        date: 'July 2024',
        readTime: '4 min read',
        tags: ['Infosys', 'SES Coding', 'Aptitude & DSA'],
        summary: 'Detailed round breakdown of the 3-question coding assessment in Infosys Specialist Programmer recruitment and how to optimize solution complexity.',
        content: `The Infosys Specialist Programmer (SES) role is a great stepping stone for students aiming for high-impact software roles right out of college.

The online test usually consists of 3 algorithmic problems:
- Problem 1 (Easy-Medium): Ad-hoc logic, greedy algorithms, or basic hash maps.
- Problem 2 (Medium-Hard): Trees, graph traversal, or sliding window string manipulation.
- Problem 3 (Hard): Advanced dynamic programming or segment tree queries.

Key tips for the interview round:
- Be thorough with your capstone project architecture.
- Expect in-depth questions on SQL Joins, indexing, and ACID properties.
- Explain trade-offs between different data structures clearly.`,
        keyTakeaways: [
          'Allocate your 3 hours wisely: secure 100% test cases on Problem 1 & 2 before attempting the hard DP problem.',
          'Double-check edge cases: null inputs, negative constraints, integer overflows.'
        ]
      }
    ],
    posts: [
      {
        id: 'p1',
        date: '2 days ago',
        content: '🚀 To all 3rd and 4th-year students stepping into placement drives: Consistency beats cramming! Practicing 2 problems daily with deep understanding is 10x better than doing 20 questions mindlessly. Reach out if you need resume reviews or guidance on Amazon SDE rounds!',
        likes: 42,
        comments: 11,
        tag: 'Placement Tips'
      },
      {
        id: 'p2',
        date: '1 week ago',
        content: '💡 In technical rounds, interviewers want to see how you think out loud. Always discuss brute force first, analyze bottlenecks, and propose the optimal approach with trade-offs before typing code.',
        likes: 38,
        comments: 7,
        tag: 'Interview Strategy'
      }
    ],
    mentorshipSessions: [
      {
        id: 'm1',
        title: 'Amazon SDE & Product Company 1:1 Roadmap',
        duration: '45 mins',
        description: 'Comprehensive walkthrough of the recruitment pipeline, resume audit, and tailored DSA preparation schedule.',
        topics: ['Amazon SDE Rounds', 'DSA Strategy', 'Behavioral Leadership Principles']
      },
      {
        id: 'm2',
        title: 'Live DSA Coding & Problem-Solving Mock',
        duration: '60 mins',
        description: 'Simulated 1-on-1 coding round on shared IDE with real-time hints, complexity analysis, and post-round actionable notes.',
        topics: ['Live Coding', 'Graph/DP Questions', 'Complexity Optimization']
      }
    ]
  },
  {
    slug: 'richa',
    name: 'Richa Jaishwal',
    avatar: richaPhoto,
    role: 'Systems Engineer / Full Stack Developer',
    roleColor: 'text-blue-600 dark:text-blue-400',
    companies: ['Infosys'],
    companyDisplay: 'Infosys',
    location: 'Bengaluru / Amritapuri',
    campus: 'Bengaluru Campus',
    department: 'Computer Science & Engineering',
    batch: 'Batch of 2023',
    graduationYear: '2023',
    ringClass: 'ring-blue-500/90 hover:ring-blue-400',
    btnClass: 'bg-blue-50/90 text-blue-700 hover:bg-blue-100 border-blue-300/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    logos: ['infosys'],
    headline: 'Placed at Infosys | Full-Stack Web Development, Modern UI/UX & React Ecosystem Specialist',
    bio: `Senior in Computer Science placed at Infosys with a proven passion for building beautiful, resilient full-stack applications. Creator of modern web tools, active mentor for women in tech, and enthusiastic peer tutor. Specializes in TypeScript, React 19, Tailwind CSS, Node.js, and database design. Believes in helping every junior build genuine project portfolios that turn recruiters' heads.`,
    verified: true,
    type: 'senior',
    skills: ['React 19 & Next.js', 'TypeScript', 'Node.js & Express', 'MongoDB & PostgreSQL', 'Tailwind CSS & UI Architecture', 'RESTful & GraphQL APIs', 'State Management (TanStack Query, Zustand)'],
    tools: ['VS Code', 'Git/GitHub', 'Figma', 'Vercel', 'Postman', 'Docker Basics'],
    helpWith: [
      'Infosys recruitment process, aptitude strategy, and technical round prep',
      'Full-stack project building & structuring GitHub repositories',
      'Frontend engineering, modern React patterns, and responsive UI design',
      'Resume reviews & LinkedIn profile optimization for campus hiring',
      'Peer mentorship and placement confidence building'
    ],
    offers: [
      {
        company: 'Infosys',
        role: 'Systems Engineer',
        category: 'Enterprise',
        year: '2024',
        logo: 'infosys',
      }
    ],
    blogs: [
      {
        id: 'infosys-journey-roadmap',
        title: 'From Campus to Infosys: My Placement Journey, Technical Rounds & Resume Tips',
        date: 'August 2024',
        readTime: '5 min read',
        tags: ['Infosys', 'Campus Placement', 'Full Stack', 'Resume Tips'],
        summary: 'A transparent review of the Infosys hiring stages, online aptitude tricks, pseudo-code logic questions, and how to showcase full-stack projects during technical interviews.',
        content: `Securing an offer from Infosys gives you a strong launchpad into enterprise software engineering. Here is how I navigated the entire process:

Phase 1: Online Assessment (Cognitive & Pseudo-code)
- Logical & Analytical Reasoning: Focus on data arrangement, syllogisms, and sequence puzzles.
- Pseudo-code & Debugging: Practice tracking loops, bitwise operations, and recursion call stacks on paper.
- Verbal Ability: Sentence correction and reading comprehension under strict time bounds.

Phase 2: Technical & HR Discussion
- Be ready to explain the architecture of your full-stack projects in depth: why did you choose MongoDB over SQL? How did you handle user authentication and session expiry?
- Know core DBMS concepts: Normalization (1NF to 3NF), primary vs foreign keys, indexing, and ACID transactions.
- Keep an open, enthusiastic mindset. Highlight teamwork and hackathon experiences.

I am always available to help Amrita juniors with mock interviews or project reviews!`,
        keyTakeaways: [
          'Pseudo-code questions test your attention to detail—dry-run edge loop conditions carefully.',
          'Deploy your personal projects with live URLs on your resume (e.g. Vercel or Render).',
          'Demonstrate clear communication and willingness to learn new technologies.'
        ]
      },
      {
        id: 'building-standout-projects',
        title: 'Building Real-World Full-Stack Projects That Stand Out on Your Resume',
        date: 'July 2024',
        readTime: '6 min read',
        tags: ['Web Dev', 'Projects', 'Portfolio', 'React'],
        summary: 'Why generic todo apps get ignored by recruiters and how to build production-ready platforms with authentication, state management, and clean UI.',
        content: `Recruiters review hundreds of student resumes every week. To stand out, your projects should solve a tangible problem and show software engineering craftsmanship.

Key elements of a standout project:
1. Authentic Domain: Build something for your campus, student clubs, or local community.
2. Production Polish: Proper error boundaries, loading skeletons, responsive mobile views, and accessible contrast.
3. Clean Backend Architecture: Modular route handlers, schema validation (Zod/Joi), and robust authentication (JWT/OAuth).
4. Detailed GitHub README: Include feature GIF previews, architecture diagrams, and one-click setup commands.`,
        keyTakeaways: [
          'Quality over quantity: 2 deeply engineered full-stack apps beat 10 shallow tutorials.',
          'Add automated tests or CI/CD badges to show professional engineering standards.'
        ]
      }
    ],
    posts: [
      {
        id: 'rp1',
        date: '3 days ago',
        content: '✨ Super excited to collaborate on Amrita Connect! Connecting students across all 7 campuses will break barriers in finding project teammates and alumni mentors. Feel free to connect or ask for guidance on web dev & Infosys prep!',
        likes: 54,
        comments: 14,
        tag: 'Community'
      },
      {
        id: 'rp2',
        date: '1 week ago',
        content: '💡 Web development tip: Don\'t just learn syntax; learn how browsers render CSS, how state managers re-render components, and how network caching works. That depth makes all the difference in interviews!',
        likes: 47,
        comments: 8,
        tag: 'Web Development'
      }
    ],
    mentorshipSessions: [
      {
        id: 'rm1',
        title: 'Infosys Placement Prep & Resume Roast',
        duration: '30 mins',
        description: 'Detailed review of your resume structure, keyword optimization for ATS, and step-by-step guidance for Infosys assessment rounds.',
        topics: ['Resume Review', 'Infosys Rounds', 'Interview FAQs']
      },
      {
        id: 'rm2',
        title: 'Full-Stack Project Architecture & Portfolio Review',
        duration: '45 mins',
        description: 'Code review of your React/Node projects with suggestions on state management, API design, and hosting presentation.',
        topics: ['React / TypeScript', 'Full Stack Architecture', 'GitHub Portfolio']
      }
    ]
  },
  {
    slug: 'shudarsan',
    name: 'Shudarsan S',
    avatar: shudarsanPhoto,
    role: 'Data Scientist / ML Engineer',
    roleColor: 'text-purple-600 dark:text-purple-400',
    companies: ['The Math Company (MathCo)'],
    companyDisplay: 'The Math Company (MathCo)',
    location: 'Coimbatore / Bengaluru',
    campus: 'Coimbatore Campus',
    department: 'Artificial Intelligence & Data Science',
    batch: 'Batch of 2023',
    graduationYear: '2023',
    ringClass: 'ring-purple-500/90 hover:ring-purple-400',
    btnClass: 'bg-purple-50/90 text-purple-700 hover:bg-purple-100 border-purple-300/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    logos: ['mathco'],
    headline: 'Placed at The Math Company (MathCo) | AI, Predictive Modeling & Enterprise Analytics',
    bio: `AI & Data Science senior placed at The Math Company (MathCo) in a high-impact analytics role. Experienced in developing machine learning models, statistical analysis, NLP pipelines, and interactive business dashboards. Passionate about translating complex datasets into actionable business intelligence. Mentoring students in SQL puzzles, analytics case studies, and ML project portfolios.`,
    verified: true,
    type: 'senior',
    skills: ['Python (Pandas, NumPy, Scikit-Learn)', 'Machine Learning & Predictive Modeling', 'Deep Learning (PyTorch, TensorFlow)', 'Advanced SQL & Data Warehousing', 'Data Visualization (PowerBI, Tableau, Seaborn)', 'NLP & Transformers', 'Statistical Hypothesis Testing'],
    tools: ['Jupyter Notebooks', 'Git', 'Google BigQuery', 'PowerBI', 'VS Code', 'Docker'],
    helpWith: [
      'The Math Company (MathCo) recruitment process and case study rounds',
      'Advanced SQL queries, window functions, and data puzzle preparation',
      'Data Science & Machine Learning portfolio projects',
      'Statistical concepts, regression, classification, and metrics (AUC-ROC, F1, RMSE)',
      'Guesstimates and consulting-style problem-solving frameworks'
    ],
    offers: [
      {
        company: 'The Math Company (MathCo)',
        role: 'Associate Consultant / Data Scientist',
        category: 'Dream',
        year: '2024',
        logo: 'mathco',
      }
    ],
    blogs: [
      {
        id: 'mathco-analytics-guide',
        title: 'Acing Data Science & Analytics Interviews at The Math Company (MathCo)',
        date: 'August 2024',
        readTime: '6 min read',
        tags: ['MathCo', 'Data Science', 'Analytics', 'SQL Puzzles'],
        summary: 'How to tackle business case studies, SQL query rounds, machine learning trade-offs, and guesstimates in consulting analytics interviews.',
        content: `Interviews for analytics consulting firms like The Math Company assess both your technical quantitative skills and business reasoning.

Key Assessment Stages:
1. SQL & Data Manipulation Test:
Expect questions requiring window functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD/LAG), Common Table Expressions (CTEs), and complex aggregations.

2. Machine Learning & Statistics Round:
- Clear understanding of Bias-Variance Tradeoff, Regularization (L1 vs L2), Overfitting mitigation.
- Choosing evaluation metrics: Why Accuracy is misleading for imbalanced fraud detection and why F1 / Precision-Recall curve is preferred.
- Handling missing data, outliers, and feature scaling techniques.

3. Business Case Studies & Guesstimates:
- Structure your thought process logically (e.g. MECE framework).
- Always tie model predictions back to business outcomes (revenue growth, churn reduction, operational efficiency).

Book a 1:1 session with me if you want to practice mock SQL puzzles or case interviews!`,
        keyTakeaways: [
          'Master SQL window functions and aggregations—they are guaranteed to appear.',
          'Always explain the business intuition behind your choice of ML algorithm.',
          'Practice structuring guesstimates and consulting case studies out loud.'
        ]
      },
      {
        id: 'practical-ml-pipelines',
        title: 'Moving from Kaggle Notebooks to Production-Ready ML Pipelines',
        date: 'June 2024',
        readTime: '5 min read',
        tags: ['Machine Learning', 'Pipelines', 'Feature Engineering'],
        summary: 'Essential tools, feature store concepts, and model validation techniques every aspiring data scientist should master before campus drives.',
        content: `A common pitfall in student resumes is having notebooks that stop at model.fit(). To impress recruiters in AI/DS domains, show end-to-end thinking:
- Data Versioning and reproducibility.
- Automated feature preprocessing pipelines using Scikit-Learn ColumnTransformer and Pipeline.
- Exposing model predictions via FastAPI microservices wrapped in Docker containers.`,
        keyTakeaways: [
          'Package your models with clean REST endpoints.',
          'Focus on robust feature engineering rather than just hyperparameter brute forcing.'
        ]
      }
    ],
    posts: [
      {
        id: 'sp1',
        date: '4 days ago',
        content: '📊 To all juniors preparing for analytics & data science roles: Don\'t sleep on SQL! 80% of real-world data science is data wrangling and aggregation before any ML algorithm is even trained. Happy to share SQL practice sets if anyone needs them!',
        likes: 61,
        comments: 18,
        tag: 'Data Science'
      },
      {
        id: 'sp2',
        date: '2 weeks ago',
        content: '💡 In analytics interviews, when asked to estimate a metric or solve a business problem, write down your assumptions clearly. Structure and clarity of logic matter far more than reaching the exact decimal number.',
        likes: 39,
        comments: 6,
        tag: 'Case Studies'
      }
    ],
    mentorshipSessions: [
      {
        id: 'sm1',
        title: 'MathCo & Data Science Interview Strategy',
        duration: '45 mins',
        description: 'Comprehensive preparation for analytics interviews, business case study walkthroughs, and ML project reviews.',
        topics: ['MathCo Rounds', 'Business Analytics', 'ML Concepts']
      },
      {
        id: 'sm2',
        title: 'Live SQL Querying & Data Puzzle Mock',
        duration: '45 mins',
        description: 'Solve real-time SQL puzzles covering window functions, joins, and aggregations with instant critique.',
        topics: ['SQL Queries', 'Window Functions', 'Data Puzzles']
      }
    ]
  },
  {
    slug: 'kavya',
    name: 'Kavya R',
    avatar: kavyaPhoto,
    role: 'Software Engineer / Cloud & Systems Specialist',
    roleColor: 'text-emerald-600 dark:text-emerald-400',
    companies: ['Lam Research', 'ServiceNow'],
    companyDisplay: 'Lam Research · ServiceNow',
    location: 'Amritapuri / Bengaluru',
    campus: 'Amritapuri Campus',
    department: 'Computer Science & Engineering',
    batch: 'Batch of 2023',
    graduationYear: '2023',
    ringClass: 'ring-emerald-500/90 hover:ring-emerald-400',
    btnClass: 'bg-emerald-50/90 text-emerald-700 hover:bg-emerald-100 border-emerald-300/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    logos: ['lamresearch', 'servicenow'],
    headline: 'Double Placed @ Lam Research & ServiceNow | Systems Architecture, Cloud & Core CS Specialist',
    bio: `Final year senior with dual Super Dream offers from Lam Research and ServiceNow. Deeply passionate about systems software, operating systems, cloud workflow platforms, and high-performance computing. Proven track record in competitive programming, core CS subject excellence, and scalable backend design. Excited to guide juniors on cracking tier-1 hardware and enterprise SaaS leaders.`,
    verified: true,
    type: 'senior',
    skills: ['C++ & Java Systems', 'Operating Systems & Concurrency', 'ServiceNow Cloud Workflows', 'Database Management (PostgreSQL, Redis)', 'Data Structures & Algorithms', 'Computer Networks & TCP/IP', 'Microservices Architecture'],
    tools: ['Git/GitHub', 'Linux (GDB, Valgrind)', 'Postman', 'Docker', 'IntelliJ / CLion'],
    helpWith: [
      'Lam Research & ServiceNow interview pipelines and round patterns',
      'Mastering Core CS fundamentals: Operating Systems, DBMS, Computer Networks, and OOP',
      'Concurrency, multi-threading, synchronization primitives, and memory management',
      'Mock technical interviews with deep algorithmic and architectural grilling',
      'Decision strategy and negotiation when holding multiple campus offers'
    ],
    offers: [
      {
        company: 'Lam Research',
        role: 'Software Engineer',
        category: 'Super Dream',
        year: '2024',
        logo: 'lamresearch',
      },
      {
        company: 'ServiceNow',
        role: 'Associate Software Engineer',
        category: 'Super Dream',
        year: '2024',
        logo: 'servicenow',
      },
    ],
    blogs: [
      {
        id: 'lam-servicenow-strategy',
        title: 'How I Secured Offers from Both Lam Research and ServiceNow: Technical Strategy & Preparation',
        date: 'August 2024',
        readTime: '7 min read',
        tags: ['Lam Research', 'ServiceNow', 'Super Dream', 'Core CS'],
        summary: 'In-depth guide covering OS memory management, multithreading, advanced DSA, and behavioral interviews for semiconductor & enterprise SaaS giants.',
        content: `Securing offers from both a global semiconductor software leader (Lam Research) and a premier cloud enterprise platform (ServiceNow) required balancing core engineering with modern system design.

1. Lam Research Focus Areas:
- Deep C++/Java knowledge: Virtual functions, vtable mechanics, memory allocation, smart pointers.
- Operating Systems: Process scheduling, semaphore vs mutex, deadlocks (Banker's Algorithm), virtual memory and paging.
- Real-time performance: Cache locality, memory fragmentation, and thread safety.

2. ServiceNow Focus Areas:
- Data Structures: Graph traversals, binary search variations, hash table collisions, and tree queries.
- Object-Oriented Design: Designing modular, extensible workflows and state machines.
- Database concepts: Indexing strategies (B+ Trees), transaction isolation levels, normalization.

3. The Multi-Round Mindset:
Stay composed during grueling back-to-back technical rounds. If you don't know an obscure edge case, explain how you would debug or investigate it using standard profiling tools.`,
        keyTakeaways: [
          'Never neglect Core CS subjects—they carry equal weight to DSA in tier-1 product companies.',
          'Be ready to explain thread synchronization and race conditions with real code examples.',
          'Confidence and structured communication are decisive factors in final rounds.'
        ]
      },
      {
        id: 'core-cs-mastery-guide',
        title: 'The Comprehensive Guide to Core CS Subjects for Campus Placements',
        date: 'July 2024',
        readTime: '5 min read',
        tags: ['Operating Systems', 'DBMS', 'Computer Networks', 'OOPs'],
        summary: 'A curated checklist of high-frequency interview questions across OS, DBMS, Networks, and OOPs that every candidate must know.',
        content: `Most students spend 90% of their time on LeetCode and neglect core academic subjects until the night before the interview. This is a huge mistake.

Must-know topics:
- OS: Thread vs Process, Context Switching, Deadlock Conditions, Page Replacement Algorithms.
- DBMS: Clustered vs Non-Clustered Indexes, ACID Properties, SQL Joins vs Subqueries.
- Networks: OSI 7-Layer model, TCP 3-Way Handshake, DNS resolution flow, HTTPS TLS handshake.
- OOPs: Inheritance vs Composition, Polymorphism, Abstraction, Interface vs Abstract Class.`,
        keyTakeaways: [
          'Review 2-3 core subjects alongside daily DSA practice.',
          'Understand the practical "why" behind concepts like database indexing and TCP windowing.'
        ]
      }
    ],
    posts: [
      {
        id: 'kp1',
        date: '2 days ago',
        content: '🎉 Grateful for the mentorship and support received throughout my journey at Amrita! To all juniors gearing up for placement season: keep your core fundamentals razor-sharp alongside coding practice. Open for 1:1 mentorship and mock technical interviews!',
        likes: 78,
        comments: 23,
        tag: 'Career Milestone'
      },
      {
        id: 'kp2',
        date: '1 week ago',
        content: '💡 In multi-threading questions, interviewers are testing whether you understand race conditions and deadlock prevention. Practice implementing thread-safe producer-consumer queues from scratch!',
        likes: 52,
        comments: 9,
        tag: 'Systems Engineering'
      }
    ],
    mentorshipSessions: [
      {
        id: 'km1',
        title: 'Lam Research & ServiceNow Multi-Offer Strategy',
        duration: '45 mins',
        description: 'Deep dive into what tier-1 hardware and SaaS recruiters look for, technical question patterns, and confidence building.',
        topics: ['Lam Research Prep', 'ServiceNow Prep', 'Super Dream Strategy']
      },
      {
        id: 'km2',
        title: 'Core CS Foundations & Mock Interview',
        duration: '60 mins',
        description: 'Comprehensive grilling on Operating Systems, DBMS, Object-Oriented Design, and multithreading concepts.',
        topics: ['OS & Concurrency', 'DBMS & Indexing', 'OOPs Design']
      }
    ]
  },
  {
    slug: 'rupa',
    name: 'Rupa Sri',
    avatar: rupaPhoto,
    role: 'Associate Software Engineer / Systems Specialist',
    roleColor: 'text-rose-600 dark:text-rose-400',
    companies: ['TCS (Tata Consultancy Services)'],
    companyDisplay: 'TCS (Tata Consultancy Services)',
    location: 'Chennai / Hyderabad',
    campus: 'Chennai Campus',
    department: 'Computer Science & Engineering',
    batch: 'Batch of 2023',
    graduationYear: '2023',
    ringClass: 'ring-rose-500/90 hover:ring-rose-400',
    btnClass: 'bg-rose-50/90 text-rose-700 hover:bg-rose-100 border-rose-300/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    logos: ['tcs'],
    headline: 'Placed at TCS (Tata Consultancy Services) | Software Engineering, Database Systems & Enterprise Solutions',
    bio: `Final year senior in Computer Science placed at TCS with strong expertise in software development, database systems, Java, Python, and enterprise application workflows. Active in coding clubs, hackathons, and community initiatives across Amrita Chennai. Dedicated to mentoring juniors in aptitude cracking, technical interview readiness, and final-year placement confidence.`,
    verified: true,
    type: 'senior',
    skills: ['Java & Python Programming', 'SQL & Relational Databases', 'Software Engineering Lifecycle', 'HTML/CSS/JavaScript', 'Object-Oriented Design', 'Git Version Control', 'Agile & Scrum Delivery'],
    tools: ['Eclipse / VS Code', 'MySQL Workbench', 'Git', 'Postman', 'Linux Terminal'],
    helpWith: [
      'TCS NQT / Digital / Prime round formats and preparation roadmap',
      'Aptitude, quantitative reasoning, and time management in mass hiring drives',
      'Technical interview fundamentals (Java, OOPs, SQL, and mini-projects)',
      'Confidence building and HR round communication skills',
      'Resume optimization and campus placement survival tips'
    ],
    offers: [
      {
        company: 'TCS (Tata Consultancy Services)',
        role: 'Associate Software Engineer (Digital)',
        category: 'Enterprise',
        year: '2024',
        logo: 'tcs',
      }
    ],
    blogs: [
      {
        id: 'tcs-nqt-digital-guide',
        title: 'Cracking TCS NQT & Digital: Complete Round-by-Round Preparation Guide',
        date: 'August 2024',
        readTime: '5 min read',
        tags: ['TCS NQT', 'TCS Digital', 'Campus Placement', 'Aptitude & Coding'],
        summary: 'A comprehensive walkthrough of TCS National Qualifier Test (NQT) sections, advanced coding challenges, and key technical interview questions.',
        content: `TCS recruitment opens immense opportunities for engineering students across all branches. Here is a battle-tested strategy:

Round 1: Foundation & Advanced Cognitive Test
- Numerical Ability: Time & Work, Speed & Distance, Percentages, Profit & Loss.
- Reasoning Ability: Data sufficiency, coding-decoding, and Venn diagrams.
- Advanced Coding Section: 2 problems (1 standard array/string problem, 1 medium dynamic programming or matrix math problem).

Round 2: Technical Interview
- Strong grasp of your preferred language (Java/Python/C++).
- Common questions: String manipulation without built-in functions, finding prime factors, matrix rotations.
- Explain your academic projects with pride: mention challenges you solved and teamwork dynamics.

Round 3: HR / MR Round
- Questions on relocation, shift flexibility, learning new tech stacks, and ethical dilemmas. Keep your answers genuine, positive, and enthusiastic.

Reach out for 1:1 guidance or resume reviews!`,
        keyTakeaways: [
          'Speed and accuracy in cognitive rounds are paramount—practice timed mock tests.',
          'Write modular, well-commented code in the online coding environment.',
          'Display positive energy and adaptable learning mindset during HR rounds.'
        ]
      },
      {
        id: 'first-interview-checklist',
        title: 'Ace Your First Technical Interview: A Beginner-Friendly Checklist for CSE Students',
        date: 'June 2024',
        readTime: '4 min read',
        tags: ['Interview Prep', 'Beginners', 'Campus Hiring'],
        summary: 'Confidence tips, essential questions to ask your interviewer, and common mistakes to avoid during on-campus hiring drives.',
        content: `Your first campus interview can feel intimidating, but structured preparation turns nervousness into confidence.
1. Have a 90-second crisp self-introduction ready.
2. Know every single word written on your resume.
3. If you get stuck on a coding question, don't stay silent—talk through your hypotheses.
4. Prepare thoughtful questions for the panel at the end of the interview.`,
        keyTakeaways: [
          'Preparation eliminates anxiety: practice answering common questions in front of a mirror or friend.',
          'Always communicate clearly and thank the panel at the conclusion of the interview.'
        ]
      }
    ],
    posts: [
      {
        id: 'rp_1',
        date: '3 days ago',
        content: '🌟 Wishing the best of luck to everyone attending campus placement drives this week! Stay confident in what you have learned, trust your preparation, and remember that rejection is just redirection to the right opportunity. Reach out if you need mock interviews!',
        likes: 67,
        comments: 15,
        tag: 'Motivation'
      },
      {
        id: 'rp_2',
        date: '2 weeks ago',
        content: '💡 In coding rounds, always test boundary conditions: empty array, single element, negative numbers, and maximum integer constraints before clicking submit!',
        likes: 41,
        comments: 8,
        tag: 'Coding Tips'
      }
    ],
    mentorshipSessions: [
      {
        id: 'rpm1',
        title: 'TCS NQT & Digital Placement Blueprint',
        duration: '30 mins',
        description: 'Step-by-step roadmap for cracking aptitude sections, coding tests, and technical interview questions for TCS recruitment.',
        topics: ['TCS NQT', 'Aptitude & Coding', 'Technical Round']
      },
      {
        id: 'rpm2',
        title: 'Campus Interview Readiness & Confidence Mock',
        duration: '45 mins',
        description: 'Simulated 1-on-1 mock interview covering self-intro, project explanation, OOPs basics, and HR situational questions.',
        topics: ['Mock Interview', 'Communication & Confidence', 'HR Round']
      }
    ]
  }
];

export const PLACED_ALUMNI_DATA: SeniorProfile[] = [
  {
    slug: 'arjun',
    name: 'Arjun Narayanan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=280&q=80',
    role: 'Staff Software Engineer',
    roleColor: 'text-blue-600 dark:text-blue-400',
    companies: ['Google'],
    companyDisplay: 'Google',
    location: 'Google, Mountain View, USA',
    campus: 'Coimbatore Campus',
    department: 'Computer Science & Engineering',
    batch: 'Class of 2019 • CSE',
    graduationYear: '2019',
    ringClass: 'ring-blue-500/90 hover:ring-blue-400',
    btnClass: 'bg-blue-50/90 text-blue-700 hover:bg-blue-100 border-blue-300/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    logos: ['google'],
    headline: 'Staff Software Engineer @ Google | Distributed Systems & Global Infrastructure',
    bio: 'Alumnus working on hyper-scale infrastructure and distributed query engines at Google headquarters. Passionate about helping Amrita students bridge the gap to global tech careers.',
    verified: true,
    type: 'alumni',
    skills: ['Distributed Systems', 'Go / C++', 'Kubernetes & Borg', 'Database Internals', 'System Architecture'],
    tools: ['Google Internal Tools', 'Bazel', 'gRPC', 'Protobuf'],
    helpWith: ['Google Global SDE Interviews', 'High-Level System Design (HLD)', 'MS/PhD abroad guidance'],
    offers: [{ company: 'Google', role: 'Staff Software Engineer', category: 'Tier-1 Tech', year: '2019', logo: 'google' }],
    blogs: [
      {
        id: 'google-systems-engineering',
        title: 'Architecting for Billions: Lessons from Distributed Systems at Google',
        date: 'May 2024',
        readTime: '8 min read',
        tags: ['Google', 'Distributed Systems', 'Infrastructure'],
        summary: 'How global scale fundamentally changes how we think about consistency, network partitions, and microservice resiliency.',
        content: 'Building infrastructure that handles millions of queries per second requires deep respect for failure domains, tail latency, and asynchronous consensus protocols...',
        keyTakeaways: ['Design with failure as a first-class assumption.', 'Understand p99 latency trade-offs.']
      }
    ],
    posts: [
      {
        id: 'ap1',
        date: '1 week ago',
        content: '🌐 Proud to see the Amrita student community growing stronger every year. If you are preparing for international tech applications, master distributed systems fundamentals and open-source contributions.',
        likes: 112,
        comments: 29,
        tag: 'Alumni Network'
      }
    ],
    mentorshipSessions: [
      {
        id: 'am1',
        title: 'Global Tech Careers & Google SDE Guidance',
        duration: '45 mins',
        description: 'Office hours for senior students aspiring for global tech companies and distributed systems engineering.',
        topics: ['Google Interviews', 'Global Careers', 'System Design']
      }
    ]
  },
  {
    slug: 'meghana',
    name: 'Meghana Iyer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=280&q=80',
    role: 'Principal Product Manager',
    roleColor: 'text-sky-500 dark:text-sky-400',
    companies: ['Microsoft'],
    companyDisplay: 'Microsoft',
    location: 'Microsoft, Redmond, USA',
    campus: 'Amritapuri Campus',
    department: 'Electronics & Communication',
    batch: 'Class of 2018 • ECE',
    graduationYear: '2018',
    ringClass: 'ring-sky-500/90 hover:ring-sky-400',
    btnClass: 'bg-sky-50/90 text-sky-700 hover:bg-sky-100 border-sky-300/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    logos: ['microsoft'],
    headline: 'Principal Product Manager @ Microsoft Azure | AI Platforms & Cloud Ecosystems',
    bio: 'Product leader at Microsoft building developer platforms and Azure AI capabilities. Mentoring engineers looking to transition into Product Management (PM).',
    verified: true,
    type: 'alumni',
    skills: ['Product Strategy', 'Cloud Platforms', 'User Experience (UX)', 'Data-Driven Decision Making', 'Go-To-Market'],
    tools: ['Azure', 'PowerBI', 'Figma', 'Azure DevOps'],
    helpWith: ['Product Management (PM) interviews', 'Transitioning from Engineering to PM', 'Resume reviews for APM roles'],
    offers: [{ company: 'Microsoft', role: 'Principal Product Manager', category: 'Tier-1 Tech', year: '2018', logo: 'microsoft' }],
    blogs: [
      {
        id: 'pm-interview-playbook',
        title: 'The Associate Product Manager (APM) Playbook for Engineering Students',
        date: 'June 2024',
        readTime: '6 min read',
        tags: ['Product Management', 'Microsoft', 'APM'],
        summary: 'How to transition from pure coding to product leadership, user empathy, and business execution.',
        content: 'Product management is not about having all the answers—it is about asking the right questions and aligning cross-functional squads towards user value...',
        keyTakeaways: ['Learn product sense frameworks.', 'Connect technical feasibility with customer empathy.']
      }
    ],
    posts: [
      {
        id: 'mp1',
        date: '5 days ago',
        content: '✨ Great tech products are born at the intersection of deep customer empathy, business viability, and engineering excellence. Happy to connect with Amrita students passionate about product design!',
        likes: 95,
        comments: 21,
        tag: 'Product Management'
      }
    ],
    mentorshipSessions: [
      {
        id: 'mm1',
        title: 'Product Management (PM) Roadmap & Mock Case',
        duration: '45 mins',
        description: 'Product design cases, metrics evaluation, and APM interview preparation.',
        topics: ['PM Interviews', 'Product Design', 'Career Transition']
      }
    ]
  },
  {
    slug: 'rohit',
    name: 'Rohit Prakash',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=280&q=80',
    role: 'Senior Solutions Architect',
    roleColor: 'text-amber-500 dark:text-amber-400',
    companies: ['Amazon AWS'],
    companyDisplay: 'Amazon AWS',
    location: 'Amazon AWS, Seattle, USA',
    campus: 'Bengaluru Campus',
    department: 'Information Technology',
    batch: 'Class of 2017 • IT',
    graduationYear: '2017',
    ringClass: 'ring-amber-500/90 hover:ring-amber-400',
    btnClass: 'bg-amber-50/90 text-amber-700 hover:bg-amber-100 border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    logos: ['aws'],
    headline: 'Senior Solutions Architect @ Amazon AWS | Cloud Modernization & Serverless Platforms',
    bio: 'Architecting resilient enterprise cloud platforms and serverless ecosystems on AWS. Passionate about cloud certifications, hackathons, and cloud native architectures.',
    verified: true,
    type: 'alumni',
    skills: ['AWS Solutions Architecture', 'Serverless (Lambda, EventBridge)', 'Cloud Security', 'DevOps & CI/CD', 'Cost Optimization'],
    tools: ['Terraform', 'AWS CDK', 'Docker', 'Kubernetes'],
    helpWith: ['AWS Certifications', 'Cloud Solutions Architect interviews', 'Cloud migration architectures'],
    offers: [{ company: 'Amazon AWS', role: 'Solutions Architect', category: 'Tier-1 Tech', year: '2017', logo: 'aws' }],
    blogs: [
      {
        id: 'aws-serverless-mastery',
        title: 'Building Resilient Serverless Architectures on AWS: Patterns and Pitfalls',
        date: 'July 2024',
        readTime: '7 min read',
        tags: ['AWS', 'Serverless', 'Cloud Architecture'],
        summary: 'Designing event-driven architectures with AWS Lambda, EventBridge, and DynamoDB with zero downtime.',
        content: 'Serverless allows teams to innovate rapidly, but requires disciplined error handling, dead-letter queues, and idempotency guarantees...',
        keyTakeaways: ['Use event-driven patterns for decoupled scaling.', 'Design idempotent Lambda handlers.']
      }
    ],
    posts: [
      {
        id: 'rp_aws_1',
        date: '2 weeks ago',
        content: '☁️ Cloud certifications give you structured breadth, but building real deployed projects gives you undeniable depth. Combine both to supercharge your resume!',
        likes: 83,
        comments: 16,
        tag: 'Cloud Computing'
      }
    ],
    mentorshipSessions: [
      {
        id: 'rm_aws_1',
        title: 'AWS Cloud Architecture & Certification Roadmap',
        duration: '40 mins',
        description: 'Guidance on AWS Solutions Architect certifications, cloud project ideas, and career paths.',
        topics: ['AWS Certifications', 'Cloud Design', 'Enterprise Architecture']
      }
    ]
  },
  {
    slug: 'karan',
    name: 'Karan Mahesh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80',
    role: 'AI Research Engineer',
    roleColor: 'text-emerald-500 dark:text-emerald-400',
    companies: ['NVIDIA'],
    companyDisplay: 'NVIDIA',
    location: 'NVIDIA, Santa Clara, USA',
    campus: 'Amritapuri Campus',
    department: 'Computer Science & Engineering',
    batch: 'Class of 2020 • CSE',
    graduationYear: '2020',
    ringClass: 'ring-emerald-500/90 hover:ring-emerald-400',
    btnClass: 'bg-emerald-50/90 text-emerald-700 hover:bg-emerald-100 border-emerald-300/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    logos: ['nvidia'],
    headline: 'AI Research Engineer @ NVIDIA | GPU Acceleration & LLM Inference Engines',
    bio: 'Researcher optimizing Large Language Model (LLM) inference, CUDA kernels, and distributed GPU computing at NVIDIA.',
    verified: true,
    type: 'alumni',
    skills: ['CUDA C++', 'PyTorch & TensorRT', 'LLM Inference Optimization', 'High Performance Computing (HPC)', 'Computer Vision'],
    tools: ['NVIDIA TensorRT', 'CUDA Toolkit', 'PyTorch', 'C++20'],
    helpWith: ['AI Research Fellowships', 'CUDA & GPU Computing interviews', 'Publishing top-tier ML papers (NeurIPS, CVPR)'],
    offers: [{ company: 'NVIDIA', role: 'AI Research Engineer', category: 'Tier-1 Tech', year: '2020', logo: 'nvidia' }],
    blogs: [
      {
        id: 'cuda-llm-optimization',
        title: 'Demystifying CUDA & FlashAttention: Accelerating LLM Inference on Modern GPUs',
        date: 'April 2024',
        readTime: '9 min read',
        tags: ['NVIDIA', 'CUDA', 'LLMs', 'Deep Learning'],
        summary: 'How memory bandwidth bottlenecks limit transformer execution and how kernel fusion delivers 4x speedups.',
        content: 'GPU acceleration is fundamentally about memory bandwidth hierarchy: Registers, Shared Memory, and HBM...',
        keyTakeaways: ['Optimize memory access patterns before compute.', 'Understand kernel fusion and quantization.']
      }
    ],
    posts: [
      {
        id: 'kp_nv_1',
        date: '3 weeks ago',
        content: '🚀 The AI revolution runs on efficient hardware-software co-design. If you want to dive into deep learning, learn CUDA and understand how tensors actually live on GPU memory.',
        likes: 120,
        comments: 34,
        tag: 'AI Hardware'
      }
    ],
    mentorshipSessions: [
      {
        id: 'km_nv_1',
        title: 'AI Research & GPU Acceleration Mentorship',
        duration: '45 mins',
        description: 'Roadmap for AI research, LLM optimization, and breaking into NVIDIA & top AI labs.',
        topics: ['AI Research', 'CUDA & PyTorch', 'Paper Publishing']
      }
    ]
  },
  {
    slug: 'ananya',
    name: 'Ananya Subramani',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=280&q=80',
    role: 'Senior Security Researcher',
    roleColor: 'text-rose-500 dark:text-rose-400',
    companies: ['Cisco Talos'],
    companyDisplay: 'Cisco Talos',
    location: 'Cisco Talos, San Jose, USA',
    campus: 'Amritapuri Campus',
    department: 'Cybersecurity Systems & Networks',
    batch: 'Class of 2019 • Cybersecurity',
    graduationYear: '2019',
    ringClass: 'ring-rose-500/90 hover:ring-rose-400',
    btnClass: 'bg-rose-50/90 text-rose-700 hover:bg-rose-100 border-rose-300/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    logos: ['cisco'],
    headline: 'Senior Security Researcher @ Cisco Talos | Threat Intelligence & Vulnerability Discovery',
    bio: 'Former team bi0s lead, now analyzing zero-day vulnerabilities and global threat actor infrastructure at Cisco Talos.',
    verified: true,
    type: 'alumni',
    skills: ['Binary Exploitation', 'Reverse Engineering', 'Threat Intelligence', 'Kernel Security', 'Cryptography'],
    tools: ['Ghidra', 'IDA Pro', 'Wireshark', 'Python Security Tools'],
    helpWith: ['Cybersecurity & CTF mentorship', 'Cisco Talos & Security Research careers', 'Bug bounty guidance'],
    offers: [{ company: 'Cisco Talos', role: 'Security Researcher', category: 'Tier-1 Tech', year: '2019', logo: 'cisco' }],
    blogs: [
      {
        id: 'reverse-engineering-threats',
        title: 'Hunting Zero-Days: A Reverse Engineer’s Field Guide to Advanced Threat Analysis',
        date: 'May 2024',
        readTime: '7 min read',
        tags: ['Cybersecurity', 'Reverse Engineering', 'Cisco Talos'],
        summary: 'Deconstructing malware samples, analyzing shellcode, and writing robust detection signatures.',
        content: 'Modern threat actors continuously evolve obfuscation techniques. Unpacking binaries requires meticulous static and dynamic analysis...',
        keyTakeaways: ['Master assembly and low-level memory layout.', 'Analyze control-flow flattening methodically.']
      }
    ],
    posts: [
      {
        id: 'ap_cisco_1',
        date: '1 week ago',
        content: '🛡️ Proud bi0s alumna! To all aspiring cybersecurity students at Amrita: CTFs build world-class instincts. Keep practicing and never stop breaking systems to make them stronger!',
        likes: 104,
        comments: 26,
        tag: 'Cybersecurity'
      }
    ],
    mentorshipSessions: [
      {
        id: 'am_cisco_1',
        title: 'Cybersecurity & Offensive Security Mentorship',
        duration: '45 mins',
        description: 'Roadmap for CTF preparation, reverse engineering, and offensive security research careers.',
        topics: ['CTF Strategies', 'Reverse Engineering', 'Security Careers']
      }
    ]
  }
];

export const ALL_PROFILES_BY_SLUG: Record<string, SeniorProfile> = [
  ...PLACED_SENIORS,
  ...PLACED_ALUMNI_DATA,
].reduce((acc, profile) => {
  acc[profile.slug.toLowerCase()] = profile;
  return acc;
}, {} as Record<string, SeniorProfile>);
