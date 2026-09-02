import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Award, BarChart3, Bell, Bookmark, BookOpen, BriefcaseBusiness,
  Building2, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Compass, Copy, Flame, Globe, GraduationCap, Heart, HeartHandshake, House, Image, Layers,
  Lightbulb, Link2, LoaderCircle, LogIn, LogOut, MapPin, Menu, MessageSquare, Moon,
  MoreHorizontal, Network, Pencil, Quote, Rocket, Search, Send, Settings2, Share2, ShieldCheck, Sparkles,
  Star, Sun, Trash2, Trophy, UserCheck, UserPlus, UserRoundPlus, Users, Users2, UserX, X, Zap,
} from 'lucide-react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminSummaryQueryKey, getListCollaborationsQueryKey, getListMentorshipRequestsQueryKey,
  getListNotificationsQueryKey, getListOpportunitiesQueryKey,
  getListUsersQueryKey, getListEventsQueryKey,
  getGetCurrentUserQueryKey, setAuthTokenGetter,
  useCreateCollaboration, useCreateMentorshipRequest,
  useGetAdminSummary, useGetCurrentUser, useGetDashboardSummary, useGetUser,
  useListCollaborations, useListEvents, useListMentorshipRequests,
  useListNotifications, useListOpportunities, useListUsers, useLogin,
  useMarkNotificationRead, useRegister, useRegisterForEvent, useSaveOpportunity,
  useUnregisterFromEvent, useUnsaveOpportunity, useUpdateMentorshipRequestStatus,
  useUpdateMyProfile,
} from '@workspace/api-client-react';
import type {
  Collaboration, Event, MentorshipRequest, Notification, Opportunity, PublicUser, User,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Link, useLocation, useParams, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
setAuthTokenGetter(() => typeof localStorage === 'undefined' ? null : localStorage.getItem('amrita_token'));
function setAuthSession(token: string) {
  localStorage.setItem('amrita_token', token);
}
function clearAuthSession() {
  localStorage.removeItem('amrita_token');
  queryClient.clear();
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('amrita_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('amrita_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      data-testid="button-theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className={cx(
        'inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px] text-accent" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
const NAV: Array<{ href: string; label: string; icon: typeof House; roles?: readonly string[] }> = [
  { href: '/dashboard', label: 'Overview', icon: House },
  { href: '/feed', label: 'Community Feed', icon: Sparkles },
  { href: '/connections', label: 'My Network', icon: Users2 },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/people', label: 'People', icon: Users },
  { href: '/mentorship', label: 'Mentorship', icon: HeartHandshake },
  { href: '/collaborations', label: 'Collaborate', icon: Network },
  { href: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/admin', label: 'Admin console', icon: ShieldCheck, roles: ['admin'] },
];
const roleLabels: Record<string, string> = { student: 'Student', alumni: 'Alumni', faculty: 'Faculty', researcher: 'Researcher', admin: 'Staff' };
const campuses = ['Amaravati', 'Bengaluru', 'Chennai', 'Coimbatore', 'Kochi', 'Mysuru'];
const departments = ['Computer Science & Engineering', 'Electronics & Communication', 'Biotechnology', 'Management', 'Medicine', 'Research'];
const dashboardCopy: Record<string, { eyebrow: string; title: string; detail: string; action: string; actionHref: string }> = {
  student: { eyebrow: 'Student workspace', title: 'Your campus, in motion.', detail: 'A quick read on the people and possibilities worth your attention.', action: 'Explore people', actionHref: '/people' },
  alumni: { eyebrow: 'Alumni workspace', title: 'Keep the next chapter connected.', detail: 'Reconnect with your university and make your experience useful to the people coming after you.', action: 'Meet the community', actionHref: '/people' },
  faculty: { eyebrow: 'Faculty workspace', title: 'Turn expertise into momentum.', detail: 'Find collaborators, guide promising people, and keep the work around your campus visible.', action: 'Explore collaborators', actionHref: '/collaborations' },
  researcher: { eyebrow: 'Research workspace', title: 'Move a good question forward.', detail: 'Find people, projects, and opportunities that can make research across Amrita more connected.', action: 'Find collaborators', actionHref: '/collaborations' },
  admin: { eyebrow: 'Platform workspace', title: 'Keep the commons healthy.', detail: 'A clear view of the people and activity shaping Amrita Connect.', action: 'Open admin console', actionHref: '/admin' },
};

function initials(name = 'Amrita member') {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}
function formatDate(value?: string | null, withYear = false) {
  if (!value) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).format(new Date(value));
}
function relative(value?: string) {
  if (!value) return 'Recently';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
}
function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(' '); }

function Avatar({ user, size = 'md' }: { user?: Partial<User> | null; size?: 'sm' | 'md' | 'lg' }) {
  return user?.avatarUrl ? <img data-testid={`img-avatar-${user.id ?? 'current'}`} src={user.avatarUrl} alt={user.fullName ?? 'Member'} className={cx('rounded-full object-cover ring-2 ring-background', size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-20 w-20' : 'h-11 w-11')} /> :
    <div data-testid={`avatar-fallback-${user?.id ?? 'current'}`} className={cx('rounded-full bg-secondary text-primary flex items-center justify-center font-bold tracking-tight ring-2 ring-background', size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-20 w-20 text-xl' : 'h-11 w-11 text-sm')}>{initials(user?.fullName)}</div>;
}
function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' }) {
  return <button {...props} className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50', variant === 'primary' && 'bg-primary text-primary-foreground hover:opacity-90', variant === 'quiet' && 'text-muted-foreground hover:bg-muted hover:text-foreground', variant === 'outline' && 'border border-border bg-card text-foreground hover:bg-muted', variant === 'danger' && 'border border-destructive/30 text-destructive hover:bg-destructive/10', className)}>{children}</button>;
}
function Tag({ children, warm = false }: { children: string; warm?: boolean }) { return <span className={cx('rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide', warm ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground')}>{children}</span>; }
function PageTitle({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise"><div><div className="mono mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-muted-foreground">{eyebrow}</div><h1 data-testid="text-page-title" className="text-3xl font-bold tracking-[-.04em] text-foreground sm:text-4xl">{title}</h1>{detail && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>}</div>{action}</div>;
}
function LoadingState({ rows = 3 }: { rows?: number }) { return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: rows }).map((_, i) => <div className="skeleton h-24 rounded-xl" key={i} />)}</div>; }
function ErrorState({ onRetry }: { onRetry?: () => void }) { return <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="error-state"><X className="mx-auto mb-3 h-5 w-5 text-destructive" /><p className="font-semibold text-primary">We couldn't load this view.</p><p className="mt-1 text-sm text-muted-foreground">The network may be taking a moment. Try again.</p>{onRetry && <Button className="mt-4" onClick={onRetry}>Retry</Button>}</div>; }
function EmptyState({ icon: Icon = Compass, title, detail, action }: { icon?: typeof Compass; title: string; detail: string; action?: React.ReactNode }) { return <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center" data-testid="empty-state"><Icon className="mx-auto mb-4 h-7 w-7 text-accent-foreground" /><p className="font-semibold text-primary">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>; }

function Brand({ light = false, small = false }: { light?: boolean; small?: boolean }) {
  return (
    <Link
      data-testid="link-brand"
      href="/"
      className={cx('flex items-center gap-2.5', light ? 'text-primary-foreground' : 'text-foreground')}
    >
      <span
        className={cx(
          'grid place-items-center rounded-xl bg-accent text-primary font-bold shadow-sm',
          small ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
        )}
      >
        A
      </span>
      <span className={cx('font-bold tracking-[-.04em]', small ? 'text-sm' : 'text-base')}>
        Amrita <span className="font-normal opacity-60">Connect</span>
      </span>
    </Link>
  );
}

const PLACED_ALUMNI = [
  {
    name: 'Karthik Ramanathan',
    role: 'Software Engineer III',
    company: 'Google',
    companyBadge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    campus: 'Amritapuri',
    department: 'Computer Science',
    batch: 'Class of 2023',
    quote: 'Found my ICPC teammates and senior alumni mentors on the campus network who guided me through distributed systems prep.',
    skills: ['Distributed Systems', 'C++', 'Go', 'Kubernetes'],
    location: 'Zurich, Switzerland',
  },
  {
    name: 'Sneha Iyer',
    role: 'AI Research Scientist',
    company: 'Microsoft Research',
    companyBadge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    campus: 'Bengaluru',
    department: 'AI & Data Science',
    batch: 'Class of 2022',
    quote: 'Cross-campus collaboration with Kochi biotech lab helped publish our IEEE paper which opened doors directly to Microsoft AI lab.',
    skills: ['PyTorch', 'LLMs', 'Computer Vision', 'NLP'],
    location: 'Bengaluru, India',
  },
  {
    name: 'Aditya S. Nair',
    role: 'Cloud Infrastructure Architect',
    company: 'Amazon AWS',
    companyBadge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    campus: 'Coimbatore',
    department: 'Information Technology',
    batch: 'Class of 2021',
    quote: 'The alumni referral network bridged the gap to global opportunities directly. Amrita Connect makes that organic and effortless.',
    skills: ['AWS Serverless', 'Terraform', 'System Design', 'Kafka'],
    location: 'Seattle, USA',
  },
  {
    name: 'Pooja Menon',
    role: 'Autonomous Systems Engineer',
    company: 'NVIDIA',
    companyBadge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    campus: 'Coimbatore',
    department: 'Electronics & Communication',
    batch: 'Class of 2023',
    quote: 'Worked on robotics research with faculty across Kochi and Bengaluru before campus placements. Cross-campus visibility was a game-changer.',
    skills: ['CUDA', 'ROS 2', 'Embedded Linux', 'Edge AI'],
    location: 'Santa Clara, USA',
  },
  {
    name: 'Vishnu Vardhan',
    role: 'Lead Threat Researcher',
    company: 'Cisco Talos',
    companyBadge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    campus: 'Amritapuri',
    department: 'Cyber Security (bi0s)',
    batch: 'Class of 2022',
    quote: "Amrita's CTF community gave us hands-on security foundations recognized worldwide. Now I mentor the next batch through Amrita Connect.",
    skills: ['Reverse Eng', 'Malware Analysis', 'Kernel Security'],
    location: 'Bengaluru, India',
  },
  {
    name: 'Divya Pillai',
    role: 'Product Engineer',
    company: 'Adobe',
    companyBadge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    campus: 'Chennai',
    department: 'Computer Science',
    batch: 'Class of 2024',
    quote: 'Connected with senior alumni who reviewed my UI architecture and took mock system design interviews before my on-campus placement drive.',
    skills: ['React', 'WebAssembly', 'Cloud Canvas', 'TypeScript'],
    location: 'Noida, India',
  },
];

const RENOWNED_FACULTY = [
  {
    name: 'Dr. Maneesha V. Ramesh',
    role: 'Dean of International Programs & Director',
    department: 'Center for Wireless Networks & Applications (WNA)',
    campus: 'Amritapuri',
    highlight: 'UN Sasakawa Laureate. Pioneer of the world’s first wireless sensor network-based Landslide Early Warning System deployed in Munnar & the Himalayas.',
    metrics: [
      { label: 'Publications', value: '200+' },
      { label: 'Citations', value: '6,500+' },
      { label: 'Global Patents', value: '14' },
    ],
    tags: ['IoT Systems', 'Disaster Management', 'AI in Geotech', 'Sensors'],
  },
  {
    name: 'Dr. Shantanu Bhowmik',
    role: 'Head of Research & Professor',
    department: 'Aerospace Engineering & Advanced Materials',
    campus: 'Coimbatore',
    highlight: 'Collaborator with DRDO, Indian Navy & ISRO on state-of-the-art hypervelocity thermal barrier coatings and blast-resistant armor for defense forces.',
    metrics: [
      { label: 'DRDO Grants', value: '₹12 Cr+' },
      { label: 'Patents Filed', value: '18' },
      { label: 'Partners', value: 'Airbus · ISRO' },
    ],
    tags: ['Advanced Composites', 'Aerospace Tech', 'Nanomaterials', 'Armor'],
  },
  {
    name: 'Dr. Anand Shenoi',
    role: 'Chairperson & Cyber Labs Director',
    department: 'Cybersecurity Systems & Networks',
    campus: 'Amritapuri',
    highlight: "Chief Mentor of Team bi0s (India's #1 CTF team) and InCTF. Lead investigator for national cybersecurity defense and smart grid security.",
    metrics: [
      { label: 'CTF Rank', value: '#1 in India' },
      { label: 'Security Advisories', value: '80+' },
      { label: 'Mentored', value: '1,200+' },
    ],
    tags: ['Offensive Security', 'Quantum Cryptography', 'Smart Grid Security'],
  },
  {
    name: 'Dr. Deepthi K. S.',
    role: 'Professor & Lead Investigator',
    department: 'Computational Biology & Healthcare AI',
    campus: 'Kochi Health Sciences',
    highlight: 'Leading precision oncology diagnostics and neural network genomics in joint research initiatives with Stanford Bio-X and AIMS Kochi.',
    metrics: [
      { label: 'Clinical Trials', value: '8 Live' },
      { label: 'Hospital Reach', value: '150k+ Patients' },
      { label: 'Journal Papers', value: '45+' },
    ],
    tags: ['Healthcare AI', 'Genomics', 'Bioinformatics', 'Oncology'],
  },
];

const AMRITA_CAMPUSES = [
  { id: 'cbe', name: 'Coimbatore', title: 'Coimbatore (Ettimadai)', focus: 'Aerospace, Robotics, Cyber Physical Systems & Core Engineering', count: '10,000+ Members', activeProjects: 142, icon: Rocket },
  { id: 'amp', name: 'Amritapuri', title: 'Amritapuri (Kollam)', focus: 'Cybersecurity (bi0s), Wireless IoT, Nanotech & Computing', count: '8,500+ Members', activeProjects: 118, icon: ShieldCheck },
  { id: 'blr', name: 'Bengaluru', title: 'Bengaluru Campus', focus: 'Artificial Intelligence, Data Science & Tech Startups', count: '6,000+ Members', activeProjects: 94, icon: Zap },
  { id: 'koc', name: 'Kochi', title: 'Kochi Health Sciences', focus: 'Precision Medicine, Biotech Genomics, Medical AI & Nanomedicine', count: '5,500+ Members', activeProjects: 86, icon: HeartHandshake },
  { id: 'chn', name: 'Chennai', title: 'Chennai Campus', focus: 'Advanced Computing, Emerging Tech & Cyber Physical Systems', count: '3,500+ Members', activeProjects: 45, icon: Layers },
  { id: 'amr', name: 'Amaravati', title: 'Amaravati Campus', focus: 'Interdisciplinary Engineering, Sustainable Tech & AI', count: '2,000+ Members', activeProjects: 32, icon: Lightbulb },
  { id: 'mys', name: 'Mysuru & NCR', title: 'Mysuru & NCR Campuses', focus: 'Media, Pure Sciences, Commerce & Management Studies', count: '2,500+ Members', activeProjects: 28, icon: BookOpen },
];

/* 1. Alumni Spotlight with Editorial Styling & Company Ticker */
function AlumniSpotlightSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % PLACED_ALUMNI.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused]);

  const current = PLACED_ALUMNI[active];

  return (
    <section className="border-t border-border bg-gradient-to-b from-background via-secondary/20 to-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Brand Logos Bar */}
        <div className="mb-16 text-center">
          <p className="mono text-[11px] font-bold uppercase tracking-[.24em] text-muted-foreground">
            Alumni Leading Breakthroughs Globally At
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-bold text-muted-foreground/70">
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-blue-500" /> Google</span>
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-sky-500" /> Microsoft</span>
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-amber-500" /> Amazon AWS</span>
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-emerald-500" /> NVIDIA</span>
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-cyan-500" /> Cisco Talos</span>
            <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Building2 className="h-4 w-4 text-rose-500" /> Adobe</span>
          </div>
        </div>

        {/* Editorial Story Layout */}
        <div
          className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-8 sm:p-12 lg:p-16 shadow-xl backdrop-blur-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', current.companyBadge)}>
                  <Building2 className="h-3.5 w-3.5" /> {current.company}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {current.batch}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  <Check className="h-3 w-3" /> Verified Alumnus
                </span>
              </div>

              <blockquote className="relative">
                <Quote className="h-10 w-10 text-accent/20 mb-2" />
                <p className="text-xl font-medium leading-relaxed tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                  “{current.quote}”
                </p>
              </blockquote>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/20 text-accent font-bold text-base shadow-sm">
                  {initials(current.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{current.name}</h3>
                  <p className="text-xs text-accent font-medium">{current.role} · <span className="text-muted-foreground">{current.location}</span></p>
                  <p className="text-xs text-muted-foreground">{current.department} · Amrita {current.campus}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Core Competencies:</span>
                {current.skills.map((skill) => (
                  <Tag key={skill} warm>{skill}</Tag>
                ))}
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous story"
                  onClick={() => setActive((prev) => (prev === 0 ? PLACED_ALUMNI.length - 1 : prev - 1))}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-secondary text-foreground hover:bg-muted active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next story"
                  onClick={() => setActive((prev) => (prev + 1) % PLACED_ALUMNI.length)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-secondary text-foreground hover:bg-muted active:scale-95 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex lg:flex-col items-center gap-1.5">
                {PLACED_ALUMNI.map((alum, idx) => (
                  <button
                    key={alum.name}
                    type="button"
                    aria-label={`Jump to ${alum.name}`}
                    onClick={() => setActive(idx)}
                    className={cx(
                      'rounded-full transition-all duration-300',
                      active === idx ? 'h-2 w-6 lg:w-2 lg:h-6 bg-accent' : 'h-2 w-2 bg-muted hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 2. Interactive University Live Mesh & Cross-Campus Radar */
function UniversityLiveMesh() {
  const [selectedCampus, setSelectedCampus] = useState(AMRITA_CAMPUSES[0]);

  const liveFeeds = [
    { time: 'Just now', tag: 'Mentorship', text: 'Karthik Ramanathan (Google) confirmed 1-on-1 prep slot for Distributed Systems.', campus: 'Amritapuri' },
    { time: '12m ago', tag: 'Research', text: 'Kochi Medical AI Lab opened 2 research assistantships in precision oncology.', campus: 'Kochi' },
    { time: '28m ago', tag: 'Collaboration', text: 'Coimbatore & Bengaluru students formed a Smart India Hackathon finalist team.', campus: 'Coimbatore' },
    { time: '1h ago', tag: 'Opportunity', text: 'Dr. Shantanu Bhowmik announced DRDO sponsored project vacancies.', campus: 'Coimbatore' },
    { time: '2h ago', tag: 'Alumni', text: 'Sneha Iyer (Microsoft Research) reviewed 4 biomedical NLP papers.', campus: 'Bengaluru' },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="mono inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-accent">
            <Globe className="h-3.5 w-3.5" /> University Live Mesh
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Real-Time Collaboration Across 7 Campuses.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Explore live research initiatives, active members, and inter-campus momentum happening right now.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          {/* Interactive Campus Selector */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Select an Amrita Center of Excellence:
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {AMRITA_CAMPUSES.map((camp) => {
                const Icon = camp.icon;
                const isSelected = selectedCampus.id === camp.id;
                return (
                  <button
                    key={camp.id}
                    type="button"
                    onClick={() => setSelectedCampus(camp)}
                    className={cx(
                      'flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent/30'
                        : 'border-border bg-card hover:bg-secondary/60'
                    )}
                  >
                    <div className={cx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', isSelected ? 'bg-accent text-primary font-bold' : 'bg-secondary text-muted-foreground')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-foreground">{camp.name}</span>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {camp.focus}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Campus Insight Bar */}
            <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{selectedCampus.title}</h4>
                  <p className="text-xs text-muted-foreground">{selectedCampus.count} · {selectedCampus.activeProjects} Active Projects</p>
                </div>
                <Link
                  href="/people"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all"
                >
                  Explore {selectedCampus.name} Directory <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Live Activity Terminal Stream */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="mono text-xs font-bold uppercase tracking-wider text-foreground">Live Activity Stream</span>
              </div>
              <span className="mono text-[10px] text-muted-foreground">Updated Live</span>
            </div>

            <div className="mt-5 space-y-4">
              {liveFeeds.map((feed, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <span className="mono shrink-0 font-semibold text-muted-foreground">{feed.time}</span>
                  <div className="min-w-0 flex-1">
                    <span className="mr-1.5 font-bold text-accent">[{feed.tag}]</span>
                    <span className="text-foreground/90">{feed.text}</span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground/70">({feed.campus})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-3.5 text-center">
              <p className="text-xs text-muted-foreground">
                🔒 All connections require active Amrita email or alumni verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3. Interactive Split-Screen Capability Explorer (Apple / Stripe style) */
function InteractiveFeatureExplorer() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 'directory',
      title: '01. Multi-Campus Directory',
      summary: 'Search by exact skills, publications, batch year, and campus centers.',
      detail: 'Find senior engineers at top firms, prospective co-founders, or lab heads in seconds without cold emailing strangers on open networks.',
      preview: {
        badge: 'Direct Search Preview',
        searchQuery: 'PyTorch, Biomedical Imaging, Class of 2023',
        results: [
          { name: 'Dr. Deepthi K. S.', role: 'AI in Healthcare Lab Lead', campus: 'Kochi', tag: 'Faculty' },
          { name: 'Meera Nair', role: 'Biotech & Robotics Researcher', campus: 'Kochi', tag: 'Researcher' },
          { name: 'Sneha Iyer', role: 'AI Research Scientist @ Microsoft', campus: 'Bengaluru', tag: 'Alumni' },
        ],
      },
    },
    {
      id: 'mentorship',
      title: '02. Structured 1-on-1 Guidance',
      summary: 'Request direct office hours and mock interviews with verified alumni.',
      detail: 'Set clear expectations, submit your project notes, and schedule focused sessions on career pivots, coding interviews, and grant proposals.',
      preview: {
        badge: 'Active Mentorship Flow',
        searchQuery: 'Topic: Distributed Systems & LLD Preparation',
        results: [
          { name: 'Karthik Ramanathan', role: 'SWE III @ Google', campus: 'Zurich (Amritapuri)', tag: 'Confirmed' },
          { name: 'Vishnu Vardhan', role: 'Threat Lead @ Cisco Talos', campus: 'Bengaluru (bi0s)', tag: 'Open Slot' },
        ],
      },
    },
    {
      id: 'collabs',
      title: '03. Cross-Discipline Project Match',
      summary: 'Bring coders, hardware engineers, and domain specialists together.',
      detail: 'Tackle Smart India Hackathons, co-author IEEE papers, or build deep-tech startups by assembling multi-campus interdisciplinary teams.',
      preview: {
        badge: 'Live Projects Board',
        searchQuery: 'Category: Defense AI & Autonomous Swarms',
        results: [
          { name: 'Autonomous Drone Swarm', role: 'Need: ROS 2 & Computer Vision', campus: 'Coimbatore', tag: '3/4 Filled' },
          { name: 'Genome AI Classifier', role: 'Need: Python & Biostatistics', campus: 'Kochi', tag: '2/3 Filled' },
        ],
      },
    },
    {
      id: 'opportunities',
      title: '04. Curated Opportunities & Grants',
      summary: 'Exclusive lab positions, research grants, and hiring calls.',
      detail: 'Discover verified academic fellowships, university startup seed funds, and campus referrals not posted on public job boards.',
      preview: {
        badge: 'Exclusive Noticeboard',
        searchQuery: 'Filtered: DRDO & ISRO Sponsored Fellowships',
        results: [
          { name: 'Hypervelocity Coatings Fellow', role: 'DRDO Composite Lab · ₹35k/mo', campus: 'Coimbatore', tag: 'Apply Now' },
          { name: 'UN Sasakawa Sensor Grant', role: 'IoT Landslide Lab · Research Call', campus: 'Amritapuri', tag: 'Open' },
        ],
      },
    },
  ];

  const current = features[activeTab];

  return (
    <section className="border-t border-border bg-secondary/15 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="mono inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Platform Capabilities
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A Purpose-Built Engine for Academic Excellence.
          </h2>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          {/* Left Feature Tabs */}
          <div className="space-y-3">
            {features.map((feat, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={cx(
                    'w-full rounded-2xl border p-5 text-left transition-all',
                    isActive
                      ? 'border-accent bg-card shadow-md ring-1 ring-accent/30'
                      : 'border-transparent bg-transparent hover:bg-card/60'
                  )}
                >
                  <h3 className={cx('text-lg font-bold', isActive ? 'text-accent' : 'text-foreground')}>
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-sm text-foreground/90 font-medium">
                    {feat.summary}
                  </p>
                  {isActive && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground animate-rise">
                      {feat.detail}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Live Interactive Preview Canvas */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="mono text-xs font-bold uppercase tracking-wider text-accent">
                {current.preview.badge}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                Amrita Connect Engine
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-input bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-accent" />
              <span>{current.preview.searchQuery}</span>
            </div>

            <div className="mt-5 space-y-3">
              {current.preview.results.map((res, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-3.5 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent font-bold text-xs">
                      {initials(res.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{res.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{res.role} · Amrita {res.campus}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent">
                    {res.tag}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm"
              >
                Access this feature <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 4. Structured 4-Step Trajectory Roadmap */
function TrajectoryRoadmap() {
  const steps = [
    { num: '01', title: 'Verify & Claim Profile', desc: 'Sign in with your campus credentials to establish trusted academic standing.' },
    { num: '02', title: 'Discover 7 Campuses', desc: 'Filter through students, researchers, and alumni by domain, tools, and batch.' },
    { num: '03', title: 'Request 1-on-1 Guidance', desc: 'Schedule mentorship sessions for coding interviews, research, and career advice.' },
    { num: '04', title: 'Co-Author & Build', desc: 'Assemble interdisciplinary teams to publish papers, win hackathons, and innovate.' },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mono text-[10px] font-bold uppercase tracking-[.22em] text-accent">
            Seamless Progression
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your Trajectory on Amrita Connect.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            From your first semester to senior alumni leadership, stay connected to the university commons.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mono text-3xl font-bold text-accent">{step.num}</div>
              <h3 className="mt-6 text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. World-Class Researchers & Faculty Spotlight */
function FacultySpotlight() {
  return (
    <section className="border-t border-border bg-secondary/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="mono inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-accent">
            <Award className="h-3.5 w-3.5" /> World-Class Research & Faculty
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Distinguished Researchers Shaping Global Impact.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Collaborate with internationally decorated scientists, UN laureates, and lab heads across Amrita campuses.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {RENOWNED_FACULTY.map((faculty) => (
            <div
              key={faculty.name}
              className="surface group relative flex flex-col justify-between rounded-2xl border border-border p-6 sm:p-7 transition-all hover:border-accent/40"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="mono inline-block text-[10px] font-bold uppercase tracking-wider text-accent">
                      Amrita {faculty.campus}
                    </span>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground group-hover:text-accent">
                      {faculty.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">{faculty.role}</p>
                    <p className="text-[11px] text-muted-foreground/80">{faculty.department}</p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent font-bold">
                    {initials(faculty.name)}
                  </div>
                </div>

                <p className="mt-4 text-xs leading-6 text-foreground/85">
                  {faculty.highlight}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-border bg-secondary/50 p-3 text-center">
                  {faculty.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="text-sm font-bold text-foreground">{metric.value}</div>
                      <div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-1">
                  {faculty.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                <Link
                  href="/collaborations"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  Explore research <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 6. Interactive Role Persona Switcher */
function RolePreviewInteractive() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'alumni' | 'faculty' | 'researcher'>('student');

  const roleDetails = {
    student: {
      title: 'Accelerate your learning, build a portfolio, find mentors.',
      bullets: [
        'Connect with verified alumni at Google, Microsoft, Amazon for technical reviews.',
        'Find teammates from other campuses for Smart India hackathons and inter-college contests.',
        'Discover funded research openings and lab assistantships before they go public.',
      ],
      cta: 'Join as a Student',
      href: '/register',
    },
    alumni: {
      title: 'Stay connected to your alma mater, give back, find top talent.',
      bullets: [
        'Offer 1-on-1 mentorship sessions on your own schedule to high-potential students.',
        'Post job openings, internships, and startup co-founder calls directly to verified members.',
        'Network with fellow alumni across global chapters in USA, Europe, and Asia.',
      ],
      cta: 'Join as an Alumnus',
      href: '/register',
    },
    faculty: {
      title: 'Turn campus expertise into high-impact collaborative momentum.',
      bullets: [
        'Identify exceptional student researchers across all 7 campuses for grant projects.',
        'Collaborate with industry-placed alumni for guest lectures and curriculum advisory.',
        'Host inter-campus symposiums, webinars, and specialized workshops easily.',
      ],
      cta: 'Join as Faculty',
      href: '/register',
    },
    researcher: {
      title: 'Bring domain experts together to crack complex interdisciplinary problems.',
      bullets: [
        'Form joint research groups between healthcare, computing, IoT, and aerospace.',
        'Publish joint IEEE, ACM, and Nature papers with multi-campus co-investigators.',
        'Access specialized lab equipment and dataset repositories across the university system.',
      ],
      cta: 'Join as a Researcher',
      href: '/register',
    },
  };

  const activeInfo = roleDetails[selectedRole];

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mono text-[10px] font-bold uppercase tracking-[.22em] text-accent">
              Role-Tailored Workspaces
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for Every Stage of Your Amrita Journey.
            </h2>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {(['student', 'alumni', 'faculty', 'researcher'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={cx(
                  'rounded-xl px-5 py-2.5 text-xs font-bold capitalize transition-all',
                  selectedRole === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mono text-[10px] font-bold uppercase tracking-wider text-accent">
                Tailored Experience
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {activeInfo.title}
              </h3>
              <ul className="mt-6 space-y-3">
                {activeInfo.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-bold text-foreground">
                Ready to get started?
              </h4>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Create your profile in 60 seconds with your campus email or personal account.
              </p>
              <Link
                href={activeInfo.href}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
              >
                {activeInfo.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="grain min-h-[100dvh] overflow-hidden bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand light={false} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              data-testid="link-login"
              href="/login"
              className="hidden px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
            >
              Sign in
            </Link>
            <Link
              data-testid="link-register"
              href="/register"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm"
            >
              Join the network
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Spacious Modern Hero */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="relative z-10 animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> One University · 7 Campuses · Endless Momentum
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-[-.06em] text-foreground sm:text-6xl lg:text-7xl">
              Find your next<br />
              <span className="serif font-normal italic text-accent">breakthrough connection.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Amrita Connect bridges the gap between campuses, research labs, and global alumni networks. Find mentors, form project teams, and discover exclusive opportunities.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                data-testid="link-hero-register"
                href="/register"
                className="inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm"
              >
                Create your profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                data-testid="link-hero-login"
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted shadow-sm"
              >
                I already belong here
              </Link>
            </div>

            {/* Quick Hero Stat Counters */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">30,000+</div>
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Alumni Network</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">7 Campuses</div>
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Interconnected</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">500+</div>
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Active Projects</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Mock Graphic */}
          <div className="relative min-h-[440px] animate-rise delay-2">
            <div className="absolute -right-20 top-3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            
            {/* Primary badge card */}
            <div className="absolute left-6 top-6 h-[340px] w-[340px] rotate-3 rounded-3xl bg-secondary border border-border p-7 shadow-2xl sm:left-12 sm:h-[360px] sm:w-[360px]">
              <div className="flex items-center justify-between text-foreground/70">
                <span className="mono text-[10px] uppercase tracking-[.2em] font-bold">AMRITA CONNECT</span>
                <Network className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-16">
                <div className="mono text-[10px] uppercase tracking-[.18em] text-foreground/60">Cross-Campus Academic Commons</div>
                <div className="mt-3 text-3xl font-bold leading-tight tracking-[-.05em] text-foreground sm:text-4xl">
                  One campus,<br /><span className="serif font-normal italic text-accent">every opportunity.</span>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Coimbatore · Amritapuri · Bengaluru · Kochi</span>
                <span className="mono font-bold text-accent">A++</span>
              </div>
            </div>

            {/* Floating Mentorship Request Card */}
            <div className="absolute bottom-0 right-0 w-64 rotate-[-6deg] rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent font-bold text-xs">
                  KR
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Karthik Ramanathan</p>
                  <p className="text-[10px] text-muted-foreground">SWE III @ Google · Amritapuri</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-foreground/90 font-medium">
                “Accepted your mentorship request on Distributed Systems!”
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                <Check className="h-3 w-3" /> Confirmed for Friday
              </div>
            </div>

            {/* Floating Collaboration Card */}
            <div className="absolute -left-2 top-0 w-56 -rotate-6 rounded-2xl border border-border bg-card p-3.5 shadow-lg hidden sm:block">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> New Project Match
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                AI Diagnostics collaboration opened by Kochi Health Sciences lab.
              </p>
              <div className="mt-2 flex gap-1">
                <Tag>BioAI</Tag>
                <Tag>PyTorch</Tag>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Editorial Alumni Spotlight & Company Marquee (No CTC) */}
        <AlumniSpotlightSection />

        {/* Section 2: University Live Mesh & Cross-Campus Radar */}
        <UniversityLiveMesh />

        {/* Section 3: Interactive Split-Screen Capability Explorer */}
        <InteractiveFeatureExplorer />

        {/* Section 4: 4-Step Trajectory Roadmap */}
        <TrajectoryRoadmap />

        {/* Section 5: Renowned Faculty & Research Labs */}
        <FacultySpotlight />

        {/* Section 6: Interactive Role Preview */}
        <RolePreviewInteractive />

        {/* Big Call to Action Banner */}
        <section className="border-t border-border bg-gradient-to-b from-secondary/30 to-background py-16 sm:py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center sm:px-8">
            <div>
              <div className="mono text-[10px] font-bold uppercase tracking-[.22em] text-accent">
                Your place in the network
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-[-.04em] text-foreground sm:text-4xl">
                Start with one good conversation today.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Join thousands of students, researchers, faculty, and alumni across Amrita Vishwa Vidyapeetham.
              </p>
            </div>
            <Link
              data-testid="link-bottom-register"
              href="/register"
              className="inline-flex items-center gap-3 rounded-xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md active:scale-95 shrink-0"
            >
              Join Amrita Connect <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-border bg-card py-12 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Brand light={false} small />
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Amrita Connect is the university-wide platform breaking campus boundaries and empowering lifelong academic and career collaboration.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">Campuses</h5>
              <ul className="mt-3 space-y-2 text-xs">
                <li>Coimbatore (Ettimadai)</li>
                <li>Amritapuri (Kollam)</li>
                <li>Bengaluru</li>
                <li>Kochi (Health Sciences)</li>
                <li>Chennai · Amaravati · Mysuru</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">Features</h5>
              <ul className="mt-3 space-y-2 text-xs">
                <li><Link href="/login" className="hover:text-foreground">Member Directory</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Mentorship Requests</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Project Collaborations</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Career Opportunities</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">Community</h5>
              <p className="mt-3 text-xs leading-6">
                Amrita Vishwa Vidyapeetham · Accredited NAAC A++
              </p>
              <div className="mt-4 flex items-center gap-2 text-accent font-semibold">
                <Globe className="h-4 w-4" /> Global Academic Commons
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <span>© {new Date().getFullYear()} Amrita Connect. For every chapter of the Amrita story.</span>
            <span>Made with passion for the Amrita fraternity.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthLayout({ children, title, detail, mode }: { children: React.ReactNode; title: string; detail: string; mode: 'login' | 'register' }) {
  return <div className="grain grid min-h-[100dvh] bg-background lg:grid-cols-[.8fr_1.2fr]">
    <div className="hidden bg-secondary border-r border-border p-10 text-foreground lg:flex lg:flex-col lg:justify-between">
      <Brand light={false} />
      <div>
        <div className="mono mb-5 text-[10px] uppercase tracking-[.22em] text-accent">A network with roots</div>
        <p className="max-w-md text-5xl font-bold leading-[1.04] tracking-[-.06em] text-foreground">The right people are closer than you think.</p>
        <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">One trusted place to find mentors, collaborators, opportunities, and the wider Amrita community.</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" /> Amrita Connect <span className="ml-auto mono font-bold text-accent">NAAC A++</span></div>
    </div>
    <div className="flex flex-col px-5 py-6 sm:px-12 lg:px-24 lg:py-10">
      <div className="flex items-center justify-between">
        <div className="lg:hidden"><Brand /></div>
        <div className="flex items-center gap-3 ml-auto">
          <ThemeToggle />
          <Link data-testid={`link-auth-${mode === 'login' ? 'register' : 'login'}`} href={mode === 'login' ? '/register' : '/login'} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            {mode === 'login' ? 'Create account' : 'Sign in instead'} <ChevronRight className="inline h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="my-auto w-full max-w-md py-12">
        <div className="mono mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-accent">{mode === 'login' ? 'Welcome back' : 'Join the community'}</div>
        <h1 className="text-4xl font-bold tracking-[-.06em] text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
        {children}
      </div>
      <p className="text-xs text-muted-foreground">By continuing, you agree to keep Amrita Connect a trusted academic space.</p>
    </div>
  </div>;
}
function LoginPage() {
  const login = useLogin(); const [, setLocation] = useLocation(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); setError(''); login.mutate({ data: { email, password } }, { onSuccess: (data) => { setAuthSession(data.token); queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }); setLocation('/dashboard'); }, onError: () => setError('Those details did not work. Check your email and password, then try again.') }); };
  return <AuthLayout mode="login" title="Good to see you." detail="Sign in to pick up where you left off."><form onSubmit={submit} className="mt-8 space-y-5"><Field id="email" label="University or personal email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /><Field id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /><div className="flex justify-end"><button data-testid="button-forgot-password" type="button" className="text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => setError('Please contact your campus administrator to reset your password.')}>Forgot password?</button></div>{error && <p data-testid="status-auth-error" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button data-testid="button-submit-login" type="submit" className="w-full py-3.5" disabled={login.isPending}>{login.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Sign in</Button></form></AuthLayout>;
}
function RegisterPage() {
  const register = useRegister(); const [, setLocation] = useLocation(); const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' as 'student' | 'alumni' | 'faculty' | 'researcher', campus: campuses[0], department: departments[0], graduationYear: '' }); const [error, setError] = useState('');
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); setError(''); register.mutate({ data: { ...form, graduationYear: form.graduationYear ? Number(form.graduationYear) : null } }, { onSuccess: (data) => { setAuthSession(data.token); queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }); setLocation('/dashboard'); }, onError: () => setError('We could not create your account. Please review the details and try again.') }); };
  return <AuthLayout mode="register" title="Make your place." detail="Create a profile that helps the right people understand what you are building toward."><form onSubmit={submit} className="mt-8 space-y-4"><Field id="full-name" label="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required /><Field id="register-email" label="Email address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /><div className="grid gap-4 sm:grid-cols-2"><SelectField id="role" label="I am a" value={form.role} onChange={(e) => update('role', e.target.value)} options={Object.entries(roleLabels).filter(([key]) => key !== 'admin').map(([value, label]) => ({ value, label }))} /><SelectField id="campus" label="Campus" value={form.campus} onChange={(e) => update('campus', e.target.value)} options={campuses.map((value) => ({ value, label: value }))} /></div><SelectField id="department" label="Department" value={form.department} onChange={(e) => update('department', e.target.value)} options={departments.map((value) => ({ value, label: value }))} /><div className="grid gap-4 sm:grid-cols-2"><Field id="graduation-year" label="Graduation year" type="number" placeholder="Optional" value={form.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} /><Field id="register-password" label="Create password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={8} required /></div>{error && <p data-testid="status-register-error" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button data-testid="button-submit-register" type="submit" className="mt-3 w-full py-3.5" disabled={register.isPending}>{register.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Create my profile</Button></form></AuthLayout>;
}
function Field({ id, label, type = 'text', value, onChange, placeholder, required, minLength }: { id: string; label: string; type?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; placeholder?: string; required?: boolean; minLength?: number }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span><input data-testid={`input-${id}`} id={id} type={type} autoComplete={type === 'password' ? (id === 'password' ? 'current-password' : 'new-password') : type === 'email' ? 'email' : undefined} value={value} onChange={onChange} placeholder={placeholder} required={required} minLength={minLength} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/30" /></label>; }
function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; options: Array<{ value: string; label: string }> }) { return <label className="block">{label ? <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span> : null}<select data-testid={`select-${id}`} id={id} value={value} onChange={onChange} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }

function AppShell({ children, user }: { children: React.ReactNode; user?: User | null }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const unread = useListNotifications({ query: { queryKey: getListNotificationsQueryKey(), staleTime: 30000 } });
  const unreadCount = unread.data?.filter((n) => !n.read).length ?? 0;
  const visibleNav = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  const currentLabel = visibleNav.find((item) => location.startsWith(item.href))?.label ?? 'Profile';

  const handleLogout = () => {
    clearAuthSession();
    setLocation('/login');
  };

  return <div className="grain min-h-[100dvh] bg-background">
    <aside className={cx('fixed inset-y-0 left-0 z-40 w-64 bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between">
        <Brand light />
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          <button data-testid="button-close-menu" aria-label="Close navigation menu" className="text-sidebar-foreground/60 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="mt-10">
        <div className="mono mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/40">{user?.role === 'admin' ? 'Platform operations' : `${roleLabels[user?.role ?? 'student']} workspace`}</div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {visibleNav.map(({ href, label, icon: Icon }) => <Link data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setOpen(false)} href={href} key={href} aria-current={location === href ? 'page' : undefined} className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium', location === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')}><Icon className="h-[17px] w-[17px]" />{label}</Link>)}
        </nav>
      </div>
      <div className="absolute bottom-6 left-5 right-5 space-y-2">
        <Link data-testid="link-nav-profile" href="/profile" className="flex items-center gap-3 rounded-lg border border-sidebar-border p-3 hover:bg-sidebar-accent transition-colors">
          <Avatar user={user} size="sm" />
          <div className="min-w-0"><div className="truncate text-xs font-semibold">{user?.fullName ?? 'Your profile'}</div><div className="truncate text-[10px] text-sidebar-foreground/50">{user ? roleLabels[user.role] : 'Member'}</div></div>
          <Settings2 aria-hidden="true" className="ml-auto h-4 w-4 text-sidebar-foreground/45" />
        </Link>
        <button
          type="button"
          data-testid="button-sidebar-logout"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 transition-colors hover:bg-destructive/20 hover:text-destructive active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    {open && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-primary/30 lg:hidden" onClick={() => setOpen(false)} />}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md sm:px-8">
        <button data-testid="button-open-menu" aria-label="Open navigation menu" className="text-primary lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" /> Amrita Connect <span className="text-border">/</span> <span className="text-primary">{currentLabel}</span></div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            data-testid="link-messages-header"
            aria-label="Messages"
            href="/messages"
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            <MessageSquare aria-hidden="true" className="h-[18px] w-[18px]" />
          </Link>
          <Link data-testid="link-notifications-header" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} href="/notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><Bell aria-hidden="true" className="h-[18px] w-[18px]" />{unreadCount > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}</Link>
          <Link data-testid="link-profile-header" aria-label="Open your profile" href="/profile" className="ml-1"><Avatar user={user} size="sm" /></Link>

          <button
            type="button"
            data-testid="button-header-logout"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleLogout}
            className="ml-1 inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  </div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();
  const { data: user } = useGetCurrentUser();
  const copy = dashboardCopy[user?.role ?? 'student'];
  if (isLoading) return <LoadingState rows={4} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return <>
    <PageTitle eyebrow={`${copy.eyebrow} · ${user?.fullName?.split(' ')[0] ?? 'member'}`} title={copy.title} detail={copy.detail} action={<Link data-testid="link-dashboard-primary-action" href={copy.actionHref} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent-foreground">{copy.action} <ArrowRight className="h-4 w-4" /></Link>} />
    <section className="mb-6 rounded-xl border border-border bg-secondary/50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mono text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">Role-aware workspace</div><p className="mt-1 text-sm font-semibold text-primary">You are viewing the {roleLabels[user?.role ?? 'student'].toLowerCase()} experience.</p></div>
        <span data-testid="badge-current-role" className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary"><ShieldCheck className="h-3.5 w-3.5 text-accent-foreground" /> {roleLabels[user?.role ?? 'student']} access</span>
      </div>
    </section>

    {Number((data as any)?.pendingConnectionRequests) > 0 && (
      <section className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-5 animate-rise">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary font-bold">
              <Users2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                You have {(data as any).pendingConnectionRequests} pending connection invitation{((data as any).pendingConnectionRequests > 1 ? 's' : '')}!
              </h4>
              <p className="text-xs text-muted-foreground">
                Review your incoming requests to grow your network across Amrita campuses.
              </p>
            </div>
          </div>
          <Link
            href="/connections"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-primary hover:brightness-95"
          >
            Review Invitations <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    )}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise delay-1">
      <Metric label="Profile completion" value={`${data.profileCompletion}%`} detail="Make it easier to find you" progress={data.profileCompletion} />
      <Metric label="Connected Network" value={((data as any)?.connectionsCount ?? 0).toString()} detail="Mutual connections" accent />
      <Metric label="People in directory" value={data.peopleCount.toLocaleString()} detail="Across every campus" />
      <Metric label="Mentorship requests" value={data.mentorshipPending.toString()} detail="Waiting for your reply" />
    </div>

    <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="surface rounded-xl border border-border p-5 sm:p-6">
        <SectionHeader eyebrow="People to know" title="Recently active" link="/people" />
        <div className="mt-5 divide-y divide-border">{data.recentPeople?.slice(0, 4).map((person) => <PersonRow key={person.id} user={person} />)}</div>
        {!data.recentPeople?.length && <EmptyState icon={Users} title="Your network is waiting" detail="Explore the directory to find your first connection." action={<Link href="/people" className="text-sm font-bold text-accent-foreground">Browse people</Link>} />}
      </section>
      <section className="surface rounded-xl border border-border p-5 sm:p-6">
        <SectionHeader eyebrow="Next on the calendar" title="Upcoming events" link="/events" />
        <div className="mt-5 space-y-3">{data.upcoming?.slice(0, 3).map((event) => <EventRow key={event.id} event={event} />)}</div>
        {!data.upcoming?.length && <EmptyState icon={CalendarDays} title="A quiet calendar" detail="New campus events will show up here." />}
      </section>
    </div>

    {/* Community Feed Shortcut Banner */}
    <section className="mt-6 rounded-2xl border border-border bg-gradient-to-r from-card via-secondary/30 to-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/20 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">Amrita Community Feed</div>
            <h3 className="mt-0.5 text-lg font-bold text-foreground">See what peers & alumni are sharing across campuses</h3>
            <p className="text-xs text-muted-foreground">Discover interview experiences, achievements, research updates, and open questions.</p>
          </div>
        </div>
        <Link
          data-testid="link-dashboard-open-feed"
          href="/feed"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm"
        >
          Explore Campus Feed <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>

    <section className="mt-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><div className="mono text-[10px] uppercase tracking-[.2em] text-primary-foreground/45">A small nudge</div><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Your next connection may start with a question.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/60">Look for someone whose experience meets the edge of your curiosity.</p></div><Link data-testid="link-dashboard-mentorship" href="/mentorship" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-primary hover:brightness-95">Find a mentor <HeartHandshake className="h-4 w-4" /></Link></div></section>
  </>;
}
function Metric({ label, value, detail, progress, accent }: { label: string; value: string; detail: string; progress?: number; accent?: boolean }) { return <div className={cx('surface rounded-xl border border-border p-5', accent && 'bg-secondary/40')}><div className="flex items-start justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{accent && <Sparkles className="h-4 w-4 text-accent" />}</div><div data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-4 text-3xl font-bold tracking-[-.06em] text-foreground">{value}</div>{progress !== undefined ? <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${progress}%` }} /></div> : <p className="mt-3 text-xs text-muted-foreground">{detail}</p>} {progress !== undefined && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}</div>; }
function SectionHeader({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) { return <div className="flex items-end justify-between"><div><div className="mono text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</div><h2 className="mt-1 text-lg font-bold tracking-[-.03em] text-foreground">{title}</h2></div>{link && <Link data-testid={`link-section-${title.toLowerCase().replace(' ', '-')}`} href={link} className="text-xs font-bold text-muted-foreground hover:text-foreground">View all <ChevronRight className="inline h-3 w-3" /></Link>}</div>; }
function PersonRow({ user }: { user: PublicUser }) { return <Link data-testid={`link-person-${user.id}`} href={`/people/${user.id}`} className="flex items-center gap-3 py-3.5 group"><Avatar user={user} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-sm font-bold text-foreground group-hover:text-accent">{user.fullName}{user.verified && <Check className="h-3 w-3 text-accent" />}</div><p className="truncate text-xs text-muted-foreground">{user.headline || `${roleLabels[user.role]} · ${user.department}`}</p></div><span className="hidden text-xs text-muted-foreground sm:block">{user.campus}</span><ChevronRight className="h-4 w-4 text-border group-hover:text-foreground" /></Link>; }
function EventRow({ event }: { event: Event }) { return <Link data-testid={`link-event-${event.id}`} href="/events" className="flex gap-3 rounded-lg border border-border p-3 hover:bg-muted"><div className="min-w-11 rounded-md bg-secondary px-2 py-1 text-center"><div className="mono text-[9px] font-bold uppercase text-muted-foreground">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</div><div className="text-lg font-bold leading-5 text-foreground">{new Date(event.date).getDate()}</div></div><div className="min-w-0"><div className="truncate text-sm font-bold text-foreground">{event.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{event.campus} · {event.venue}</div></div></Link>; }
const POST_CATEGORIES = [

  'General',
  'Achievement',
  'Project',
  'Opportunity',
  'Interview Experience',
  'Resource',
  'Question',
  'Help Needed',
] as const;

type PostCategory = (typeof POST_CATEGORIES)[number];

const categoryBadgeStyles: Record<string, string> = {
  General: 'bg-muted text-muted-foreground border-border',
  Achievement: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Project: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  Opportunity: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Interview Experience': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Resource: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Question: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'Help Needed': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface PostCommentItem {
  id: string;
  text: string;
  createdAt: string;
  user: PublicUser;
  isMyComment: boolean;
}

interface PostItem {
  id: string;
  content: string;
  imageUrl?: string | null;
  category: PostCategory;
  campus: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  author: PublicUser;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isMyPost: boolean;
  comments: PostCommentItem[];
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as any),
  };
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

function CreatePostBox({ onCreated }: { onCreated: () => void }) {
  const { data: user } = useGetCurrentUser();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('General');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { content: string; category: PostCategory; imageUrl?: string | null }) =>
      apiFetch<PostItem>('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      setError('');
      onCreated();
    },
    onError: (err: any) => {
      setError(err.message || 'Could not publish post. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({
      content: content.trim(),
      category,
      imageUrl: imageUrl.trim() || null,
    });
  };

  return (
    <div className="surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3.5">
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground">
            {user?.fullName ?? 'You'} <span className="font-normal text-muted-foreground">· Amrita {user?.campus}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-accent"
            >
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          data-testid="textarea-create-post"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Share an achievement, interview experience, project update, or ask the Amrita community...`}
          rows={3}
          className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
          required
        />

        {showImageInput && (
          <div className="animate-rise space-y-2">
            <div className="flex items-center gap-2">
              <input
                data-testid="input-post-image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste public image link (e.g. https://.../demo.png)"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setShowImageInput(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {imageUrl.trim() && (
              <div className="relative max-h-48 overflow-hidden rounded-lg border border-border">
                <img
                  src={imageUrl.trim()}
                  alt="Attachment preview"
                  className="max-h-48 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageInput((prev) => !prev)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                showImageInput || imageUrl ? 'bg-accent/20 text-accent font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Image className="h-4 w-4" />
              <span>{showImageInput ? 'Image URL active' : 'Add Image'}</span>
            </button>
          </div>

          <Button
            data-testid="button-publish-post"
            type="submit"
            disabled={createMutation.isPending || !content.trim()}
            className="px-5 py-2 text-xs"
          >
            {createMutation.isPending ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Post to Feed
          </Button>
        </div>
      </form>
    </div>
  );
}

function PostCard({
  post,
  onEdit,
  onRefresh,
}: {
  post: PostItem;
  onEdit: (post: PostItem) => void;
  onRefresh: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string; isLiked: boolean; likesCount: number }>(`/posts/${post.id}/like`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const saveMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string; isSaved: boolean; savedCount: number }>(`/posts/${post.id}/save`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>(`/posts/${post.id}`, { method: 'DELETE' }),
    onSuccess: () => onRefresh(),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch<PostItem>(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch<{ success: boolean }>(`/posts/${post.id}/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const handleShare = () => {
    const url = `${window.location.origin}/feed`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const badgeClass = categoryBadgeStyles[post.category] ?? categoryBadgeStyles.General;

  return (
    <article className="surface relative rounded-2xl border border-border p-5 sm:p-6 shadow-sm transition-all hover:border-accent/30 animate-rise">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/people/${post.author?.id ?? ''}`} className="shrink-0 group">
            <Avatar user={post.author} size="md" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/people/${post.author?.id ?? ''}`}
                className="text-sm font-bold text-foreground hover:text-accent transition-colors"
              >
                {post.author?.fullName ?? 'Amrita Member'}
              </Link>
              {post.author?.verified && <Check className="h-3.5 w-3.5 text-accent" />}
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {roleLabels[post.author?.role] ?? post.author?.role}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {post.author?.headline || `${post.department} · Amrita ${post.campus}`} ·{' '}
              <span className="text-muted-foreground/75">{relative(post.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold', badgeClass)}>
            {post.category}
          </span>

          {post.isMyPost && (
            <div className="relative">
              <button
                type="button"
                aria-label="Post actions"
                onClick={() => setActionMenuOpen((prev) => !prev)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {actionMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-border bg-card p-1 shadow-lg animate-rise">
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      onEdit(post);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      if (confirm('Are you sure you want to delete this post?')) {
                        deleteMutation.mutate();
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Body */}
      <div className="mt-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 font-normal">
          {post.content}
        </p>
      </div>

      {/* Attached Image */}
      {post.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-white/5">
          <img
            src={post.imageUrl}
            alt="Post media"
            className="max-h-[420px] w-full object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Interactions Action Bar */}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            type="button"
            data-testid={`button-like-post-${post.id}`}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold transition-all active:scale-95',
              post.isLiked
                ? 'bg-rose-500/15 text-rose-500 font-bold'
                : 'hover:bg-muted hover:text-foreground'
            )}
          >
            <Heart className={cx('h-4 w-4', post.isLiked && 'fill-rose-500 text-rose-500')} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            type="button"
            data-testid={`button-comments-toggle-${post.id}`}
            onClick={() => setShowComments((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold hover:bg-muted hover:text-foreground transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentsCount}</span>
          </button>

          {/* Save Bookmark Button */}
          <button
            type="button"
            data-testid={`button-save-post-${post.id}`}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold transition-all active:scale-95',
              post.isSaved
                ? 'bg-accent/20 text-accent font-bold'
                : 'hover:bg-muted hover:text-foreground'
            )}
          >
            <Bookmark className={cx('h-4 w-4', post.isSaved && 'fill-accent text-accent')} />
            <span className="hidden sm:inline">{post.isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copied ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-border pt-4 space-y-3 animate-rise">
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              data-testid={`input-comment-post-${post.id}`}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a supportive reply or answer..."
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:border-accent"
            />
            <Button
              type="submit"
              disabled={commentMutation.isPending || !commentText.trim()}
              className="px-3 py-2 text-xs shrink-0"
            >
              {commentMutation.isPending ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 pt-1">
            {post.comments?.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 p-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar user={comment.user} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {comment.user?.fullName ?? 'Member'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relative(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground/90 font-normal leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>

                {(comment.isMyComment || post.isMyPost) && (
                  <button
                    type="button"
                    aria-label="Delete comment"
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {!post.comments?.length && (
              <p className="text-center py-2 text-xs text-muted-foreground">
                No comments yet. Start the conversation!
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function EditPostDialog({
  post,
  onClose,
  onUpdated,
}: {
  post: PostItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category);
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? '');
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: { content: string; category: PostCategory; imageUrl?: string | null }) =>
      apiFetch<PostItem>(`/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      onUpdated();
    },
    onError: (err: any) => {
      setError(err.message || 'Could not update post');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    updateMutation.mutate({
      content: content.trim(),
      category,
      imageUrl: imageUrl.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              Modify Post
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
              Edit your post
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-accent"
            >
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Post content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-input bg-card p-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Image URL (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !content.trim()}>
              {updateMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedPage() {
  const [view, setView] = useState<'all' | 'saved' | 'my_posts'>('all');
  const [category, setCategory] = useState<string>('');
  const [campus, setCampus] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['posts', { view, category, campus, department, search }], [view, category, campus, department, search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const q = new URLSearchParams();
      if (category) q.set('category', category);
      if (campus) q.set('campus', campus);
      if (department) q.set('department', department);
      if (search) q.set('search', search);
      if (view === 'saved') q.set('filter', 'saved');
      if (view === 'my_posts') q.set('filter', 'my_posts');
      return apiFetch<{ items: PostItem[]; total: number; page: number; pageSize: number }>(`/posts?${q.toString()}`);
    },
  });

  const posts = data?.items ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Amrita Social Commons"
        title="Campus Feed & Discussions."
        detail="Share breakthroughs, interview experiences, research updates, or ask for help across all 7 Amrita campuses."
      />

      {/* Create Post Box */}
      <CreatePostBox onCreated={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />

      {/* Main Filter & View Bar */}
      <div className="mt-8 space-y-4">
        {/* Top View Selector & Category Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex rounded-lg border border-border bg-card p-1">
            {[
              { id: 'all', label: 'All Posts' },
              { id: 'saved', label: 'Saved' },
              { id: 'my_posts', label: 'My Posts' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`button-feed-tab-${tab.id}`}
                onClick={() => setView(tab.id as any)}
                className={cx(
                  'rounded-md px-3.5 py-1.5 text-xs font-bold transition-all',
                  view === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={cx(
                'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                category === '' ? 'bg-accent text-primary font-bold' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              All Topics
            </button>
            {POST_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                data-testid={`button-category-${cat.toLowerCase().replaceAll(' ', '-')}`}
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={cx(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                  category === cat
                    ? 'border-accent bg-accent/20 text-accent font-bold'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Search and Campus/Department Filters */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_200px]">
          <label className="relative block">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              data-testid="input-feed-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by keywords, tags, or author..."
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <SelectField
            id="feed-campus-filter"
            label=""
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            options={[{ value: '', label: 'All campuses' }, ...campuses.map((c) => ({ value: c, label: c }))]}
          />
          <SelectField
            id="feed-department-filter"
            label=""
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
          />
        </div>
      </div>

      {/* Feed Stream */}
      <div className="mt-6 space-y-5">
        {isLoading ? (
          <LoadingState rows={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !posts.length ? (
          <EmptyState
            icon={Sparkles}
            title="No posts found in this feed"
            detail="Be the first to share an update, interview experience, project milestone, or question with the Amrita community!"
            action={
              (category || campus || department || search || view !== 'all') ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setView('all');
                    setCategory('');
                    setCampus('');
                    setDepartment('');
                    setSearch('');
                  }}
                >
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(p) => setEditingPost(p)}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            />
          ))
        )}
      </div>

      {editingPost && (
        <EditPostDialog
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setEditingPost(null);
          }}
        />
      )}
    </>
  );
}

interface ConnectionItem {
  id: string;
  user: PublicUser;
  connectedAt?: string;
  createdAt?: string;
  message?: string | null;
}

interface ConnectionSuggestionItem {
  user: PublicUser;
  score: number;
  reason: string;
  matchingPoints: string[];
}

interface ConnectionsData {
  connected: ConnectionItem[];
  incoming: ConnectionItem[];
  outgoing: ConnectionItem[];
  totalConnected: number;
  pendingCount: number;
}

interface ConnectionStatusData {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';
  connectionId?: string;
}

function useConnections() {
  const queryKey = ['connections'];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<ConnectionsData>('/connections'),
    }),
    queryKey,
  };
}

function useConnectionStatus(userId: string) {
  const queryKey = ['connections', 'status', userId];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<ConnectionStatusData>(`/connections/status/${userId}`),
      enabled: Boolean(userId),
    }),
    queryKey,
  };
}

function useConnectionSuggestions() {
  const queryKey = ['connections', 'suggestions'];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<{ items: ConnectionSuggestionItem[] }>('/connections/suggestions'),
    }),
    queryKey,
  };
}

function ConnectModal({
  user,
  onClose,
  onSent,
}: {
  user: PublicUser;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; connectionId: string; status: string }>('/connections', {
        method: 'POST',
        body: JSON.stringify({ receiverId: user.id, message: message.trim() || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      onSent();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              Professional Network
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
              Connect with {user.fullName.split(' ')[0]}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <Avatar user={user} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.headline || `${user.department} · ${user.campus}`}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            connectMutation.mutate();
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">
              Add a personal note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${user.fullName.split(' ')[0]}, I would love to connect and follow your work in ${user.department}...`}
              rows={3}
              className="w-full rounded-xl border border-input bg-card p-3 text-xs outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConnectActionButton({
  targetUser,
  size = 'default',
}: {
  targetUser: PublicUser;
  size?: 'default' | 'sm';
}) {
  const { data, isLoading, refetch } = useConnectionStatus(targetUser.id);
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      refetch();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      refetch();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      refetch();
    },
  });

  if (isLoading || !data) {
    return (
      <Button variant="outline" disabled className={size === 'sm' ? 'px-2.5 py-1 text-xs' : ''}>
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      </Button>
    );
  }

  if (data.status === 'self') {
    return null;
  }

  if (data.status === 'accepted') {
    return (
      <div className="relative inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <UserCheck className="h-3.5 w-3.5" /> Connected
        </span>
        <button
          type="button"
          aria-label="Connection options"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-border bg-card p-1 shadow-lg animate-rise">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                if (data.connectionId && confirm(`Disconnect from ${targetUser.fullName}?`)) {
                  disconnectMutation.mutate(data.connectionId);
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <UserX className="h-3.5 w-3.5" /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  if (data.status === 'pending_sent') {
    return (
      <Button
        variant="outline"
        onClick={() => {
          if (data.connectionId && confirm('Withdraw this connection invitation?')) {
            disconnectMutation.mutate(data.connectionId);
          }
        }}
        className={cx('border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10', size === 'sm' ? 'px-2.5 py-1 text-xs' : '')}
      >
        <Check className="h-3.5 w-3.5" /> Request Sent
      </Button>
    );
  }

  if (data.status === 'pending_received') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <Button
          onClick={() => data.connectionId && acceptMutation.mutate(data.connectionId)}
          disabled={acceptMutation.isPending}
          className={size === 'sm' ? 'px-2.5 py-1 text-xs' : ''}
        >
          <Check className="h-3.5 w-3.5" /> Accept
        </Button>
        <Button
          variant="quiet"
          onClick={() => data.connectionId && rejectMutation.mutate(data.connectionId)}
          disabled={rejectMutation.isPending}
          className={size === 'sm' ? 'px-2.5 py-1 text-xs' : ''}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        data-testid={`button-connect-${targetUser.id}`}
        variant="outline"
        onClick={() => setShowModal(true)}
        className={cx('border-accent/50 text-accent font-bold hover:bg-accent/15', size === 'sm' ? 'px-2.5 py-1 text-xs' : '')}
      >
        <UserPlus className="h-3.5 w-3.5" /> Connect
      </Button>
      {showModal && <ConnectModal user={targetUser} onClose={() => setShowModal(false)} onSent={() => refetch()} />}
    </>
  );
}

function ConnectionsPage() {
  const [tab, setTab] = useState<'connected' | 'pending' | 'suggestions'>('connected');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useConnections();
  const { data: suggestionsData, isLoading: sugLoading } = useConnectionSuggestions();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/accept`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/reject`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });

  const connectedList = (data?.connected ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.user?.fullName?.toLowerCase().includes(q) ||
      item.user?.department?.toLowerCase().includes(q) ||
      item.user?.campus?.toLowerCase().includes(q) ||
      item.user?.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const incomingList = data?.incoming ?? [];
  const outgoingList = data?.outgoing ?? [];
  const suggestionsList = suggestionsData?.items ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Professional Network"
        title="Amrita Connected Network."
        detail="Stay in touch with peers, alumni mentors, researchers, and batchmates across all 7 Amrita campuses."
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex rounded-lg border border-border bg-card p-1">
          {[
            { id: 'connected', label: `My Connections (${data?.totalConnected ?? 0})` },
            { id: 'pending', label: `Pending Requests (${data?.pendingCount ?? 0})` },
            { id: 'suggestions', label: 'People You May Know' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`tab-connections-${t.id}`}
              onClick={() => setTab(t.id as any)}
              className={cx(
                'rounded-md px-3.5 py-1.5 text-xs font-bold transition-all',
                tab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'connected' && (
          <label className="relative block w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your connections..."
              className="w-full rounded-lg border border-input bg-card py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent"
            />
          </label>
        )}
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : tab === 'connected' ? (
        connectedList.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No connections found"
            detail="Start expanding your cross-campus network by discovering classmates, researchers, and alumni!"
            action={
              <Button onClick={() => setTab('suggestions')}>
                <Sparkles className="h-4 w-4" /> Find People You May Know
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedList.map(({ id, user, connectedAt }) => (
              <div key={id} className="surface flex flex-col justify-between rounded-xl border border-border p-5 shadow-sm animate-rise">
                <div>
                  <div className="flex items-start justify-between">
                    <Avatar user={user} size="md" />
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                  <Link href={`/people/${user.id}`} className="mt-3 block text-base font-bold text-foreground hover:text-accent">
                    {user.fullName}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {user.headline || `${user.department} · Amrita ${user.campus}`}
                  </p>
                  <div className="mt-3 text-[11px] text-muted-foreground/80">
                    Connected {relative(connectedAt || '')}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/messages/${user.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm"
                    >
                      <MessageSquare className="h-3 w-3" /> Message
                    </Link>
                    <Link
                      href={`/people/${user.id}`}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Profile
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove connection with ${user.fullName}?`)) {
                        removeMutation.mutate(id);
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

              </div>
            ))}
          </div>
        )
      ) : tab === 'pending' ? (
        <div className="space-y-8 animate-rise">
          {/* Incoming */}
          <section>
            <h3 className="text-sm font-bold text-foreground">
              Received Invitations ({incomingList.length})
            </h3>
            {incomingList.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No incoming connection requests at this time.</p>
            ) : (
              <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                {incomingList.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar user={item.user} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/people/${item.user.id}`} className="text-sm font-bold text-foreground hover:text-accent">
                            {item.user.fullName}
                          </Link>
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {roleLabels[item.user.role] ?? item.user.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.user.headline || `${item.user.department} · ${item.user.campus}`}</p>
                        {item.message && (
                          <p className="mt-2 rounded-lg bg-secondary/60 p-2.5 text-xs text-foreground italic">
                            "{item.message}"
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-muted-foreground">Received {relative(item.createdAt || '')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => acceptMutation.mutate(item.id)}
                        disabled={acceptMutation.isPending}
                        className="px-3.5 py-1.5 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button
                        variant="quiet"
                        onClick={() => rejectMutation.mutate(item.id)}
                        disabled={rejectMutation.isPending}
                        className="px-3.5 py-1.5 text-xs"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Outgoing */}
          <section>
            <h3 className="text-sm font-bold text-foreground">
              Sent Invitations ({outgoingList.length})
            </h3>
            {outgoingList.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No pending sent invitations.</p>
            ) : (
              <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                {outgoingList.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar user={item.user} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/people/${item.user.id}`} className="text-sm font-bold text-foreground hover:text-accent">
                            {item.user.fullName}
                          </Link>
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {roleLabels[item.user.role] ?? item.user.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.user.department} · {item.user.campus}</p>
                        <span className="text-[10px] text-muted-foreground">Sent {relative(item.createdAt || '')}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => removeMutation.mutate(item.id)}
                      disabled={removeMutation.isPending}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Withdraw Request
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Grow Network / Suggestions */
        <div>
          {sugLoading ? (
            <LoadingState rows={3} />
          ) : suggestionsList.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendations right now"
              detail="Explore the full directory to meet people from all departments and campuses."
              action={
                <Link href="/people" className="text-sm font-bold text-accent">
                  Browse People Directory
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestionsList.map(({ user, score: _score, reason, matchingPoints }) => (
                <div key={user.id} className="surface flex flex-col justify-between rounded-xl border border-border p-5 shadow-sm animate-rise">
                  <div>
                    <div className="flex items-start justify-between">
                      <Avatar user={user} size="md" />
                      <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </div>
                    <Link href={`/people/${user.id}`} className="mt-3 block text-base font-bold text-foreground hover:text-accent">
                      {user.fullName}
                    </Link>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {user.headline || `${user.department} · Amrita ${user.campus}`}
                    </p>

                    <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-xs">
                      <div className="font-semibold text-accent flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> {reason}
                      </div>
                      {matchingPoints.length > 1 && (
                        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground list-disc list-inside">
                          {matchingPoints.slice(1, 3).map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
                    <Link href={`/people/${user.id}`} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                      Profile
                    </Link>
                    <ConnectActionButton targetUser={user} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
  isMine: boolean;
}

interface ConversationItem {
  otherUser: PublicUser;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isMine: boolean;
    read: boolean;
  };
  unreadCount: number;
}

function useConversations() {
  const queryKey = ['messages', 'conversations'];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<{ items: ConversationItem[] }>('/messages/conversations'),
      refetchInterval: 5000,
    }),
    queryKey,
  };
}

function useMessagesThread(recipientId?: string) {
  const queryKey = ['messages', 'thread', recipientId];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<{ recipient: PublicUser; messages: DirectMessage[] }>(`/messages/${recipientId}`),
      enabled: Boolean(recipientId),
      refetchInterval: 3000,
    }),
    queryKey,
  };
}

function NewChatModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (userId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const { data: connectionsData } = useConnections();
  const { data: directoryData } = useListUsers(
    { search: search || undefined, page: 1, pageSize: 15 },
    { query: { queryKey: getListUsersQueryKey({ search: search || undefined, page: 1, pageSize: 15 }) } }
  );

  const connections = connectionsData?.connected ?? [];
  const directoryUsers = directoryData?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              Direct Message
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
              Start a new conversation
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by name, skill, or campus..."
              className="w-full rounded-xl border border-input bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-accent"
              autoFocus
            />
          </label>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto space-y-1 divide-y divide-border">
          {search.trim() ? (
            directoryUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary/60"
              >
                <Avatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{user.fullName}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{user.department} · {user.campus}</p>
                </div>
                <Send className="h-3.5 w-3.5 text-accent" />
              </button>
            ))
          ) : connections.length > 0 ? (
            connections.map(({ user }) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary/60"
              >
                <Avatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{user.fullName}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{user.headline || `${user.department} · ${user.campus}`}</p>
                </div>
                <Send className="h-3.5 w-3.5 text-accent" />
              </button>
            ))
          ) : (
            <p className="text-center py-6 text-xs text-muted-foreground">
              Search above to find any member across Amrita.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesPage() {
  const params = useParams<{ recipientId?: string }>();
  const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(params.recipientId);
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    if (params.recipientId) {
      setActiveRecipientId(params.recipientId);
    }
  }, [params.recipientId]);

  const { data: convData, isLoading: convLoading } = useConversations();
  const { data: threadData, isLoading: threadLoading, refetch: refetchThread } = useMessagesThread(activeRecipientId);
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch<DirectMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: activeRecipientId, content: text }),
      }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      refetchThread();
    },
  });

  const handleSelectRecipient = (id: string) => {
    setActiveRecipientId(id);
    setLocation(`/messages/${id}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeRecipientId) return;
    sendMutation.mutate(content.trim());
  };

  const conversations = (convData?.items ?? []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.otherUser?.fullName?.toLowerCase().includes(q) ||
      c.otherUser?.department?.toLowerCase().includes(q) ||
      c.lastMessage?.content?.toLowerCase().includes(q)
    );
  });

  const currentRecipient = threadData?.recipient;
  const messages = threadData?.messages ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Direct Messages"
        title="Amrita Community Chat."
        detail="Collaborate in real time with batchmates, mentors, and faculty across all Amrita campuses."
      />

      <div className="mt-4 grid h-[calc(100vh-220px)] min-h-[550px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]">
        {/* Left Sidebar: Conversations */}
        <div className={cx('flex flex-col border-r border-border bg-card', activeRecipientId ? 'hidden md:flex' : 'flex')}>
          {/* Header & New Chat button */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-base font-bold tracking-tight text-foreground">Conversations</h2>
            <Button
              variant="outline"
              onClick={() => setShowNewChat(true)}
              className="px-2.5 py-1 text-xs font-bold border-accent/40 text-accent hover:bg-accent/10"
            >
              <UserPlus className="h-3.5 w-3.5" /> New Chat
            </Button>
          </div>

          {/* Search bar */}
          <div className="border-b border-border p-3">
            <label className="relative block">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-input bg-secondary/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent"
              />
            </label>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {convLoading ? (
              <div className="p-4"><LoadingState rows={3} /></div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No conversations yet</p>
                <p className="mt-1">Click "New Chat" to connect with peers and mentors.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeRecipientId === conv.otherUser?.id;
                return (
                  <button
                    key={conv.otherUser?.id}
                    type="button"
                    onClick={() => handleSelectRecipient(conv.otherUser.id)}
                    className={cx(
                      'flex w-full items-start gap-3 p-3.5 text-left transition-all',
                      isActive ? 'bg-accent/15 border-l-4 border-l-accent' : 'hover:bg-secondary/40'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar user={conv.otherUser} size="md" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cx('truncate text-xs font-bold', isActive ? 'text-accent' : 'text-foreground')}>
                          {conv.otherUser?.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {relative(conv.lastMessage?.createdAt || '')}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {conv.lastMessage?.isMine && <span className="font-semibold text-foreground/80">You: </span>}
                        {conv.lastMessage?.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className={cx('flex flex-col bg-background/50', !activeRecipientId ? 'hidden md:flex' : 'flex')}>
          {activeRecipientId && currentRecipient ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRecipientId(undefined);
                      setLocation('/messages');
                    }}
                    className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <Link href={`/people/${currentRecipient.id}`}>
                    <Avatar user={currentRecipient} size="md" />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/people/${currentRecipient.id}`}
                        className="text-sm font-bold text-foreground hover:text-accent transition-colors"
                      >
                        {currentRecipient.fullName}
                      </Link>
                      {currentRecipient.verified && <Check className="h-3.5 w-3.5 text-accent" />}
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {roleLabels[currentRecipient.role] ?? currentRecipient.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {currentRecipient.department} · Amrita {currentRecipient.campus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/people/${currentRecipient.id}`}
                    className="rounded-xl border border-border px-3 py-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 flex flex-col justify-end">
                {threadLoading ? (
                  <LoadingState rows={3} />
                ) : messages.length === 0 ? (
                  <div className="my-auto text-center py-10 text-xs text-muted-foreground">
                    <Avatar user={currentRecipient} size="lg" />
                    <h3 className="mt-3 text-sm font-bold text-foreground">{currentRecipient.fullName}</h3>
                    <p className="mt-1 max-w-xs mx-auto">
                      Send a friendly message to kick off your conversation with {currentRecipient.fullName.split(' ')[0]}!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cx(
                        'flex flex-col',
                        msg.isMine ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cx(
                          'rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[85%] sm:max-w-md shadow-sm',
                          msg.isMine
                            ? 'bg-primary text-primary-foreground rounded-br-xs'
                            : 'bg-card text-foreground border border-border rounded-bl-xs'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground px-1">
                        <span>{relative(msg.createdAt)}</span>
                        {msg.isMine && (
                          <Check className={cx('h-3 w-3', msg.read ? 'text-accent' : 'text-muted-foreground')} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="border-t border-border bg-card p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <input
                    data-testid="input-chat-message"
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Message ${currentRecipient.fullName.split(' ')[0]}... (press Enter to send)`}
                    className="flex-1 rounded-xl border border-input bg-secondary/40 px-4 py-2.5 text-xs outline-none focus:border-accent"
                    autoFocus
                  />
                  <Button
                    data-testid="button-send-chat-message"
                    type="submit"
                    disabled={sendMutation.isPending || !content.trim()}
                    className="px-4 py-2.5 text-xs shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 max-w-md">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-accent mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Your Amrita Inbox</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Connect and exchange ideas with peers, alumni mentors, and faculty researchers across all 7 campuses.
              </p>
              <Button onClick={() => setShowNewChat(true)} className="mt-6">
                <UserPlus className="h-4 w-4" /> Start a new conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={(userId) => handleSelectRecipient(userId)}
        />
      )}
    </>
  );
}

function PeoplePage() {

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [campus, setCampus] = useState('');
  const [department, setDepartment] = useState('');
  const params = useMemo(() => ({
    search: search || undefined,
    role: role ? (role as 'student' | 'alumni' | 'faculty' | 'researcher' | 'admin') : undefined,
    campus: campus || undefined,
    department: department || undefined,
    page: 1,
    pageSize: 20,
  }), [search, role, campus, department]);
  const { data, isLoading, isError, refetch } = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params) } });
  return <>
    <PageTitle eyebrow="Directory" title="People worth knowing." detail="Search the full Amrita community by experience, campus, or discipline." />
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_150px_150px_200px]">
      <label className="relative block">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input data-testid="input-people-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search names, skills, interests..." className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent-foreground" />
      </label>
      <SelectField id="people-role-filter" label="" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: '', label: 'All roles' }, ...Object.entries(roleLabels).map(([value, label]) => ({ value, label }))]} />
      <SelectField id="people-campus-filter" label="" value={campus} onChange={(e) => setCampus(e.target.value)} options={[{ value: '', label: 'All campuses' }, ...campuses.map((value) => ({ value, label: value }))]} />
      <SelectField id="people-department-filter" label="" value={department} onChange={(e) => setDepartment(e.target.value)} options={[{ value: '', label: 'All departments' }, ...departments.map((value) => ({ value, label: value }))]} />
    </div>
    {isLoading ? <LoadingState rows={5} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.items?.length ? <EmptyState icon={Users} title="No people match that search" detail="Try a broader search or remove one of the filters." action={<Button variant="outline" onClick={() => { setSearch(''); setRole(''); setCampus(''); setDepartment(''); }}>Clear filters</Button>} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map((person, i) => <PersonCard key={person.id} user={person} index={i} />)}</div>}
  </>;
}
function PersonCard({ user, index = 0 }: { user: PublicUser; index?: number }) {
  return (
    <div data-testid={`card-person-${user.id}`} className={cx('surface group flex flex-col justify-between rounded-xl border border-border p-5 animate-rise transition-all hover:border-accent/40', `delay-${Math.min(index + 1, 3)}`)}>
      <div>
        <div className="flex items-start justify-between">
          <Avatar user={user} />
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{roleLabels[user.role] ?? user.role}</span>
        </div>
        <Link href={`/people/${user.id}`} className="mt-4 flex items-center gap-1.5 text-lg font-bold tracking-[-.04em] text-foreground hover:text-accent">
          {user.fullName}
          {user.verified && <Check className="h-4 w-4 text-accent" />}
        </Link>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{user.headline || `${user.department} · ${user.campus}`}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{user.campus}</span>
          <span className="text-border">·</span>
          <span>{user.department}</span>
          {user.graduationYear && (
            <>
              <span className="text-border">·</span>
              <span className="font-semibold text-accent">Class of {user.graduationYear}</span>
            </>
          )}
        </div>
        {user.skills?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{user.skills.slice(0, 3).map((skill) => <Tag key={skill}>{skill}</Tag>)}</div>}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
        <Link href={`/people/${user.id}`} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          View Profile
        </Link>
        <ConnectActionButton targetUser={user} size="sm" />
      </div>
    </div>
  );
}

function PublicProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: person, isLoading, isError, refetch } = useGetUser(id);
  const [showRequest, setShowRequest] = useState(false);
  if (isLoading) return <LoadingState rows={2} />;
  if (isError || !person) return <ErrorState onRetry={() => refetch()} />;
  return <>
    <Link data-testid="link-back-people" href="/people" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
      <ChevronRight className="h-4 w-4 rotate-180" /> Back to people
    </Link>
    <div className="surface overflow-hidden rounded-xl border border-border">
      <div className="h-28 bg-gradient-to-r from-secondary via-secondary/60 to-accent/10 sm:h-40" />
      <div className="px-5 pb-7 sm:px-8">
        <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <Avatar user={person} size="lg" />
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/messages/${person.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <MessageSquare className="h-4 w-4 text-accent" /> Message
            </Link>
            <ConnectActionButton targetUser={person} />
            <Button data-testid="button-request-mentorship" onClick={() => setShowRequest(true)}>
              <HeartHandshake className="h-4 w-4" />Ask for mentorship
            </Button>
          </div>

        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-[-.06em] text-foreground">{person.fullName}</h1>
            {person.verified && <Check className="h-5 w-5 text-accent" />}
            <span className="rounded-md bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">{roleLabels[person.role] ?? person.role}</span>
          </div>
          <p className="mt-1 text-base text-muted-foreground">{person.headline}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{person.campus}</span>
            <span>{person.department}</span>
            {person.graduationYear && <span className="font-semibold text-accent">Class of {person.graduationYear}</span>}
            {person.company && <span>{person.company}{person.jobRole && ` · ${person.jobRole}`}</span>}
          </div>
        </div>
        <div className="mt-8 grid gap-8 border-t border-border pt-7 lg:grid-cols-[1fr_280px]">
          <div>
            <h2 className="font-bold text-foreground">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{person.bio || 'This member has not added a bio yet.'}</p>
            <InfoGroup title="Skills" items={person.skills} />
            <InfoGroup title="Interested in" items={person.interests} />
          </div>
          <div className="space-y-5">
            <ProfileAside title="Can help with" items={person.helpWith} />
            <ProfileAside title="Looking for" items={person.lookingFor} />
          </div>
        </div>
      </div>
    </div>
    {showRequest && <MentorshipDialog mentor={person} onClose={() => setShowRequest(false)} />}
  </>;
}
function InfoGroup({ title, items = [] }: { title: string; items?: string[] }) { return items?.length ? <div className="mt-8"><h3 className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <Tag key={item} warm>{item}</Tag>)}</div></div> : null; }
function ProfileAside({ title, items = [] }: { title: string; items?: string[] }) { return <div><h3 className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3><div className="mt-3 space-y-2">{items?.length ? items.map((item) => <div className="flex gap-2 text-sm text-foreground" key={item}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{item}</div>) : <span className="text-sm text-muted-foreground">Not shared yet</span>}</div></div>; }
function MentorshipDialog({ mentor, onClose }: { mentor: PublicUser; onClose: () => void }) { const create = useCreateMentorshipRequest(); const [form, setForm] = useState({ topic: '', reason: '', message: '' }); const queryClient = useQueryClient(); const submit = (e: React.FormEvent) => { e.preventDefault(); create.mutate({ data: { mentorId: mentor.id, ...form } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMentorshipRequestsQueryKey() }); onClose(); } }); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">A thoughtful ask</div><h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Ask {mentor.fullName.split(' ')[0]} to mentor you</h2></div><button data-testid="button-close-mentorship-dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><Field id="mentorship-topic" label="What would you like to learn?" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required /><Field id="mentorship-reason" label="Why this person?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /><label className="block"><span className="mb-1.5 block text-xs font-bold text-foreground">Your note</span><textarea data-testid="textarea-mentorship-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-accent-foreground" placeholder="Introduce yourself and share what a useful first conversation looks like." /></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button data-testid="button-submit-mentorship" type="submit" disabled={create.isPending}>{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send request</Button></div></form></div></div>; }

function MentorshipPage() {
  const { data, isLoading, isError, refetch } = useListMentorshipRequests(); const status = useUpdateMentorshipRequestStatus(); const queryClient = useQueryClient(); const [filter, setFilter] = useState('all'); const items = data?.filter((item) => filter === 'all' || item.status === filter) ?? []; const update = (id: string, value: 'accepted' | 'rejected') => status.mutate({ id, data: { status: value } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMentorshipRequestsQueryKey() }) }); return <><PageTitle eyebrow="Mentorship" title="Make room for guidance." detail="Keep track of the conversations you have started and the ones waiting on you." action={<div className="flex rounded-lg border border-border bg-card p-1">{['all', 'pending', 'accepted'].map((value) => <button data-testid={`button-filter-mentorship-${value}`} key={value} onClick={() => setFilter(value)} className={cx('rounded-md px-3 py-1.5 text-xs font-bold capitalize', filter === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{value}</button>)}</div>} />{isLoading ? <LoadingState rows={3} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !items.length ? <EmptyState icon={HeartHandshake} title={filter === 'all' ? 'No mentorship requests yet' : `No ${filter} requests`} detail="When you find the right person, a clear and considered note is a good place to start." action={<Link href="/people" className="text-sm font-bold text-accent">Explore the directory</Link>} /> : <div className="space-y-4">{items.map((item) => <MentorshipCard key={item.id} item={item} onUpdate={update} pending={status.isPending} />)}</div>}</>; }
function MentorshipCard({ item, onUpdate, pending }: { item: MentorshipRequest; onUpdate: (id: string, status: 'accepted' | 'rejected') => void; pending: boolean }) { return <div className="surface rounded-xl border border-border p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><Avatar user={item.requester} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-foreground">{item.requester.fullName}</h2><Status status={item.status} /></div><p className="mt-1 text-xs text-muted-foreground">Requesting mentorship · {relative(item.createdAt)}</p><p className="mt-4 text-sm leading-6 text-foreground">{item.message}</p><div className="mt-4 flex flex-wrap gap-2"><Tag warm>{item.topic}</Tag><Tag>{item.reason}</Tag></div></div>{item.status === 'pending' && <div className="flex shrink-0 gap-2 sm:flex-col"><Button data-testid={`button-accept-mentorship-${item.id}`} className="px-3 py-2" disabled={pending} onClick={() => onUpdate(item.id, 'accepted')}><Check className="h-4 w-4" />Accept</Button><Button data-testid={`button-reject-mentorship-${item.id}`} variant="quiet" className="px-3 py-2" disabled={pending} onClick={() => onUpdate(item.id, 'rejected')}>Decline</Button></div>}</div></div>; }
function Status({ status }: { status: string }) { return <span data-testid={`status-${status}`} className={cx('rounded-full px-2.5 py-1 text-[10px] font-bold capitalize', status === 'accepted' ? 'bg-emerald-500/15 text-emerald-500' : status === 'rejected' ? 'bg-destructive/15 text-destructive' : 'bg-accent/20 text-accent')}>{status}</span>; }

function CollaborationsPage() {
  const [search, setSearch] = useState(''); const [showCreate, setShowCreate] = useState(false); const params = useMemo(() => ({ search: search || undefined, page: 1, pageSize: 20 }), [search]); const { data, isLoading, isError, refetch } = useListCollaborations(params, { query: { queryKey: getListCollaborationsQueryKey(params) } }); return <><PageTitle eyebrow="Collaborate" title="Build something together." detail="Find open questions and bring the right mix of people around them." action={<Button data-testid="button-create-collaboration" onClick={() => setShowCreate(true)}><Zap className="h-4 w-4" />Post a project</Button>} /><label className="relative mb-6 block max-w-xl"><Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" /><input data-testid="input-collaborations-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects, skills, or categories..." className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent-foreground" /></label>{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.items?.length ? <EmptyState icon={Network} title="No projects posted yet" detail="Have an idea that needs a team? Give it a shape and invite the community in." action={<Button onClick={() => setShowCreate(true)}>Post the first project</Button>} /> : <div className="grid gap-4 lg:grid-cols-2">{data.items.map((item) => <CollaborationCard key={item.id} item={item} />)}</div>}{showCreate && <CreateCollaborationDialog onClose={() => setShowCreate(false)} />}</>; }
function CollaborationCard({ item }: { item: Collaboration }) { return <div className="surface rounded-xl border border-border p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><Tag warm>{item.category}</Tag><span className="mono text-[10px] text-muted-foreground">Due {formatDate(item.deadline)}</span></div><h2 className="mt-4 text-xl font-bold tracking-[-.04em] text-foreground">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p><div className="mt-5 flex flex-wrap gap-1.5">{item.requiredSkills?.map((skill) => <Tag key={skill}>{skill}</Tag>)}</div><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><div className="flex items-center gap-2"><Avatar user={item.creator} size="sm" /><div><p className="text-xs font-bold text-foreground">{item.creator.fullName}</p><p className="text-[10px] text-muted-foreground">{item.memberCount} of {item.teamSize} spots filled</p></div></div><Button variant="outline" className="px-3 py-2" onClick={() => undefined}>View project <ArrowRight className="h-3.5 w-3.5" /></Button></div></div>; }
function CreateCollaborationDialog({ onClose }: { onClose: () => void }) { const create = useCreateCollaboration(); const queryClient = useQueryClient(); const [form, setForm] = useState({ title: '', description: '', requiredSkills: '', teamSize: '3', deadline: '', category: 'Research' }); const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value })); const submit = (e: React.FormEvent) => { e.preventDefault(); create.mutate({ data: { ...form, requiredSkills: form.requiredSkills.split(',').map((x) => x.trim()).filter(Boolean), teamSize: Number(form.teamSize) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() }); onClose(); } }); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Open call</div><h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Post a project</h2></div><button data-testid="button-close-collaboration-dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><Field id="collaboration-title" label="Project title" value={form.title} onChange={(e) => set('title', e.target.value)} required /><label className="block"><span className="mb-1.5 block text-xs font-bold text-foreground">What are you working on?</span><textarea data-testid="textarea-collaboration-description" value={form.description} onChange={(e) => set('description', e.target.value)} required rows={4} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-accent-foreground" /></label><div className="grid gap-4 sm:grid-cols-2"><Field id="collaboration-skills" label="Skills needed" placeholder="Python, design, fieldwork" value={form.requiredSkills} onChange={(e) => set('requiredSkills', e.target.value)} required /><Field id="collaboration-deadline" label="Deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} required /></div><div className="grid gap-4 sm:grid-cols-2"><SelectField id="collaboration-category" label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} options={['Research', 'Startup', 'Student life', 'Community'].map((value) => ({ value, label: value }))} /><Field id="collaboration-team-size" label="Team size" type="number" value={form.teamSize} onChange={(e) => set('teamSize', e.target.value)} required /></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button data-testid="button-submit-collaboration" type="submit" disabled={create.isPending}>{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publish project</Button></div></form></div></div>; }

function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const params = useMemo(() => ({ search: search || undefined, page: 1, pageSize: 20 }), [search]);
  const queryClient = useQueryClient();
  const save = useSaveOpportunity();
  const unsave = useUnsaveOpportunity();
  const { data, isLoading, isError, refetch } = useListOpportunities(params, { query: { queryKey: getListOpportunitiesQueryKey(params) } });
  const items = data?.items ?? [];
  const saving = save.isPending || unsave.isPending;
  const toggleSave = (item: Opportunity) => {
    setActionError(null);
    const mutation = item.saved ? unsave : save;
    mutation.mutate({ id: item.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => setActionError('That save could not be updated. Please try again.'),
    });
  };
  return <><PageTitle eyebrow="Opportunities" title="A next step, if it fits." detail="Fellowships, roles, research calls, and chances to turn your interests into momentum." /><label className="relative mb-6 block max-w-xl"><Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" /><input data-testid="input-opportunities-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search opportunities..." className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent-foreground" /></label>{actionError && <p role="alert" className="mb-4 text-sm font-semibold text-destructive">{actionError}</p>}{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !items.length ? <EmptyState icon={BriefcaseBusiness} title="No opportunities found" detail="Try a different phrase. New calls are added throughout the year." /> : <div className="space-y-3">{items.map((item) => <OpportunityRow key={item.id} item={item} onSave={() => toggleSave(item)} saving={saving} />)}</div>}</>;
}
function OpportunityRow({ item, onSave, saving }: { item: Opportunity; onSave: () => void; saving: boolean }) { return <div className="surface flex flex-col gap-5 rounded-xl border border-border p-5 sm:flex-row sm:items-start sm:p-6"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground"><BriefcaseBusiness className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Tag warm>{item.category}</Tag><span className="text-xs text-muted-foreground">{item.organization}</span></div><h2 className="mt-2 text-lg font-bold tracking-[-.03em] text-foreground">{item.title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{item.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.requiredSkills?.slice(0, 4).map((skill) => <Tag key={skill}>{skill}</Tag>)}</div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Eligibility: {item.eligibility}</span><span>Deadline: <strong className="text-foreground">{formatDate(item.deadline, true)}</strong></span></div></div><div className="flex shrink-0 gap-2 sm:flex-col"><button aria-label={item.saved ? `Remove ${item.title} from saved opportunities` : `Save ${item.title}`} data-testid={`button-save-opportunity-${item.id}`} onClick={onSave} disabled={saving} className={cx('rounded-lg border p-2.5', item.saved ? 'border-accent bg-accent/20 text-accent' : 'border-border text-muted-foreground hover:text-foreground')}>{item.saved ? <Check className="h-4 w-4" /> : <HeartHandshake className="h-4 w-4" />}</button><a data-testid={`link-apply-opportunity-${item.id}`} href={item.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90">Apply <ArrowRight className="h-3.5 w-3.5" /></a></div></div>; }

function EventsPage() {
  const [campus, setCampus] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const params = useMemo(() => ({ campus: campus || undefined, page: 1, pageSize: 20 }), [campus]);
  const queryClient = useQueryClient();
  const register = useRegisterForEvent();
  const unregister = useUnregisterFromEvent();
  const { data, isLoading, isError, refetch } = useListEvents(params, { query: { queryKey: getListEventsQueryKey(params) } });
  const items = data?.items ?? [];
  const registering = register.isPending || unregister.isPending;
  const toggleRegistration = (event: Event) => {
    setActionError(null);
    const mutation = event.registered ? unregister : register;
    mutation.mutate({ id: event.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => setActionError('That registration could not be updated. The event may be full.'),
    });
  };
  return <><PageTitle eyebrow="Events" title="Show up for something." detail="Talks, workshops, reunions, and the small moments that make a campus feel connected." action={<SelectField id="events-campus-filter" label="" value={campus} onChange={(e) => setCampus(e.target.value)} options={[{ value: '', label: 'All campuses' }, ...campuses.map((value) => ({ value, label: value }))]} />} />{actionError && <p role="alert" className="mb-4 text-sm font-semibold text-destructive">{actionError}</p>}{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !items.length ? <EmptyState icon={CalendarDays} title="Nothing on the calendar yet" detail="Check back soon for the next set of gatherings." /> : <div className="grid gap-4 md:grid-cols-2">{items.map((event) => <EventCard key={event.id} event={event} registered={event.registered} onRegister={() => toggleRegistration(event)} registering={registering} />)}</div>}</>;
}
function EventCard({ event, registered, onRegister, registering }: { event: Event; registered: boolean; onRegister: () => void; registering: boolean }) { return <div className="surface rounded-xl border border-border p-5 sm:p-6"><div className="flex gap-4"><div className="w-14 shrink-0 rounded-lg bg-secondary border border-border p-2 text-center text-foreground"><div className="mono text-[9px] font-bold uppercase tracking-wider text-accent">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</div><div className="text-2xl font-bold">{new Date(event.date).getDate()}</div><div className="text-[9px] uppercase text-muted-foreground">{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short' })}</div></div><div className="min-w-0"><h2 className="text-lg font-bold tracking-[-.03em] text-foreground">{event.title}</h2><p className="mt-1 text-xs text-muted-foreground">{event.campus} · {event.venue}</p></div></div><p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">{event.description}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">By {event.organizer}</span><Button aria-label={registered ? `Cancel registration for ${event.title}` : `Register for ${event.title}`} data-testid={`button-register-event-${event.id}`} variant={registered ? 'quiet' : 'outline'} className="px-3 py-2" disabled={registering} onClick={onRegister}>{registered ? <><Check className="h-3.5 w-3.5" />Registered</> : 'Register'}</Button></div></div>; }

function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useListNotifications(); const mark = useMarkNotificationRead(); const queryClient = useQueryClient(); const items = data ?? []; const read = (notification: Notification) => { if (!notification.read) mark.mutate({ id: notification.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }); }; return <><PageTitle eyebrow="Notifications" title="Keep in the loop." detail="A quiet inbox for the things that need your attention." action={<Link data-testid="link-notifications-people" href="/people" className="text-sm font-semibold text-accent">Find people <ArrowRight className="inline h-4 w-4" /></Link>} />{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !items.length ? <EmptyState icon={Bell} title="You are all caught up" detail="New requests, invitations, and updates will land here." /> : <div className="max-w-3xl divide-y divide-border rounded-xl border border-border bg-card">{items.map((item) => <button data-testid={`button-notification-${item.id}`} onClick={() => read(item)} key={item.id} className={cx('flex w-full gap-4 p-5 text-left hover:bg-muted', !item.read && 'bg-secondary/40')}><div className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-border' : 'bg-accent')} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-4"><h2 className="text-sm font-bold text-foreground">{item.title}</h2><span className="shrink-0 text-[10px] text-muted-foreground">{relative(item.createdAt)}</span></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p></div></button>)}</div>}</>;
}

function ProfilePage() {
  const { data: user, isLoading, isError, refetch } = useGetCurrentUser();
  const update = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<User> | null>(null);
  if (isLoading) return <LoadingState rows={3} />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;
  const values = form ?? user;
  const set = (key: string, value: string) => setForm((prev) => ({ ...(prev ?? user), [key]: value }));
  const setList = (key: string, value: string) => setForm((prev) => ({ ...(prev ?? user), [key]: value.split(',').map((item) => item.trim()).filter(Boolean) }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        data: {
          headline: values.headline,
          bio: values.bio,
          company: values.company,
          jobRole: values.jobRole,
          skills: values.skills,
          interests: values.interests,
          helpWith: values.helpWith,
          lookingFor: values.lookingFor,
          avatarUrl: values.avatarUrl,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2400);
        },
      },
    );
  };
  const handleLogout = () => {
    clearAuthSession();
    setLocation('/login');
  };
  return <>
    <PageTitle eyebrow="Your profile" title="Make it easy to find you." detail="A little context turns a directory listing into a useful invitation." action={saved ? <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500"><Check className="h-4 w-4" />Changes saved</span> : undefined} />
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <div className="surface h-fit rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar user={values} size="lg" />
          <div>
            <h2 className="font-bold text-foreground">{user.fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{roleLabels[user.role] ?? user.role}</span>
              <span className="text-xs text-muted-foreground">· {user.campus}</span>
            </div>
            {user.graduationYear && <p className="mt-1 text-[11px] font-medium text-muted-foreground">Class of {user.graduationYear}</p>}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Field
            id="profile-avatar-url"
            label="Avatar image URL"
            type="url"
            value={values.avatarUrl ?? ''}
            onChange={(e) => set('avatarUrl', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Paste a public link or leave blank for your initials.</p>
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Profile strength</span>
            <span className="font-bold text-accent">Active & Verified</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 w-3/4 rounded-full bg-accent" />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <button type="button" data-testid="button-profile-logout" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors active:scale-95">
            <LogOut className="h-4 w-4" />
            <span>Sign out of account</span>
          </button>
        </div>
      </div>

      <div className="surface rounded-xl border border-border p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground">What should people know?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Keep it specific. Your profile is your first hello.</p>
        <div className="mt-6 space-y-5">
          <Field id="profile-headline" label="Headline" value={values.headline ?? ''} onChange={(e) => set('headline', e.target.value)} placeholder="What are you working on right now?" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-foreground">About you</span>
            <textarea data-testid="textarea-profile-bio" value={values.bio ?? ''} onChange={(e) => set('bio', e.target.value)} rows={5} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-accent-foreground" placeholder="A short, human introduction..." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-company" label="Company / lab" value={values.company ?? ''} onChange={(e) => set('company', e.target.value)} />
            <Field id="profile-job-role" label="Role / title" value={values.jobRole ?? ''} onChange={(e) => set('jobRole', e.target.value)} />
          </div>
          <Field id="profile-skills" label="Skills" value={values.skills?.join(', ') ?? ''} onChange={(e) => setList('skills', e.target.value)} placeholder="Separate skills with commas (e.g. React, Python, ML)" />
          <Field id="profile-interests" label="Interests" value={values.interests?.join(', ') ?? ''} onChange={(e) => setList('interests', e.target.value)} placeholder="Separate interests with commas (e.g. AI, Robotics, Startups)" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-help-with" label="I can help with" value={values.helpWith?.join(', ') ?? ''} onChange={(e) => setList('helpWith', e.target.value)} placeholder="e.g. Mock interviews, Hackathons" />
            <Field id="profile-looking-for" label="I am looking for" value={values.lookingFor?.join(', ') ?? ''} onChange={(e) => setList('lookingFor', e.target.value)} placeholder="e.g. Research partner, Mentor" />
          </div>
          <div className="flex justify-end pt-2">
            <Button data-testid="button-save-profile" type="submit" disabled={update.isPending}>
              {update.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </div>
      </div>
    </form>
  </>;
}

function AdminPage() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data, isLoading, isError, refetch } = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), enabled: user?.role === 'admin' } });
  if (userLoading || isLoading) return <LoadingState rows={4} />;
  if (!user || user.role !== 'admin') return <EmptyState icon={ShieldCheck} title="This workspace is restricted" detail="Admin console access is limited to platform administrators." action={<Link href="/dashboard" className="text-sm font-bold text-accent">Return to your dashboard</Link>} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return <>
    <PageTitle eyebrow="Platform operations" title="Keep the commons healthy." detail="A focused view of the people and activity shaping Amrita Connect." />
    <section className="mb-6 rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mono text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">Administrator access</div><h2 className="mt-2 text-xl font-bold tracking-[-.03em] text-foreground">A calm control room for a trusted network.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review the network at a glance before moving into verification, reports, and community operations.</p></div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent"><BarChart3 className="h-5 w-5" /></div>
      </div>
    </section>
    <div data-testid="admin-summary-grid" className="grid gap-4 sm:grid-cols-3">
      <Metric label="Members" value={data.users.toLocaleString()} detail="Across every campus" />
      <Metric label="Opportunities" value={data.opportunities.toLocaleString()} detail="Published opportunities" accent />
      <Metric label="Events" value={data.events.toLocaleString()} detail="On the shared calendar" />
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="surface rounded-xl border border-border p-5 sm:p-6"><SectionHeader eyebrow="Next operational views" title="Keep building the trust layer" /><div className="mt-5 space-y-3">{[['Verification queue', 'Review official identity signals and keep member badges meaningful.'], ['Reports & moderation', 'Give members a clear, accountable path to report concerns.'], ['Engagement analytics', 'Understand which campuses, roles, and pathways are finding value.']].map(([title, detail]) => <div key={title} className="flex gap-3 rounded-lg border border-border bg-card p-4"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><ShieldCheck className="h-4 w-4" /></div><div><h3 className="text-sm font-bold text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}</div></section>
      <section className="surface rounded-xl border border-border p-5 sm:p-6"><SectionHeader eyebrow="Quick access" title="Review the public network" /><div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{[['People', '/people', Users], ['Opportunities', '/opportunities', BriefcaseBusiness], ['Events', '/events', CalendarDays]].map(([label, href, Icon]) => <Link key={label as string} href={href as string} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-accent"><Icon className="h-4 w-4" /></span><span className="text-sm font-bold text-foreground">{label as string}</span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>)}</div></section>
    </div>
  </>;
}

function NotFound() { return <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><div className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">404 / Off the map</div><h1 className="mt-4 text-5xl font-bold tracking-[-.06em] text-foreground">This path is not connected.</h1><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent">Return home <ArrowRight className="h-4 w-4" /></Link></div></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) { const { data: user, isLoading } = useGetCurrentUser(); const [, setLocation] = useLocation(); if (isLoading) return <AppShell><LoadingState rows={4} /></AppShell>; if (!user) { setLocation('/login'); return null; } return <AppShell user={user}>{children}</AppShell>; }
function RoutedErrorBoundary({ children }: { children: React.ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function Router() { return <RoutedErrorBoundary><Switch><Route path="/" component={Landing} /><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} /><Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route><Route path="/feed"><ProtectedRoute><FeedPage /></ProtectedRoute></Route><Route path="/connections"><ProtectedRoute><ConnectionsPage /></ProtectedRoute></Route><Route path="/messages"><ProtectedRoute><MessagesPage /></ProtectedRoute></Route><Route path="/messages/:recipientId"><ProtectedRoute><MessagesPage /></ProtectedRoute></Route><Route path="/admin"><ProtectedRoute><AdminPage /></ProtectedRoute></Route><Route path="/profile"><ProtectedRoute><ProfilePage /></ProtectedRoute></Route><Route path="/people"><ProtectedRoute><PeoplePage /></ProtectedRoute></Route><Route path="/people/:id"><ProtectedRoute><PublicProfilePage /></ProtectedRoute></Route><Route path="/mentorship"><ProtectedRoute><MentorshipPage /></ProtectedRoute></Route><Route path="/collaborations"><ProtectedRoute><CollaborationsPage /></ProtectedRoute></Route><Route path="/opportunities"><ProtectedRoute><OpportunitiesPage /></ProtectedRoute></Route><Route path="/events"><ProtectedRoute><EventsPage /></ProtectedRoute></Route><Route path="/notifications"><ProtectedRoute><NotificationsPage /></ProtectedRoute></Route><Route component={NotFound} /></Switch></RoutedErrorBoundary>; }

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
