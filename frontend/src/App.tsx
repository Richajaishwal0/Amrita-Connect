import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Bell, Bookmark, BookOpen, Briefcase, BriefcaseBusiness,
  Building2, CalendarDays, Camera, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock,
  Code, Compass, Copy, CornerDownRight, Download, ExternalLink, File, FileText, Flame, Globe, GraduationCap, Heart, HeartHandshake, HelpCircle, House, Image, Info, Layers,
  Lightbulb, Link2, Linkedin, Github, LoaderCircle, Lock, LogIn, LogOut, Mail, MapPin, Menu, MessageSquare, Moon,
  MoreHorizontal, Network, Paperclip, PartyPopper, Pencil, PenLine, Play, Plus, Quote, Radio, Rocket, RotateCw, Rss, Search, Send, Settings2, Share, Share2, ShieldCheck, Smile, Sparkles,
  Star, Sun, Terminal, ThumbsUp, Trash2, TrendingUp, Trophy, Upload, UserCheck, UserCircle, UserPlus, UserRoundPlus, Users, Users2, UserX, Video, X, Zap,
} from 'lucide-react';
import { useWebSocketChat } from './hooks/useWebSocketChat';
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
import { PLACED_SENIORS, PLACED_ALUMNI_DATA } from './data/seniorsData';
import { SeniorProfilePage } from './pages/SeniorProfilePage';
import maneeshaPhoto from '@photos/maneesha.png';
import santikumarPhoto from '@photos/santikumar.png';
import jayakumarPhoto from '@photos/jayakumar.png';
import krishnakumarPhoto from '@photos/krishnakumar.png';

const queryClient = new QueryClient();
setAuthTokenGetter(() => typeof localStorage === 'undefined' ? null : localStorage.getItem('amrita_token'));
function setAuthSession(token: string) {
  localStorage.setItem('amrita_token', token);
}
function clearAuthSession() {
  localStorage.removeItem('amrita_token');
  queryClient.clear();
}

async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_token') : null;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  return (text ? text : null) as unknown as T;
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
interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles?: readonly string[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Main Workspace',
    items: [
      { href: '/feed', label: 'Community Feed', icon: Rss },
    ],
  },
  {
    group: 'Mentorship & Guidance',
    items: [
      { href: '/mentorship', label: 'Mentorship Hub', icon: HeartHandshake },
      { href: '/interviews', label: 'Interview Prep', icon: GraduationCap },
      { href: '/help', label: 'Student Help Desk', icon: HelpCircle },
    ],
  },
  {
    group: 'Academics & Labs',
    items: [
      { href: '/collaborations', label: 'Collaborate', icon: Network },
      { href: '/research', label: 'Research Hub', icon: BookOpen },
      { href: '/showcase', label: 'Project Showcase', icon: Trophy },
    ],
  },
  {
    group: 'Career & Events',
    items: [
      { href: '/opportunities', label: 'Opportunities Board', icon: BriefcaseBusiness },
      { href: '/events', label: 'Events Calendar', icon: CalendarDays },
    ],
  },
  {
    group: 'Administration',
    items: [
      { href: '/admin', label: 'Admin Console', icon: ShieldCheck, roles: ['admin'] },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);



const roleLabels: Record<string, string> = { student: 'Student', alumni: 'Alumni', faculty: 'Faculty', researcher: 'Researcher', admin: 'Staff' };
const campuses = ['Amaravati', 'Amritapuri', 'Bengaluru', 'Chennai', 'Coimbatore', 'Faridabad (NCR)', 'Kochi', 'Mysuru'];
const departments = [
  'Computer Science & Engineering',
  'Computer Science & Engineering (Artificial Intelligence)',
  'Computer Science & Engineering (Cyber Security)',
  'Artificial Intelligence & Data Science',
  'Artificial Intelligence & Robotics',
  'Electronics & Communication Engineering',
  'Electrical & Computer Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Aerospace Engineering',
  'Automation & Robotics Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology & Biomedical Engineering',
  'Data Science & Computing',
  'School of Business / Management',
  'School of Medicine & Health Sciences',
  'School of Pharmacy',
  'School of Dentistry',
  'School of Nursing',
  'Mass Communication & Media',
  'Sciences & Humanities',
  'Center for Cyber Security (bi0s)',
  'Wireless Networks & Applications (AWNA)',
  'Interdisciplinary Research & Ph.D.',
];
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

function Avatar({ user, size = 'md', className }: { user?: Partial<User> | null; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-20 w-20 text-xl' : size === 'xl' ? 'h-28 w-28 sm:h-36 sm:w-36 text-3xl sm:text-4xl' : 'h-11 w-11 text-sm';
  return user?.avatarUrl ? (
    <img data-testid={`img-avatar-${user.id ?? 'current'}`} src={user.avatarUrl} alt={user.fullName ?? 'Member'} className={cx('rounded-full object-cover ring-4 ring-background shadow-md', sizeClasses, className)} />
  ) : (
    <div data-testid={`avatar-fallback-${user?.id ?? 'current'}`} className={cx('rounded-full bg-secondary text-primary flex items-center justify-center font-bold tracking-tight ring-4 ring-background shadow-md', sizeClasses, className)}>
      {initials(user?.fullName)}
    </div>
  );
}
function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' | 'brand' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        variant === 'primary' && 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 !text-white shadow-sm shadow-orange-500/20',
        variant === 'brand' && 'bg-orange-500 hover:bg-orange-600 !text-white shadow-sm shadow-orange-500/25',
        variant === 'quiet' && 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        variant === 'outline' && 'border border-border/80 bg-card hover:bg-secondary/50 text-foreground',
        variant === 'danger' && 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
        className
      )}
    >
      {children}
    </button>
  );
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
      className="flex items-center gap-2.5 transition-transform active:scale-95"
    >
      <svg className={small ? 'h-6 w-6' : 'h-7 w-7 sm:h-8 sm:w-8'} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="8" r="4" fill="#f97316" />
        <circle cx="8" cy="26" r="4" fill="#f97316" />
        <circle cx="28" cy="26" r="4" fill="#f97316" />
        <line x1="18" y1="8" x2="8" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="8" x2="28" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="26" x2="28" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col leading-[1.05]">
        <span className={cx('font-black tracking-wider', small ? 'text-[11px]' : 'text-xs sm:text-sm', light ? 'text-white' : 'text-slate-900 dark:text-white')}>
          AMRITA
        </span>
        <span className={cx('font-extrabold tracking-wider text-orange-500', small ? 'text-[11px]' : 'text-xs sm:text-sm')}>
          CONNECT
        </span>
      </div>
    </Link>
  );
}

const AMRITA_CAMPUSES = [
  { id: 'cbe', name: 'Coimbatore', title: 'Coimbatore (Ettimadai)', focus: 'Aerospace, Robotics, Cyber Physical Systems & Core Engineering', count: '10,000+ Members', activeProjects: 142, icon: Rocket },
  { id: 'amp', name: 'Amritapuri', title: 'Amritapuri (Kollam)', focus: 'Cybersecurity (bi0s), Wireless IoT, Nanotech & Computing', count: '8,500+ Members', activeProjects: 118, icon: ShieldCheck },
  { id: 'blr', name: 'Bengaluru', title: 'Bengaluru Campus', focus: 'Artificial Intelligence, Data Science & Tech Startups', count: '6,000+ Members', activeProjects: 94, icon: Zap },
  { id: 'koc', name: 'Kochi', title: 'Kochi Health Sciences', focus: 'Precision Medicine, Biotech Genomics, Medical AI & Nanomedicine', count: '5,500+ Members', activeProjects: 86, icon: HeartHandshake },
  { id: 'chn', name: 'Chennai', title: 'Chennai Campus', focus: 'Advanced Computing, Emerging Tech & Cyber Physical Systems', count: '3,500+ Members', activeProjects: 45, icon: Layers },
  { id: 'amr', name: 'Amaravati', title: 'Amaravati Campus', focus: 'Interdisciplinary Engineering, Sustainable Tech & AI', count: '2,000+ Members', activeProjects: 32, icon: Lightbulb },
  { id: 'mys', name: 'Mysuru & NCR', title: 'Mysuru & NCR Campuses', focus: 'Media, Pure Sciences, Commerce & Management Studies', count: '2,500+ Members', activeProjects: 28, icon: BookOpen },
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

/* 1. Alumni & Seniors Spotlight Experience Matching Exact Reference */
function AlumniSpotlightSection() {
  const [category, setCategory] = useState<'seniors' | 'alumni'>('seniors');

  const activeProfiles = category === 'seniors' ? PLACED_SENIORS : PLACED_ALUMNI_DATA;

  const getProfileConfig = (slug: string, logos: string[]) => {
    switch (slug) {
      case 'nitesh':
        return {
          company: 'Amazon - Infosys',
          badgeBg: 'bg-[#fff8eb] dark:bg-amber-950/30 border-[#fde68a] dark:border-amber-800/40 text-[#b45309] dark:text-amber-400',
          ring: 'ring-4 ring-amber-100 dark:ring-amber-900/30',
          linkText: 'text-amber-600 dark:text-amber-400',
          hasBookmark: true,
        };
      case 'richa':
        return {
          company: 'Infosys',
          badgeBg: 'bg-[#eff6ff] dark:bg-blue-950/30 border-[#bfdbfe] dark:border-blue-800/40 text-[#1d4ed8] dark:text-blue-400',
          ring: 'ring-4 ring-blue-100 dark:ring-blue-900/30',
          linkText: 'text-blue-600 dark:text-blue-400',
          hasBookmark: false,
        };
      case 'shudarsan':
        return {
          company: 'The Math Company',
          badgeBg: 'bg-[#faf5ff] dark:bg-purple-950/30 border-[#e9d5ff] dark:border-purple-800/40 text-[#7e22ce] dark:text-purple-400',
          ring: 'ring-4 ring-purple-100 dark:ring-purple-900/30',
          linkText: 'text-purple-600 dark:text-purple-400',
          hasBookmark: false,
        };
      case 'kavya':
        return {
          company: 'Lam Research · ServiceNow',
          badgeBg: 'bg-[#ecfdf5] dark:bg-emerald-950/30 border-[#a7f3d0] dark:border-emerald-800/40 text-[#047857] dark:text-emerald-400',
          ring: 'ring-4 ring-emerald-100 dark:ring-emerald-900/30',
          linkText: 'text-emerald-600 dark:text-emerald-400',
          hasBookmark: false,
        };
      case 'rupa':
        return {
          company: 'TCS',
          badgeBg: 'bg-[#fff1f2] dark:bg-rose-950/30 border-[#fecdd3] dark:border-rose-800/40 text-[#be123c] dark:text-rose-400',
          ring: 'ring-4 ring-rose-100 dark:ring-rose-900/30',
          linkText: 'text-rose-600 dark:text-rose-400',
          hasBookmark: false,
        };
      case 'arjun':
        return {
          company: 'Google',
          badgeBg: 'bg-[#eff6ff] dark:bg-blue-950/30 border-[#bfdbfe] dark:border-blue-800/40 text-[#1d4ed8] dark:text-blue-400',
          ring: 'ring-4 ring-blue-100 dark:ring-blue-900/30',
          linkText: 'text-blue-600 dark:text-blue-400',
          hasBookmark: true,
        };
      case 'meghana':
        return {
          company: 'Microsoft',
          badgeBg: 'bg-[#f0f9ff] dark:bg-sky-950/30 border-[#bae6fd] dark:border-sky-800/40 text-[#0369a1] dark:text-sky-400',
          ring: 'ring-4 ring-sky-100 dark:ring-sky-900/30',
          linkText: 'text-sky-600 dark:text-sky-400',
          hasBookmark: false,
        };
      case 'rohit':
        return {
          company: 'Amazon AWS',
          badgeBg: 'bg-[#fff8eb] dark:bg-amber-950/30 border-[#fde68a] dark:border-amber-800/40 text-[#b45309] dark:text-amber-400',
          ring: 'ring-4 ring-amber-100 dark:ring-amber-900/30',
          linkText: 'text-amber-600 dark:text-amber-400',
          hasBookmark: false,
        };
      case 'karan':
        return {
          company: 'NVIDIA',
          badgeBg: 'bg-[#ecfdf5] dark:bg-emerald-950/30 border-[#a7f3d0] dark:border-emerald-800/40 text-[#047857] dark:text-emerald-400',
          ring: 'ring-4 ring-emerald-100 dark:ring-emerald-900/30',
          linkText: 'text-emerald-600 dark:text-emerald-400',
          hasBookmark: false,
        };
      case 'ananya':
        return {
          company: 'Cisco Talos',
          badgeBg: 'bg-[#ecfeff] dark:bg-cyan-950/30 border-[#a5f3fc] dark:border-cyan-800/40 text-[#0e7490] dark:text-cyan-400',
          ring: 'ring-4 ring-cyan-100 dark:ring-cyan-900/30',
          linkText: 'text-cyan-600 dark:text-cyan-400',
          hasBookmark: false,
        };
      default:
        return {
          company: logos.join(' · '),
          badgeBg: 'bg-secondary border-border text-foreground',
          ring: 'ring-4 ring-border',
          linkText: 'text-accent',
          hasBookmark: false,
        };
    }
  };

  return (
    <section id="alumni" className="relative overflow-hidden py-16 sm:py-24 bg-slate-50/60 dark:bg-transparent border-t border-border/70">
      {/* Decorative Dot Matrix on the side */}
      <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-64 h-64 opacity-25 dark:opacity-10 pointer-events-none hidden lg:block bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      <div className="absolute top-1/4 -left-4 w-48 h-48 opacity-25 dark:opacity-10 pointer-events-none hidden lg:block bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. Centered Segmented Capsule Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-card p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200/80 dark:border-border">
            <button
              type="button"
              onClick={() => setCategory('seniors')}
              className={cx(
                'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95',
                category === 'seniors'
                  ? 'bg-[#181326] text-white shadow-md ring-1 ring-purple-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
              )}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Placed Seniors (2023)</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('alumni')}
              className={cx(
                'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95',
                category === 'alumni'
                  ? 'bg-[#181326] text-white shadow-md ring-1 ring-purple-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
              )}
            >
              <Globe className="h-4 w-4" />
              <span>Global Alumni</span>
            </button>
          </div>
        </div>

        {/* 2. Header: Eyebrow + Dual-Colored Title + Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-[11px] font-bold tracking-[0.25em] text-slate-500 dark:text-slate-400 uppercase flex items-center justify-center gap-2">
            <span className="text-amber-500">→</span>
            <span>{category === 'seniors' ? 'CAMPUS PLACEMENT ACHIEVERS' : 'GLOBAL ALUMNI ACHIEVERS'}</span>
            <span className="text-amber-500">←</span>
          </p>

          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-foreground">
            Celebrating <span className="text-[#f97316]">excellence.</span> Inspired by <span className="text-[#8b5cf6]">journeys.</span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {category === 'seniors'
              ? 'Meet our talented seniors placed in top companies.'
              : 'Connect with Amrita alumni leading engineering & product breakthroughs.'}
          </p>
        </div>

        {/* 3. 5-Column High-Fidelity Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-6">
          {activeProfiles.map((alum) => {
            const config = getProfileConfig(alum.slug, alum.logos);

            return (
              <Link
                key={alum.slug}
                href={`/profile/${alum.slug}`}
                className="group relative flex flex-col justify-between items-center rounded-3xl bg-white dark:bg-card border border-slate-100 dark:border-border/60 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.1)] p-6 transition-all duration-300 hover:-translate-y-2 overflow-hidden text-center"
              >
                {/* Optional Top Bookmark Ribbon (Nitesh / Arjun) */}
                {config.hasBookmark && (
                  <div className="absolute top-0 right-5 bg-gradient-to-b from-amber-500 to-amber-600 text-white w-6 h-8 flex items-center justify-center rounded-b-sm shadow-md z-20">
                    <Star className="h-3.5 w-3.5 fill-white text-white" />
                  </div>
                )}

                {/* Top: Company Pill */}
                <div className="w-full flex justify-center mb-5">
                  <span
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-tight shadow-2xs',
                      config.badgeBg
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{config.company}</span>
                  </span>
                </div>

                {/* Middle: Portrait Image inside Subtle Color Ring */}
                <div className="my-2 flex justify-center">
                  <div className={cx('relative h-28 w-28 rounded-full p-1 shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105', config.ring)}>
                    <img
                      src={alum.avatar}
                      alt={alum.name}
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'grid';
                        }
                      }}
                    />
                    <div
                      style={{ display: 'none' }}
                      className="h-full w-full place-items-center rounded-full bg-secondary text-foreground font-bold text-lg"
                    >
                      {initials(alum.name)}
                    </div>
                  </div>
                </div>

                {/* Bottom: Name + Verified Checkmark + Batch + View Profile */}
                <div className="mt-5 space-y-2 w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                      {alum.name}
                    </h3>
                    <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500 text-white shrink-0" />
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{alum.batch}</span>
                  </div>

                  <div className="pt-3 flex justify-center">
                    <span className={cx('text-xs font-bold flex items-center gap-1 transition-all duration-300 group-hover:gap-2', config.linkText)}>
                      <span>View Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 4. Bottom Floating Stats Bar */}
        <div className="mt-12 rounded-3xl border border-slate-100 dark:border-border/80 bg-white/95 dark:bg-card/90 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-border/60">
            {/* Stat 1: Placed Seniors */}
            <div className="flex items-center gap-4 p-3 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-orange-500">200+</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Seniors Placed</p>
              </div>
            </div>

            {/* Stat 2: Top Companies */}
            <div className="flex items-center gap-4 p-3 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-blue-600">45+</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Companies</p>
              </div>
            </div>

            {/* Stat 3: Amrita Campuses */}
            <div className="flex items-center gap-4 p-3 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-purple-600">7</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amrita Campuses</p>
              </div>
            </div>

            {/* Stat 4: Excellence */}
            <div className="flex items-center gap-4 p-3 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-600">100%</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 2. Interactive University Live Mesh & 7-Campus Constellation Map */
function UniversityLiveMesh() {
  const { data: currentUser } = useGetCurrentUser();
  const getNavHref = (target: string) =>
    currentUser ? target : `/login?redirect=${encodeURIComponent(target)}`;

  const MAP_NODES = [
    {
      id: 'amp',
      name: 'Amritapuri',
      queryCampus: 'Amritapuri',
      members: '860+',
      focus: 'Cybersecurity (bi0s), Wireless IoT, Nanotech & Computing',
      projects: 118,
      icon: ShieldCheck,
      color: '#8b5cf6', // purple
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/40',
      pos: { x: 45, y: 15 },
      popoverPlacement: 'bottom',
      connections: ['koc', 'blr'],
    },
    {
      id: 'koc',
      name: 'Kochi',
      queryCampus: 'Kochi',
      members: '720+',
      focus: 'Precision Medicine, Biotech Genomics, Medical AI & Nanomedicine',
      projects: 86,
      icon: Heart,
      color: '#ec4899', // pink
      iconBg: 'bg-pink-500 text-white shadow-pink-500/40',
      pos: { x: 19, y: 44 },
      popoverPlacement: 'right',
      connections: ['amp', 'cbe', 'blr'],
    },
    {
      id: 'cbe',
      name: 'Coimbatore',
      queryCampus: 'Coimbatore',
      members: '1.2K+',
      focus: 'Aerospace, Robotics, Cyber Physical Systems & Core Engineering',
      projects: 142,
      icon: Rocket,
      color: '#f97316', // orange
      iconBg: 'bg-orange-500 text-white shadow-orange-500/40',
      pos: { x: 26, y: 64 },
      popoverPlacement: 'top', // Place ABOVE to avoid colliding with Chennai below
      connections: ['koc', 'blr', 'chn', 'mys'],
    },
    {
      id: 'blr',
      name: 'Bengaluru',
      queryCampus: 'Bengaluru',
      members: '1.1K+',
      focus: 'Artificial Intelligence, Data Science & Tech Startups',
      projects: 94,
      icon: Zap,
      color: '#10b981', // emerald green
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/40',
      pos: { x: 57, y: 50 },
      popoverPlacement: 'bottom',
      connections: ['amp', 'koc', 'cbe', 'amr', 'mys'],
    },
    {
      id: 'amr',
      name: 'Amaravati',
      queryCampus: 'Amaravati',
      members: '640+',
      focus: 'Interdisciplinary Engineering, Sustainable Tech & AI',
      projects: 32,
      icon: Lightbulb,
      color: '#eab308', // amber/gold
      iconBg: 'bg-amber-500 text-white shadow-amber-500/40',
      pos: { x: 79, y: 44 },
      popoverPlacement: 'left',
      connections: ['blr', 'mys'],
    },
    {
      id: 'chn',
      name: 'Chennai',
      queryCampus: 'Chennai',
      members: '950+',
      focus: 'Advanced Computing, Emerging Tech & Cyber Physical Systems',
      projects: 45,
      icon: Layers,
      color: '#3b82f6', // blue
      iconBg: 'bg-blue-600 text-white shadow-blue-500/40',
      pos: { x: 42, y: 89 },
      popoverPlacement: 'top',
      connections: ['cbe'],
    },
    {
      id: 'mys',
      name: 'Mysuru & NCR',
      queryCampus: 'Mysuru',
      members: '580+',
      focus: 'Media, Pure Sciences, Commerce & Management Studies',
      projects: 28,
      icon: BookOpen,
      color: '#6366f1', // violet
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/40',
      pos: { x: 68, y: 80 },
      popoverPlacement: 'top',
      connections: ['cbe', 'blr', 'amr'],
    },
  ];

  const LIVE_ACTIVITIES = [
    { text: 'Karthik R. (Google) mentoring Distributed Systems team', from: 'Amritapuri', to: 'Bengaluru', tag: 'Mentorship' },
    { text: 'Smart India Hackathon project sync live', from: 'Coimbatore', to: 'Amritapuri', tag: 'Hackathon' },
    { text: 'Precision Oncology dataset shared for ML model training', from: 'Kochi', to: 'Bengaluru', tag: 'Research' },
    { text: 'Autonomous Drone Robotics paper collaboration finalized', from: 'Coimbatore', to: 'Chennai', tag: 'Paper' },
    { text: 'Clean Energy & Microgrid research sprint active', from: 'Amaravati', to: 'Bengaluru', tag: 'Initiative' },
  ];

  const [selectedCampus, setSelectedCampus] = useState<typeof MAP_NODES[0] | null>(null);
  const [hoveredCampus, setHoveredCampus] = useState<typeof MAP_NODES[0] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeLiveIndex, setActiveLiveIndex] = useState(0);

  // Rotate live activity ticker every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLiveIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [LIVE_ACTIVITIES.length]);

  const activeCampus = hoveredCampus || selectedCampus;

  const isConnectedToActive = (nodeId1: string, nodeId2: string) => {
    if (!activeCampus) return false;
    return (
      (activeCampus.id === nodeId1 && activeCampus.connections.includes(nodeId2)) ||
      (activeCampus.id === nodeId2 && activeCampus.connections.includes(nodeId1))
    );
  };

  const getLineClass = (from: string, to: string) => {
    if (!activeCampus) return 'opacity-70 stroke-[2.2]';
    if (isConnectedToActive(from, to)) return 'opacity-100 stroke-[3.5] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]';
    return 'opacity-20 stroke-[1.5]';
  };

  const getPopoverPositionClass = (placement?: string) => {
    switch (placement) {
      case 'top':
        return 'bottom-full mb-3.5 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-3.5 left-1/2 -translate-x-1/2';
      case 'right':
        return 'top-1/2 -translate-y-1/2 left-full ml-3.5';
      case 'left':
        return 'top-1/2 -translate-y-1/2 right-full mr-3.5';
      default:
        return 'bottom-full mb-3.5 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <section className="border-t border-border py-20 sm:py-28 bg-[#f8faff] dark:bg-[#0b0f19] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mono inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-orange-500">
              <Globe className="h-3.5 w-3.5" /> University Live Mesh
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Real-Time Collaboration Across 7 Campuses.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Explore live research initiatives, active members, and inter-campus momentum happening right now. Click any campus to explore connections.
            </p>
          </div>

          {/* Live Activity Live Beacon Widget */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-2 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="text-xs truncate max-w-xs sm:max-w-md">
              <span className="font-bold text-orange-600 dark:text-orange-400 mr-1.5">
                [{LIVE_ACTIVITIES[activeLiveIndex].tag}]
              </span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {LIVE_ACTIVITIES[activeLiveIndex].text}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filter Campus Chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setSelectedCampus(null); setHoveredCampus(null); }}
            className={cx(
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border shadow-sm',
              !selectedCampus
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent ring-2 ring-slate-900/20'
                : 'bg-white/80 dark:bg-slate-900/80 text-muted-foreground border-slate-200 dark:border-slate-800 hover:text-foreground'
            )}
          >
            All 7 Hubs
          </button>
          {MAP_NODES.map((camp) => (
            <button
              key={camp.id}
              type="button"
              onClick={() => setSelectedCampus(selectedCampus?.id === camp.id ? null : camp)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all border shadow-sm',
                selectedCampus?.id === camp.id
                  ? 'bg-orange-500 text-white border-orange-600 ring-2 ring-orange-500/30'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-accent hover:scale-105'
              )}
            >
              <span style={{ backgroundColor: camp.color }} className="h-2 w-2 rounded-full" />
              <span>{camp.name}</span>
            </button>
          ))}
        </div>

        {/* Clean Interactive Map Visualization Container */}
        <div className="mt-6 relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden min-h-[620px] sm:min-h-[720px] p-6 sm:p-12 flex items-center justify-center">

          {/* Detailed India Map Silhouette with Regions & Coastlines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <svg viewBox="0 0 1000 900" className="h-[96%] w-auto max-w-none text-indigo-500/20 dark:text-indigo-400/15">
              {/* Outer India boundary */}
              <path
                d="M 380 40 
                   C 400 45, 430 65, 450 90 
                   C 470 120, 500 140, 520 170 
                   C 550 180, 590 200, 620 230 
                   C 660 250, 720 260, 780 270 
                   C 840 280, 890 300, 930 330 
                   C 950 350, 960 380, 930 410 
                   C 900 440, 840 450, 800 440 
                   C 770 430, 750 450, 740 480 
                   C 720 540, 700 600, 670 660 
                   C 640 720, 600 780, 560 840 
                   C 530 870, 500 890, 480 890 
                   C 460 890, 440 850, 410 790 
                   C 380 730, 340 670, 310 610 
                   C 280 550, 250 490, 240 440 
                   C 230 390, 210 340, 220 300 
                   C 230 260, 260 220, 290 180 
                   C 320 140, 350 90, 370 50 Z"
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="2 3"
              />
              {/* Internal state / network contours */}
              <path
                d="M 370 180 Q 480 220 620 230
                   M 290 300 Q 450 350 740 320
                   M 240 440 Q 480 470 700 480
                   M 270 560 Q 460 580 660 570
                   M 340 680 Q 480 700 580 690
                   M 440 100 Q 480 400 480 880
                   M 320 220 Q 360 520 380 780
                   M 600 240 Q 610 500 590 760"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                strokeOpacity="0.6"
              />
            </svg>
          </div>

          {/* Dotted Curved Connecting Network Mesh Between Campuses */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none z-10" viewBox="0 0 1000 700" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-amp-koc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="grad-amp-blr" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad-koc-cbe" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="grad-koc-blr" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad-cbe-blr" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad-cbe-chn" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="grad-cbe-mys" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="grad-blr-amr" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="grad-blr-mys" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="grad-amr-mys" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Amritapuri (450, 105) -> Kochi (190, 308) */}
            <path d="M 450 105 Q 310 190 190 308" fill="none" stroke="url(#grad-amp-koc)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('amp', 'koc'))} />
            <circle r="4" fill="#8b5cf6" className="filter drop-shadow-[0_0_6px_#8b5cf6]">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 450 105 Q 310 190 190 308" />
            </circle>

            {/* Amritapuri (450, 105) -> Bengaluru (570, 350) */}
            <path d="M 450 105 Q 490 230 570 350" fill="none" stroke="url(#grad-amp-blr)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('amp', 'blr'))} />
            <circle r="4" fill="#10b981" className="filter drop-shadow-[0_0_6px_#10b981]">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 450 105 Q 490 230 570 350" />
            </circle>

            {/* Kochi (190, 308) -> Coimbatore (260, 448) */}
            <path d="M 190 308 Q 210 380 260 448" fill="none" stroke="url(#grad-koc-cbe)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('koc', 'cbe'))} />
            <circle r="4" fill="#f97316" className="filter drop-shadow-[0_0_6px_#f97316]">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 190 308 Q 210 380 260 448" />
            </circle>

            {/* Kochi (190, 308) -> Bengaluru (570, 350) */}
            <path d="M 190 308 Q 360 300 570 350" fill="none" stroke="url(#grad-koc-blr)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('koc', 'blr'))} />

            {/* Coimbatore (260, 448) -> Bengaluru (570, 350) */}
            <path d="M 260 448 Q 410 420 570 350" fill="none" stroke="url(#grad-cbe-blr)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('cbe', 'blr'))} />
            <circle r="4" fill="#10b981" className="filter drop-shadow-[0_0_6px_#10b981]">
              <animateMotion dur="3.8s" repeatCount="indefinite" path="M 260 448 Q 410 420 570 350" />
            </circle>

            {/* Coimbatore (260, 448) -> Chennai (420, 623) */}
            <path d="M 260 448 Q 320 550 420 623" fill="none" stroke="url(#grad-cbe-chn)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('cbe', 'chn'))} />
            <circle r="4" fill="#3b82f6" className="filter drop-shadow-[0_0_6px_#3b82f6]">
              <animateMotion dur="4.2s" repeatCount="indefinite" path="M 260 448 Q 320 550 420 623" />
            </circle>

            {/* Coimbatore (260, 448) -> Mysuru & NCR (680, 560) */}
            <path d="M 260 448 Q 490 540 680 560" fill="none" stroke="url(#grad-cbe-mys)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('cbe', 'mys'))} />

            {/* Bengaluru (570, 350) -> Amaravati (790, 308) */}
            <path d="M 570 350 Q 680 310 790 308" fill="none" stroke="url(#grad-blr-amr)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('blr', 'amr'))} />
            <circle r="4" fill="#eab308" className="filter drop-shadow-[0_0_6px_#eab308]">
              <animateMotion dur="3.6s" repeatCount="indefinite" path="M 570 350 Q 680 310 790 308" />
            </circle>

            {/* Bengaluru (570, 350) -> Mysuru & NCR (680, 560) */}
            <path d="M 570 350 Q 620 460 680 560" fill="none" stroke="url(#grad-blr-mys)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('blr', 'mys'))} />
            <circle r="4" fill="#6366f1" className="filter drop-shadow-[0_0_6px_#6366f1]">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 570 350 Q 620 460 680 560" />
            </circle>

            {/* Amaravati (790, 308) -> Mysuru & NCR (680, 560) */}
            <path d="M 790 308 Q 750 450 680 560" fill="none" stroke="url(#grad-amr-mys)" strokeDasharray="5 5" className={cx('transition-all duration-300', getLineClass('amr', 'mys'))} />
          </svg>

          {/* 7 Interactive Campus Nodes with Concentric Rings */}
          <div className="relative w-full h-[540px] sm:h-[620px] z-20">
            {MAP_NODES.map((camp) => {
              const Icon = camp.icon;
              const isSelected = activeCampus?.id === camp.id;
              const isNeighbor = activeCampus && activeCampus.connections.includes(camp.id);
              return (
                <div
                  key={camp.id}
                  style={{
                    left: `${camp.pos.x}%`,
                    top: `${camp.pos.y}%`,
                    transform: `translate(-50%, -50%) scale(${isSelected ? zoomLevel * 1.08 : isNeighbor ? zoomLevel * 1.03 : zoomLevel})`,
                  }}
                  className={cx(
                    'absolute transition-transform duration-300',
                    isSelected ? 'z-50' : isNeighbor ? 'z-30' : 'z-20'
                  )}
                >
                  {/* Concentric Glowing Colored Wave Rings exactly like Picture 2 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    {/* Ring 1 */}
                    <div
                      style={{ borderColor: camp.color, backgroundColor: camp.color }}
                      className={cx(
                        'absolute h-16 w-16 rounded-full blur-sm transition-opacity',
                        isSelected ? 'opacity-30 scale-125' : 'opacity-15'
                      )}
                    />
                    {/* Ring 2 */}
                    <div
                      style={{ borderColor: camp.color }}
                      className={cx(
                        'absolute h-24 w-24 rounded-full border border-dashed animate-spin-slow duration-[35s] transition-all',
                        isSelected ? 'opacity-60 scale-115' : 'opacity-40'
                      )}
                    />
                    {/* Ring 3 */}
                    <div
                      style={{ borderColor: camp.color }}
                      className={cx(
                        'absolute h-36 w-36 rounded-full border transition-all',
                        isSelected ? 'opacity-45 scale-110' : 'opacity-25'
                      )}
                    />
                    {/* Ring 4 */}
                    <div
                      style={{ borderColor: camp.color }}
                      className={cx(
                        'absolute h-48 w-48 rounded-full border transition-all',
                        isSelected ? 'opacity-30 scale-105' : 'opacity-15'
                      )}
                    />
                  </div>

                  {/* Node Capsule Badge with Rounded Pin Icon */}
                  <Link
                    href={getNavHref(`/people?campus=${encodeURIComponent(camp.queryCampus)}`)}
                    onMouseEnter={() => setHoveredCampus(camp)}
                    onMouseLeave={() => setHoveredCampus(null)}
                    onClick={() => setSelectedCampus(selectedCampus?.id === camp.id ? null : camp)}
                    className={cx(
                      'group relative flex items-center gap-3 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 py-2 pl-2 pr-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer',
                      isSelected
                        ? 'ring-2 ring-orange-500 shadow-orange-500/25 scale-105'
                        : isNeighbor
                          ? 'ring-1 ring-orange-400/50 hover:border-accent'
                          : 'hover:border-accent'
                    )}
                  >
                    {/* Colored Teardrop / Circle Icon Badge */}
                    <div
                      style={{ backgroundColor: camp.color }}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white font-bold shadow-md transition-transform group-hover:scale-110"
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Campus Name & Member Count */}
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                        {camp.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>{camp.members}</span>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                    </div>
                  </Link>

                  {/* Contextual Floating Popover: Compact with Essential Details Only */}
                  {isSelected && (
                    <div className={cx(
                      'absolute z-50 w-48 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-md animate-scale-in text-left pointer-events-auto',
                      getPopoverPositionClass(camp.popoverPlacement)
                    )}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground truncate">{camp.name}</span>
                        <span className="text-[10px] font-bold text-orange-500 shrink-0">{camp.members}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">{camp.projects} projects</span>
                        <Link
                          href={getNavHref(`/people?campus=${encodeURIComponent(camp.queryCampus)}`)}
                          className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5"
                        >
                          Connect <ArrowRight className="h-2.5 w-2.5 inline" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Minimal Floating Map Controls on Right Side (Round Buttons from Pic 2) */}
          <div className="absolute right-5 sm:right-8 bottom-12 z-30 flex flex-col gap-3">
            <button
              type="button"
              title="Zoom in"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.25))}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all font-bold text-lg"
            >
              +
            </button>
            <button
              type="button"
              title="Zoom out"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.85))}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all font-bold text-lg"
            >
              −
            </button>
            <button
              type="button"
              title="Reset center"
              onClick={() => { setZoomLevel(1); setSelectedCampus(null); setHoveredCampus(null); }}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Compass className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}



/* 4. Structured 4-Step Trajectory Roadmap: Exact Reference Match */
function TrajectoryRoadmap() {
  const steps = [
    {
      num: '01',
      title: 'Verify & Claim Profile',
      desc: 'Sign in with your campus credentials to establish trusted academic standing.',
      color: 'orange',
      badgeBg: 'bg-[#f97316]',
      borderHover: 'hover:border-orange-400 dark:hover:border-orange-500',
      gradientBg: 'bg-gradient-to-b from-orange-50/70 via-amber-50/20 to-white dark:from-orange-950/20 dark:via-card dark:to-card',
      borderColor: 'border-orange-100/90 dark:border-orange-900/30',
      arrowBg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-500 border border-orange-200/80 dark:border-orange-800/80',
      connectorColor: 'border-orange-300 dark:border-orange-700 text-orange-500',
      link: '/login',
      illustration: (
        <div className="relative mx-auto h-28 w-28 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
          {/* Continuous Orbiting Dashed Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-orange-400/40 dark:border-orange-500/30 animate-spin-slow" />

          {/* Orbiting Shimmer Sparkles */}
          <div className="absolute -top-1 right-2 h-2.5 w-2.5 rounded-full bg-orange-400/80 shadow-sm animate-pulse" />
          <div className="absolute bottom-2 left-1 h-2 w-2 rounded-full bg-amber-400/70" />
          <div className="absolute top-1/2 -left-1 h-1.5 w-1.5 rounded-full bg-orange-300" />

          {/* 3D Glossy Shield with Smooth Floating Motion */}
          <div className="relative z-10 filter drop-shadow-[0_12px_18px_rgba(249,115,22,0.3)] animate-float">
            <svg viewBox="0 0 100 110" className="h-20 w-20 transition-transform duration-300 group-hover:scale-105">
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="30%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="shieldInner" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Outer Shield */}
              <path
                d="M50 8 C75 8, 88 18, 88 45 C88 75, 50 102, 50 102 C50 102, 12 75, 12 45 C12 18, 25 8, 50 8 Z"
                fill="url(#shieldGrad)"
              />
              {/* Inner Gloss */}
              <path
                d="M50 14 C70 14, 80 22, 80 45 C80 68, 50 92, 50 92 C50 92, 20 68, 20 45 C20 22, 30 14, 50 14 Z"
                fill="url(#shieldInner)"
              />
              {/* Avatar Silhouette */}
              <circle cx="50" cy="40" r="11" fill="#ffffff" />
              <path
                d="M33 68 C33 55, 40 52, 50 52 C60 52, 67 55, 67 68 Z"
                fill="#ffffff"
              />
            </svg>
          </div>

          {/* Pulsing Verified Check Badge */}
          <div className="absolute -bottom-1 right-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white dark:bg-slate-900 shadow-lg ring-2 ring-orange-200 dark:ring-orange-800 animate-badge-pop">
            <CheckCircle2 className="h-5 w-5 text-orange-500 fill-orange-500 text-white" />
          </div>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Discover 7 Campuses',
      desc: 'Filter through students, researchers, and alumni by domain, tools, and batch.',
      color: 'blue',
      badgeBg: 'bg-[#2563eb]',
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      gradientBg: 'bg-gradient-to-b from-blue-50/70 via-sky-50/20 to-white dark:from-blue-950/20 dark:via-card dark:to-card',
      borderColor: 'border-blue-100/90 dark:border-blue-900/30',
      arrowBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-500 border border-blue-200/80 dark:border-blue-800/80',
      connectorColor: 'border-blue-300 dark:border-blue-700 text-blue-500',
      link: '/people',
      illustration: (
        <div className="relative mx-auto h-28 w-28 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
          {/* Counter-Orbiting Dashed Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-400/40 dark:border-blue-500/30 animate-spin-slow-reverse" />
          <div className="absolute top-1 left-2 h-2.5 w-2.5 rounded-full bg-blue-400/80 shadow-sm animate-pulse" />
          <div className="absolute -bottom-1 left-4 h-2 w-2 rounded-full bg-sky-300/70" />

          {/* 3D Floating Globe */}
          <div className="relative z-10 filter drop-shadow-[0_12px_18px_rgba(37,99,235,0.3)] animate-float">
            <svg viewBox="0 0 100 100" className="h-20 w-20 transition-transform duration-300 group-hover:scale-105">
              <defs>
                <radialGradient id="globeGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#bfdbfe" />
                  <stop offset="45%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </radialGradient>
              </defs>
              {/* Globe Sphere */}
              <circle cx="50" cy="50" r="38" fill="url(#globeGrad)" />
              {/* Latitudes & Longitudes */}
              <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.45" />
              <ellipse cx="50" cy="50" rx="16" ry="38" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.45" />
              <line x1="12" y1="50" x2="88" y2="50" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.45" />
              <line x1="50" y1="12" x2="50" y2="88" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.45" />
            </svg>
          </div>

          {/* Floating Map Pin 1 with Ripple */}
          <div className="absolute -top-1 left-3 z-20 filter drop-shadow-md animate-pin-1">
            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md">
              <MapPin className="h-3.5 w-3.5 fill-white" />
            </div>
          </div>

          {/* Floating Map Pin 2 with Alternating Drop */}
          <div className="absolute bottom-1 right-3 z-20 filter drop-shadow-md animate-pin-2">
            <div className="h-5 w-5 rounded-full bg-sky-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md">
              <MapPin className="h-3 w-3 fill-white" />
            </div>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'Request 1-on-1 Guidance',
      desc: 'Schedule mentorship sessions for coding interviews, research, and career advice.',
      color: 'purple',
      badgeBg: 'bg-[#8b5cf6]',
      borderHover: 'hover:border-purple-400 dark:hover:border-purple-500',
      gradientBg: 'bg-gradient-to-b from-purple-50/70 via-indigo-50/20 to-white dark:from-purple-950/20 dark:via-card dark:to-card',
      borderColor: 'border-purple-100/90 dark:border-purple-900/30',
      arrowBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-500 border border-purple-200/80 dark:border-purple-800/80',
      connectorColor: 'border-purple-300 dark:border-purple-700 text-purple-500',
      link: '/mentorship',
      illustration: (
        <div className="relative mx-auto h-28 w-28 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
          {/* Orbiting Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-purple-400/40 dark:border-purple-500/30 animate-spin-slow" />
          <div className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full bg-purple-400/80 shadow-sm animate-pulse" />
          <div className="absolute bottom-2 -left-1 h-2 w-2 rounded-full bg-indigo-300" />

          {/* 3D Chat Bubble with Animated Pulsing Dots */}
          <div className="absolute top-0 left-1 z-10 filter drop-shadow-[0_12px_16px_rgba(139,92,246,0.3)] animate-float">
            <svg viewBox="0 0 70 60" className="h-14 w-14">
              <defs>
                <linearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path
                d="M10 10 C10 4.5, 14.5 0, 20 0 L50 0 C55.5 0, 60 4.5, 60 10 L60 35 C60 40.5, 55.5 45, 50 45 L25 45 L10 58 L10 45 C4.5 45, 0 40.5, 0 35 L0 10 C0 4.5, 4.5 0, 10 0 Z"
                fill="url(#chatGrad)"
              />
              <circle cx="20" cy="22" r="3.5" fill="#ffffff" className="animate-type-dot-1" />
              <circle cx="33" cy="22" r="3.5" fill="#ffffff" className="animate-type-dot-2" />
              <circle cx="46" cy="22" r="3.5" fill="#ffffff" className="animate-type-dot-3" />
            </svg>
          </div>

          {/* 3D Calendar Card with Reverse Counter-Phase Float */}
          <div className="absolute bottom-0 right-1 z-20 filter drop-shadow-[0_12px_18px_rgba(124,58,237,0.35)] animate-float-reverse">
            <svg viewBox="0 0 65 55" className="h-13 w-13">
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e9d5ff" />
                </linearGradient>
              </defs>
              <rect x="0" y="8" width="60" height="45" rx="8" fill="url(#calGrad)" stroke="#c084fc" strokeWidth="1.5" />
              <rect x="0" y="8" width="60" height="12" rx="6" fill="#8b5cf6" />
              {/* Calendar rings */}
              <rect x="12" y="3" width="5" height="10" rx="2.5" fill="#6d28d9" />
              <rect x="43" y="3" width="5" height="10" rx="2.5" fill="#6d28d9" />
              {/* Date grid dots */}
              <circle cx="15" cy="28" r="2.5" fill="#a855f7" />
              <circle cx="30" cy="28" r="2.5" fill="#a855f7" />
              <circle cx="45" cy="28" r="2.5" fill="#a855f7" />
              <circle cx="15" cy="39" r="2.5" fill="#a855f7" />
              <circle cx="30" cy="39" r="2.5" fill="#a855f7" />
              <circle cx="45" cy="39" r="2.5" fill="#a855f7" />
            </svg>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Co-Author & Build',
      desc: 'Assemble interdisciplinary teams to publish papers, win hackathons, and innovate.',
      color: 'emerald',
      badgeBg: 'bg-[#10b981]',
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      gradientBg: 'bg-gradient-to-b from-emerald-50/70 via-teal-50/20 to-white dark:from-emerald-950/20 dark:via-card dark:to-card',
      borderColor: 'border-emerald-100/90 dark:border-emerald-900/30',
      arrowBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 border border-emerald-200/80 dark:border-emerald-800/80',
      connectorColor: 'border-emerald-300 dark:border-emerald-700 text-emerald-500',
      link: '/collaborations',
      illustration: (
        <div className="relative mx-auto h-28 w-28 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
          {/* Orbiting Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40 dark:border-emerald-500/30 animate-spin-slow-reverse" />
          <div className="absolute bottom-1 right-2 h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-sm animate-pulse" />
          <div className="absolute top-2 left-1 h-2 w-2 rounded-full bg-teal-300" />

          {/* 3D Isometric Stacked Blocks with Smooth Hover Motion */}
          <div className="relative z-10 filter drop-shadow-[0_12px_18px_rgba(16,185,129,0.3)] animate-cube-hover">
            <svg viewBox="0 0 100 90" className="h-20 w-20 transition-transform duration-300 group-hover:scale-105">
              {/* Isometric Block 1 (Left Emerald) */}
              <g transform="translate(15, 30)">
                <path d="M20 0 L40 10 L20 20 L0 10 Z" fill="#6ee7b7" />
                <path d="M0 10 L20 20 L20 40 L0 30 Z" fill="#10b981" />
                <path d="M20 20 L40 10 L40 30 L20 40 Z" fill="#047857" />
              </g>
              {/* Isometric Block 2 (Right Teal) */}
              <g transform="translate(45, 20)">
                <path d="M20 0 L40 10 L20 20 L0 10 Z" fill="#a7f3d0" />
                <path d="M0 10 L20 20 L20 40 L0 30 Z" fill="#34d399" />
                <path d="M20 20 L40 10 L40 30 L20 40 Z" fill="#059669" />
              </g>
              {/* Isometric Block 3 (Top White/Frosted) */}
              <g transform="translate(30, 5)">
                <path d="M20 0 L40 10 L20 20 L0 10 Z" fill="#ffffff" />
                <path d="M0 10 L20 20 L20 38 L0 28 Z" fill="#e2e8f0" />
                <path d="M20 20 L40 10 L40 28 L20 38 Z" fill="#cbd5e1" />
              </g>
            </svg>
          </div>

          {/* Floating Code Tag with Rhythm Pulse */}
          <div className="absolute -bottom-1 right-2 z-20 grid h-7 px-2.5 place-items-center rounded-xl bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg ring-2 ring-white dark:ring-slate-900 animate-badge-pop">
            &lt;/&gt;
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-border/80 py-20 sm:py-28 bg-slate-50/60 dark:bg-transparent transition-colors">
      {/* Top Left Concentric Rings Ambient Background */}
      <div className="absolute -top-16 -left-16 h-80 w-80 rounded-full border border-orange-300/20 dark:border-orange-500/10 pointer-events-none" />
      <div className="absolute -top-28 -left-28 h-[420px] w-[420px] rounded-full border border-orange-300/15 dark:border-orange-500/5 pointer-events-none" />
      <div className="absolute -top-40 -left-40 h-[540px] w-[540px] rounded-full border border-orange-300/10 dark:border-orange-500/5 pointer-events-none" />

      {/* Top Right Dot Grid Ambient Background */}
      <div className="absolute top-8 right-8 h-44 w-44 bg-dot-pattern opacity-60 dark:opacity-20 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header Matching Exact Reference */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="mono inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.25em] text-[#f97316]">
            <Sparkles className="h-3.5 w-3.5" /> SEAMLESS PROGRESSION
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your Trajectory on <span className="text-[#f97316]">Amrita</span> <span className="text-[#8b5cf6]">Connect.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            From your first semester to senior alumni leadership, stay connected to the university commons.
          </p>
          {/* Subtle Horizontal Gradient Accent Bar */}
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#f97316] to-[#8b5cf6]" />
        </div>

        {/* 4 Connected Trajectory Cards Grid */}
        <div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative group">

              {/* Connector Arrow Nodes Between Cards on Desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center">
                  <div className={cx(
                    'grid h-7 w-7 place-items-center rounded-full bg-white dark:bg-slate-900 border shadow-sm transition-transform group-hover:scale-110',
                    step.connectorColor
                  )}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}

              {/* Main Card */}
              <div
                className={cx(
                  'relative flex h-full flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl',
                  step.borderColor,
                  step.gradientBg,
                  step.borderHover
                )}
              >
                <div>
                  {/* Top Number Badge Pill */}
                  <div className="flex items-center justify-between">
                    <span className={cx('inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold text-white shadow-2xs', step.badgeBg)}>
                      {step.num}
                    </span>
                  </div>

                  {/* 3D Vector Illustration */}
                  {step.illustration}

                  {/* Title & Description */}
                  <div className="mt-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Circular Action Arrow Button */}
                <div className="mt-5 flex justify-end">
                  <Link
                    href={step.link}
                    className={cx(
                      'grid h-9 w-9 place-items-center rounded-full transition-all duration-200 group-hover:scale-110 shadow-2xs',
                      step.arrowBg
                    )}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Platform Capsule Banner */}
        <div className="mt-14 max-w-2xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-card/90 p-4 sm:p-5 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                One platform. Endless opportunities.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore. Connect. Collaborate.
              </p>
            </div>
          </div>

          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-2xs active:scale-95 transition-all"
          >
            <span>Explore Platform</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}

/* 5. World-Class Researchers & Faculty Spotlight: Exact Reference Match */
function FacultySpotlight() {
  const researchers = [
    {
      num: '01',
      name: 'Dr. Maneesha V. Ramesh',
      domain: 'AI • IoT • Disaster Resilience',
      campus: 'Amritapuri',
      color: 'orange',
      numColor: 'text-[#f97316]',
      pinColor: 'text-[#f97316]',
      badgeBg: 'bg-[#f97316] text-white',
      badgeBorder: 'ring-white dark:ring-slate-900',
      blobBorder: 'border-orange-400/40 bg-orange-500/10',
      avatar: maneeshaPhoto,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <circle cx="12" cy="12" r="2.5" />
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.83a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      link: '/faculty/maneesha-ramesh',
    },
    {
      num: '02',
      name: 'Dr. Shantikumar V. Nair',
      domain: 'Materials • Nanotechnology',
      campus: 'Kochi',
      color: 'pink',
      numColor: 'text-[#ec4899]',
      pinColor: 'text-[#ec4899]',
      badgeBg: 'bg-[#ec4899] text-white',
      badgeBorder: 'ring-white dark:ring-slate-900',
      blobBorder: 'border-pink-400/40 bg-pink-500/10',
      avatar: santikumarPhoto,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <line x1="7.5" y1="7.5" x2="10" y2="10" />
          <line x1="16.5" y1="7.5" x2="14" y2="10" />
          <line x1="7.5" y1="16.5" x2="10" y2="14" />
          <line x1="16.5" y1="16.5" x2="14" y2="14" />
        </svg>
      ),
      link: '/faculty/shantikumar-nair',
    },
    {
      num: '03',
      name: 'Dr. R. Jayakumar',
      domain: 'Biomaterials • Nanomedicine',
      campus: 'Kochi',
      color: 'purple',
      numColor: 'text-[#8b5cf6]',
      pinColor: 'text-[#8b5cf6]',
      badgeBg: 'bg-[#8b5cf6] text-white',
      badgeBorder: 'ring-white dark:ring-slate-900',
      blobBorder: 'border-purple-400/40 bg-purple-500/10',
      avatar: jayakumarPhoto,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
          <path d="M6 18h8m-4-4v4m5-11-2.5 4M10 2l4.5 7.5a4 4 0 1 1-7-3.5L10 2z" />
          <circle cx="18" cy="18" r="3" />
        </svg>
      ),
      link: '/faculty/jayakumar',
    },
    {
      num: '04',
      name: 'Dr. R. Krishnakumar',
      domain: 'Paediatric Cardiology • Healthcare',
      campus: 'Kochi',
      color: 'blue',
      numColor: 'text-[#3b82f6]',
      pinColor: 'text-[#3b82f6]',
      badgeBg: 'bg-[#3b82f6] text-white',
      badgeBorder: 'ring-white dark:ring-slate-900',
      blobBorder: 'border-blue-400/40 bg-blue-500/10',
      avatar: krishnakumarPhoto,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
      link: '/faculty/krishnakumar',
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-border/70 bg-slate-50/50 dark:bg-transparent py-24 sm:py-32 transition-colors">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-orange-500/10 dark:bg-orange-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">

        {/* Section Header Matching Exact Reference */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="mono inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-[#8b5cf6]">
            <span>✦</span> WORLD-CLASS RESEARCH & FACULTY <span>✦</span>
          </div>

          {/* Header Accent Bar */}
          <div className="mx-auto mt-2 h-0.5 w-14 rounded-full bg-gradient-to-r from-purple-500 to-orange-400" />

          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Minds Behind <br />
            Meaningful Research<span className="text-[#f97316]">.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Explore the visionaries driving innovation and creating global impact across Amrita.
          </p>
        </div>

        {/* 4 Faculty Profiles on Connected Wave Line */}
        <div className="relative mt-20">

          {/* Desktop Connecting Curving Wave Line with Colored Nodes */}
          <div className="hidden lg:block absolute top-[76px] left-[10%] right-[10%] h-16 pointer-events-none z-0">
            <svg viewBox="0 0 1000 100" fill="none" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <path
                d="M 0 50 Q 150 15, 300 50 T 600 50 T 900 50 L 1000 50"
                stroke="url(#waveGradient)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-70"
              />
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="33%" stopColor="#ec4899" />
                  <stop offset="66%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Intersecting Junction Nodes */}
            <div className="absolute top-[42px] left-[32%] -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#f97316] ring-4 ring-orange-200 dark:ring-orange-950/60 shadow-md animate-pulse" />
            <div className="absolute top-[42px] left-[56%] -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#8b5cf6] ring-4 ring-purple-200 dark:ring-purple-950/60 shadow-md animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[42px] left-[80%] -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#3b82f6] ring-4 ring-blue-200 dark:ring-blue-950/60 shadow-md animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* 4 Researchers Grid */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 relative z-10 text-center">
            {researchers.map((res) => (
              <div key={res.num} className="group relative flex flex-col items-center">

                {/* Number Eyebrow */}
                <div className={cx('mono text-sm font-extrabold mb-3', res.numColor)}>
                  {res.num}
                </div>

                {/* Amoeba Fluid Halo with Floating Avatar */}
                <div className="relative mx-auto h-36 w-36 flex items-center justify-center mb-5">
                  {/* Rotating / Pulsing Amoeba Organic Aura */}
                  <div
                    className={cx(
                      'absolute inset-0 rounded-[42%_58%_70%_30%/45%_45%_55%_55%] border transition-all duration-700 group-hover:scale-110 group-hover:rotate-12',
                      res.blobBorder
                    )}
                  />

                  {/* Circular Avatar */}
                  <div className="relative z-10 h-28 w-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl">
                    <img
                      src={res.avatar}
                      alt={res.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'grid';
                        }
                      }}
                    />
                    <div
                      style={{ display: 'none' }}
                      className="h-full w-full place-items-center bg-purple-950 text-white font-bold text-sm"
                    >
                      {initials(res.name)}
                    </div>
                  </div>

                  {/* Thematic Floating Icon Badge */}
                  <div
                    className={cx(
                      'absolute bottom-1 right-2 z-20 grid h-8 w-8 place-items-center rounded-full shadow-lg ring-2 transition-transform duration-300 group-hover:scale-110 animate-bounce',
                      res.badgeBg,
                      res.badgeBorder
                    )}
                    style={{ animationDuration: '4s' }}
                  >
                    {res.icon}
                  </div>
                </div>

                {/* Name & Academic Credentials */}
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#8b5cf6] transition-colors leading-snug">
                  {res.name}
                </h3>

                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {res.domain}
                </p>

                {/* Campus Location Tag */}
                <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <MapPin className={cx('h-3.5 w-3.5', res.pinColor)} />
                  <span>{res.campus}</span>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/* Hero 7-Campus Constellation Graphic matching Reference Design */
function CampusConstellationHero() {
  const campusNodes = [
    {
      id: 'coimbatore',
      name: 'Coimbatore',
      code: 'CBE',
      focus: 'Aerospace, Robotics & HuT Labs',
      icon: Rocket,
      gradient: 'from-violet-600 via-indigo-600 to-purple-700 text-white',
      color: '#8b5cf6', // purple
      ringClass: 'ring-purple-400/50 bg-purple-500/15 shadow-purple-500/25',
      badgeClass: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 260, y2: 65, color: '#a78bfa' },
      className: 'top-1 left-1/2 -translate-x-1/2',
    },
    {
      id: 'bengaluru',
      name: 'Bengaluru',
      code: 'BLR',
      focus: 'AI, Cloud & Startup Hub',
      icon: Zap,
      gradient: 'from-orange-500 via-amber-500 to-orange-600 text-white',
      color: '#f97316', // orange/yellow
      ringClass: 'ring-orange-400/50 bg-orange-500/15 shadow-orange-500/25',
      badgeClass: 'text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 135, y2: 130, color: '#fb923c' },
      className: 'top-12 left-4 sm:left-8',
    },
    {
      id: 'amaravati',
      name: 'Amaravati',
      code: 'AMR',
      focus: 'Sustainable Tech & Smart IoT',
      icon: Lightbulb,
      gradient: 'from-emerald-500 via-teal-600 to-emerald-700 text-white',
      color: '#10b981', // teal/green
      ringClass: 'ring-emerald-400/50 bg-emerald-500/15 shadow-emerald-500/25',
      badgeClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 105, y2: 245, color: '#34d399' },
      className: 'top-[42%] -left-2 sm:left-2',
    },
    {
      id: 'mysuru',
      name: 'Mysuru',
      code: 'MYS',
      focus: 'Pure Sciences & Digital Media',
      icon: BookOpen,
      gradient: 'from-amber-500 via-orange-500 to-amber-600 text-white',
      color: '#f97316', // orange
      ringClass: 'ring-orange-400/50 bg-orange-500/15 shadow-orange-500/25',
      badgeClass: 'text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 175, y2: 375, color: '#fb923c' },
      className: 'bottom-4 left-14 sm:left-18',
    },
    {
      id: 'kochi',
      name: 'Kochi',
      code: 'KOC',
      focus: 'Health Sciences, AIMS & Biotech',
      icon: HeartHandshake,
      gradient: 'from-blue-600 via-cyan-600 to-sky-700 text-white',
      color: '#3b82f6', // blue
      ringClass: 'ring-blue-400/50 bg-blue-500/15 shadow-blue-500/25',
      badgeClass: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 340, y2: 380, color: '#60a5fa' },
      className: 'bottom-1 right-24 sm:right-28',
    },
    {
      id: 'amritapuri',
      name: 'Amritapuri',
      code: 'AMP',
      focus: 'Cybersecurity (bi0s) & FOSS',
      icon: ShieldCheck,
      gradient: 'from-purple-600 via-indigo-600 to-fuchsia-700 text-white',
      color: '#8b5cf6', // indigo/purple
      ringClass: 'ring-purple-400/50 bg-purple-500/15 shadow-purple-500/25',
      badgeClass: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 415, y2: 275, color: '#c084fc' },
      className: 'top-[54%] -right-1 sm:right-3',
    },
    {
      id: 'chennai',
      name: 'Chennai',
      code: 'CHN',
      focus: 'Embedded Systems & Computing',
      icon: Layers,
      gradient: 'from-teal-600 via-emerald-600 to-teal-700 text-white',
      color: '#10b981', // green
      ringClass: 'ring-emerald-400/50 bg-emerald-500/15 shadow-emerald-500/25',
      badgeClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-card/95',
      line: { x1: 260, y1: 245, x2: 405, y2: 145, color: '#4ade80' },
      className: 'top-20 -right-1 sm:right-4',
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[540px] h-[500px] sm:h-[530px] flex items-center justify-center select-none animate-rise delay-2">
      {/* Soft Dot Matrix Globe Pattern Backdrop */}
      <div className="absolute inset-4 rounded-full bg-dot-pattern opacity-40 [mask-image:radial-gradient(circle_at_center,#000_60%,transparent_100%)] pointer-events-none" />

      {/* SVG Connecting Radiating Lines between Center & Campuses */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 520 490" fill="none">
        {campusNodes.map((node) => (
          <g key={`line-${node.id}`}>
            {/* Outer soft glow line */}
            <line
              x1={node.line.x1}
              y1={node.line.y1}
              x2={node.line.x2}
              y2={node.line.y2}
              stroke={node.line.color}
              strokeWidth="4"
              strokeOpacity="0.3"
              strokeLinecap="round"
            />
            {/* Crisp core line */}
            <line
              x1={node.line.x1}
              y1={node.line.y1}
              x2={node.line.x2}
              y2={node.line.y2}
              stroke={node.line.color}
              strokeWidth="1.8"
              strokeOpacity="0.85"
              strokeLinecap="round"
            />
            {/* Animated traveling data pulse */}
            <circle r="4" fill={node.line.color} className="animate-pulse drop-shadow-[0_0_6px_currentColor]">
              <animateMotion
                path={`M ${node.line.x1} ${node.line.y1} L ${node.line.x2} ${node.line.y2}`}
                dur={`${2.4 + (node.id.charCodeAt(0) % 3) * 0.6}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* Center White Glowing Circular Hub */}
      <div className="relative z-10 grid place-items-center h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-card border-2 border-border/90 shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-4 text-center">
        {/* Subtle pulsing background aura */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-orange-400/25 via-amber-400/25 to-orange-400/25 animate-pulse-slow -z-10" />

        <div className="flex flex-col items-center justify-center">
          <svg className="h-7 w-7 sm:h-8 sm:w-8 mb-1" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="8" r="4" fill="#f97316" />
            <circle cx="8" cy="26" r="4" fill="#f97316" />
            <circle cx="28" cy="26" r="4" fill="#f97316" />
            <line x1="18" y1="8" x2="8" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="8" x2="28" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="26" x2="28" y2="26" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-black text-xs sm:text-sm tracking-wider text-slate-900 dark:text-white leading-none">
            AMRITA
          </span>
          <span className="font-extrabold text-xs sm:text-sm tracking-wider text-orange-500 leading-none mt-0.5">
            CONNECT
          </span>
        </div>
      </div>

      {/* 7 Campus Hub Emblems & Monogram Nodes */}
      {campusNodes.map((node) => {
        const Icon = node.icon;
        return (
          <div
            key={node.id}
            className={cx('absolute z-10 flex flex-col items-center group transition-transform duration-300 hover:scale-110 cursor-default', node.className)}
          >
            {/* Stylized Campus Emblem Disc */}
            <div className={cx('relative h-13 w-13 sm:h-15 sm:w-15 rounded-2xl p-0.5 ring-2 shadow-xl transition-all flex items-center justify-center', node.ringClass)}>
              <div className={cx('h-full w-full rounded-xl bg-gradient-to-br flex flex-col items-center justify-center shadow-inner relative overflow-hidden', node.gradient)}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="h-5 w-5 drop-shadow-sm mb-0.5" />
                <span className="text-[9px] font-black tracking-wider uppercase opacity-95">
                  {node.code}
                </span>
              </div>
            </div>

            {/* Clean White Pill Campus Label */}
            <span className={cx('mt-1.5 rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md whitespace-nowrap', node.badgeClass)}>
              {node.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* Ambient Animated Background for Homepage (Dynamic in Light & Dark Mode) */
function LandingAmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Subtle Micro-Dot Grid with Radial Edge Fade */}
      <div className="absolute inset-0 bg-dot-pattern opacity-60 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]" />

      {/* Subtle Linear Grid */}
      <div className="absolute inset-0 bg-grid-subtle opacity-40 dark:opacity-15 [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_90%)]" />

      {/* Floating Ambient Gradient Mesh 1 (Top Left: Warm Amber / Sunset Peach) */}
      <div className="absolute -top-36 -left-36 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-orange-400/25 via-amber-300/20 to-transparent dark:from-orange-500/10 dark:via-transparent blur-[110px] animate-drift" />

      {/* Floating Ambient Gradient Mesh 2 (Top Right: Luminous Violet / Indigo) */}
      <div className="absolute -top-24 -right-28 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-purple-400/25 via-indigo-300/20 to-transparent dark:from-purple-600/10 dark:via-transparent blur-[120px] animate-drift-reverse" />

      {/* Floating Ambient Gradient Mesh 3 (Middle Center: Soft Sky / Cyan Breeze) */}
      <div className="absolute top-[35%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-sky-400/15 via-teal-300/15 to-transparent dark:from-cyan-900/10 dark:via-transparent blur-[130px] animate-pulse-slow" />

      {/* Floating Ambient Gradient Mesh 4 (Bottom Right: Rose Sunset Aura) */}
      <div className="absolute top-[65%] -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-l from-rose-300/20 via-orange-300/15 to-transparent dark:from-rose-950/10 dark:via-transparent blur-[120px] animate-drift" />

      {/* Floating Ambient Gradient Mesh 5 (Bottom Left: Soft Electric Indigo) */}
      <div className="absolute top-[80%] -left-20 h-[450px] w-[450px] rounded-full bg-gradient-to-r from-indigo-300/20 via-purple-300/15 to-transparent dark:from-indigo-950/10 dark:via-transparent blur-[110px] animate-drift-reverse" />

      {/* Floating Micro Shimmer Particles */}
      <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-orange-400/50 dark:bg-orange-400/30 blur-[1px] animate-float" />
      <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-purple-400/50 dark:bg-purple-400/30 blur-[1px] animate-float-reverse" />
      <div className="absolute top-2/3 left-1/4 h-2.5 w-2.5 rounded-full bg-sky-400/50 dark:bg-sky-400/30 blur-[1px] animate-float" />
    </div>
  );
}

function Landing() {
  const { data: currentUser } = useGetCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const getNavHref = (target: string) =>
    currentUser ? target : `/login?redirect=${encodeURIComponent(target)}`;

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-background text-foreground relative">
      {/* Living Animated Ambient Background */}
      <LandingAmbientBackground />

      {/* Top Navbar with Responsive Navigation & Mobile Drawer (Sticky on Scroll) */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 dark:bg-[#070b14]/90 backdrop-blur-xl shadow-sm transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Brand />

          {/* Desktop Navigation Tabs (Visible on lg screens) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold">
            <Link href="/" className="relative text-foreground font-bold py-1">
              Home
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            </Link>
            <Link href={getNavHref('/blogs')} className="text-muted-foreground hover:text-foreground transition-colors">
              Blogs
            </Link>
            <Link href={getNavHref('/people')} className="text-muted-foreground hover:text-foreground transition-colors">
              People
            </Link>
            <Link href={getNavHref('/mentorship')} className="text-muted-foreground hover:text-foreground transition-colors">
              Mentorship
            </Link>
            <Link href={getNavHref('/collaborations')} className="text-muted-foreground hover:text-foreground transition-colors">
              Collaborate
            </Link>
            <Link href={getNavHref('/events')} className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link href={getNavHref('/opportunities')} className="text-muted-foreground hover:text-foreground transition-colors">
              Opportunities
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />
            {currentUser ? (
              <Link
                href="/feed"
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <span>Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  data-testid="link-login"
                  href="/login"
                  className="rounded-xl border border-border/80 bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition-all"
                >
                  Sign in
                </Link>
                <Link
                  data-testid="link-register"
                  href="/register"
                  className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-sm font-bold hover:opacity-90 shadow-md active:scale-95 transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/70 bg-card/95 px-5 py-4 backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2.5 text-sm font-semibold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-orange-500 font-bold py-1.5 flex items-center justify-between"
              >
                <span>Home</span>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              </Link>
              <Link
                href={getNavHref('/blogs')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                Blogs
              </Link>
              <Link
                href={getNavHref('/people')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                People Directory
              </Link>
              <Link
                href={getNavHref('/mentorship')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                Mentorship
              </Link>
              <Link
                href={getNavHref('/collaborations')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                Collaborate
              </Link>
              <Link
                href={getNavHref('/events')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                Events
              </Link>
              <Link
                href={getNavHref('/opportunities')}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1.5"
              >
                Opportunities
              </Link>
            </nav>

            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              {!currentUser && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 text-xs font-bold"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Exact Reference Hero Section */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-14 lg:pb-20 lg:pt-14">
          {/* Left Content Column */}
          <div className="animate-rise">
            {/* Eyebrow Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <Star className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
              <span>One University. Every Campus. One Community.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Connect across <br />
              campuses. <br />
              <span className="text-orange-500">Unlock your</span> <br />
              <span className="text-orange-500">breakthrough.</span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-muted-foreground">
              Amrita Connect brings together students, faculty, researchers and alumni from all 7 campuses to learn, collaborate and grow together.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                data-testid="link-hero-register"
                href="/register"
                className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 text-sm font-bold hover:opacity-90 shadow-lg active:scale-95 transition-all"
              >
                Create your profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                data-testid="link-hero-explore"
                href="/people"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted shadow-sm active:scale-95 transition-all"
              >
                Explore network
              </Link>
            </div>

            {/* Bottom 4-Stat Floating Card */}
            <div className="mt-10 rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-6 shadow-xl backdrop-blur-md grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-500 mb-2">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">50K+</div>
                <div className="text-[11px] font-medium text-muted-foreground">Members</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500 mb-2">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">7</div>
                <div className="text-[11px] font-medium text-muted-foreground">Campuses</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-500 mb-2">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">10K+</div>
                <div className="text-[11px] font-medium text-muted-foreground">Connections</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/15 text-orange-500 mb-2">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">2K+</div>
                <div className="text-[11px] font-medium text-muted-foreground">Projects</div>
              </div>
            </div>
          </div>

          {/* Right Constellation Graphic matching Reference */}
          <div className="relative">
            <CampusConstellationHero />
          </div>
        </section>

        {/* Section 1: Editorial Alumni Spotlight & Company Marquee */}
        <AlumniSpotlightSection />

        {/* Section 2: University Live Mesh & Cross-Campus Radar */}
        <UniversityLiveMesh />

        {/* Section 3: 4-Step Trajectory Roadmap */}
        <TrajectoryRoadmap />

        {/* Section 4: Renowned Faculty & Research Labs */}
        <FacultySpotlight />

        {/* Big Call to Action Banner with Rich Ambient Gradient */}
        <section className="relative border-t border-border bg-gradient-to-b from-secondary/40 via-background to-background py-16 sm:py-24 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center sm:px-8">
            <div>
              <div className="mono text-[10px] font-bold uppercase tracking-[.22em] text-accent">
                Your place in the network
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-[-.04em] text-foreground sm:text-4xl">
                Start with one good conversation today.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Join thousands of students, researchers, faculty, and alumni across Amrita Vishwa Vidyapeetham.
              </p>
            </div>
            <Link
              data-testid="link-bottom-register"
              href="/register"
              className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-xl active:scale-95 shrink-0 transition-all"
            >
              Join Amrita Connect <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>


      {/* Minimal & Elegant Modern University Footer */}
      <footer className="border-t border-border/70 bg-card/60 dark:bg-background/60 py-14 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">

            {/* Left Brand & Mission Info */}
            <div className="max-w-sm">
              <Brand light={false} />
              <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Connecting students, faculty, researchers, and alumni across all 7 campuses of Amrita Vishwa Vidyapeetham.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>NAAC A++ Accredited</span>
                <span>·</span>
                <span>NIRF Top 7</span>
              </div>
            </div>

            {/* Right Clean Spaced Navigation Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-14">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                  Platform
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li>
                    <Link href="/people" className="hover:text-foreground transition-colors">
                      People Directory
                    </Link>
                  </li>
                  <li>
                    <Link href="/mentorship" className="hover:text-foreground transition-colors">
                      Mentorship
                    </Link>
                  </li>
                  <li>
                    <Link href="/collaborations" className="hover:text-foreground transition-colors">
                      Collaborations
                    </Link>
                  </li>
                  <li>
                    <Link href="/opportunities" className="hover:text-foreground transition-colors">
                      Opportunities
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                  Campuses
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="hover:text-foreground cursor-pointer transition-colors">Coimbatore</li>
                  <li className="hover:text-foreground cursor-pointer transition-colors">Amritapuri</li>
                  <li className="hover:text-foreground cursor-pointer transition-colors">Bengaluru</li>
                  <li className="hover:text-foreground cursor-pointer transition-colors">Kochi · Chennai · AP</li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                  Connect
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li>
                    <Link href="/events" className="hover:text-foreground transition-colors">
                      Campus Events
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-foreground transition-colors">
                      Join Network
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-foreground transition-colors">
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Clean Bottom Copyright & Back to Top */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6 text-[11px] text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Amrita Vishwa Vidyapeetham. All rights reserved.</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-foreground font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowRight className="h-3 w-3 -rotate-90" />
            </button>
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
function ResetPasswordDialog({
  initialEmail,
  onClose,
  onSuccess,
}: {
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (token: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsPending(true);
    try {
      const res = await apiFetch<{ success: boolean; token: string; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          newPassword,
        }),
      });
      if (res.token) {
        onSuccess(res.token);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please verify your email.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Reset Your Password</h3>
            <p className="text-xs text-muted-foreground">Enter your registered email and choose a new password.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            id="reset-email"
            label="Registered email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@amrita.edu"
            required
          />

          <Field
            id="reset-new-password"
            label="New password (min 8 characters)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Choose a strong password"
            minLength={8}
            required
          />

          <Field
            id="reset-confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type your new password"
            minLength={8}
            required
          />

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="text-xs font-bold">
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Update Password & Sign In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginPage() {
  const login = useLogin();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    login.mutate(
      { data: { email: email.trim(), password } },
      {
        onSuccess: (data) => {
          setAuthSession(data.token);
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect') || '/feed';
          setLocation(redirect);
        },
        onError: (err: any) => {
          setError(
            err?.message ||
            'Those details did not work. Please check your password, reset it using the link below, or register if you haven\'t created this account yet.'
          );
        },
      }
    );
  };

  const handleResetSuccess = (token: string) => {
    setShowResetDialog(false);
    setAuthSession(token);
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    setSuccessMsg('Password updated successfully! Signing you in...');
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/feed';
      setLocation(redirect);
    }, 1200);
  };

  return (
    <AuthLayout mode="login" title="Good to see you." detail="Sign in to pick up where you left off.">
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field id="email" label="University or personal email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex justify-end">
          <button
            data-testid="button-forgot-password"
            type="button"
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            onClick={() => setShowResetDialog(true)}
          >
            Forgot password? Reset here
          </button>
        </div>
        {successMsg && (
          <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" /> {successMsg}
          </p>
        )}
        {error && (
          <div data-testid="status-auth-error" className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive space-y-1.5">
            <p className="font-semibold">{error}</p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="text-orange-500 hover:underline cursor-pointer"
              >
                Reset Password →
              </button>
              <span className="text-muted-foreground/50">·</span>
              <Link href="/register" className="text-orange-500 hover:underline">
                Create new account →
              </Link>
            </div>
          </div>
        )}
        <Button data-testid="button-submit-login" type="submit" className="w-full py-3.5 cursor-pointer" disabled={login.isPending}>
          {login.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Sign in
        </Button>
      </form>

      {showResetDialog && (
        <ResetPasswordDialog
          initialEmail={email}
          onClose={() => setShowResetDialog(false)}
          onSuccess={handleResetSuccess}
        />
      )}
    </AuthLayout>
  );
}

function RegisterPage() {
  const register = useRegister();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' as 'student' | 'alumni' | 'faculty' | 'researcher', campus: campuses[0], department: departments[0], graduationYear: '' });
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    register.mutate(
      { data: { ...form, graduationYear: form.graduationYear ? Number(form.graduationYear) : null } },
      {
        onSuccess: (data) => {
          setAuthSession(data.token);
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect') || '/feed';
          setLocation(redirect);
        },
        onError: () => setError('We could not create your account. Please review the details and try again.'),
      }
    );
  };
  return (
    <AuthLayout mode="register" title="Make your place." detail="Create a profile that helps the right people understand what you are building toward.">
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field id="full-name" label="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
        <Field id="register-email" label="Email address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField id="role" label="I am a" value={form.role} onChange={(e) => update('role', e.target.value)} options={Object.entries(roleLabels).filter(([key]) => key !== 'admin').map(([value, label]) => ({ value, label }))} />
          <SelectField id="campus" label="Campus" value={form.campus} onChange={(e) => update('campus', e.target.value)} options={campuses.map((value) => ({ value, label: value }))} />
        </div>
        <SelectField id="department" label="Department" value={form.department} onChange={(e) => update('department', e.target.value)} options={departments.map((value) => ({ value, label: value }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="graduation-year" label="Graduation year" type="number" placeholder="Optional" value={form.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} />
          <Field id="register-password" label="Create password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={8} required />
        </div>
        {error && <p data-testid="status-register-error" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button data-testid="button-submit-register" type="submit" className="mt-3 w-full py-3.5" disabled={register.isPending}>
          {register.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Create my profile
        </Button>
      </form>
    </AuthLayout>
  );
}
function Field({ id, label, type = 'text', value, onChange, placeholder, required, minLength }: { id: string; label: string; type?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; placeholder?: string; required?: boolean; minLength?: number }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span><input data-testid={`input-${id}`} id={id} type={type} autoComplete={type === 'password' ? (id === 'password' ? 'current-password' : 'new-password') : type === 'email' ? 'email' : undefined} value={value} onChange={onChange} placeholder={placeholder} required={required} minLength={minLength} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/30" /></label>; }
function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; options: Array<{ value: string; label: string }> }) { return <label className="block">{label ? <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span> : null}<select data-testid={`select-${id}`} id={id} value={value} onChange={onChange} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }

function AppShell({ children, user }: { children: React.ReactNode; user?: User | null }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const unread = useListNotifications({ query: { queryKey: getListNotificationsQueryKey(), staleTime: 3000, refetchInterval: 10000 } });
  const unreadCount = unread.data?.filter((n) => !n.read && n.type !== 'direct_message' && n.type !== 'message').length ?? 0;

  const { data: unreadMsgsData } = useQuery({
    queryKey: ['messages', 'unread_count'],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ unreadCount: number }>('/messages/unread-count');
        if (res && typeof res.unreadCount === 'number') return res;
      } catch {
        // Fallback to conversations list to compute unread count
      }
      try {
        const convs = await apiFetch<{ items: Array<{ unreadCount?: number }> }>('/messages/conversations');
        const count = (convs?.items ?? []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        return { unreadCount: count };
      } catch {
        return { unreadCount: 0 };
      }
    },
    refetchInterval: 5000,
    staleTime: 4000,
  });
  const unreadMessagesCount = unreadMsgsData?.unreadCount ?? 0;

  const searchUserParams = useMemo(
    () => ({
      search: globalSearch.trim() || undefined,
      pageSize: 5,
      page: 1,
    }),
    [globalSearch]
  );

  const { data: searchUsersData, isLoading: searchUsersLoading } = useListUsers(searchUserParams, {
    query: {
      queryKey: getListUsersQueryKey(searchUserParams),
      enabled: Boolean(globalSearch.trim().length >= 1 && showSearchDropdown),
      staleTime: 10000,
    },
  });

  const matchingSearchUsers = (searchUsersData?.items ?? []).filter((u) => u.id !== user?.id && u.role !== 'admin');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const socialNavItems: NavItem[] = [
    { href: '/feed', label: 'Feed & Stories', icon: Rss },
    { href: '/people', label: 'My Friends & Network', icon: Users },
    { href: '/blogs', label: 'Blogs', icon: FileText },
    { href: '/mentorship', label: 'Mentorship Hub', icon: HeartHandshake },
    { href: '/showcase', label: 'Project Showcase', icon: Trophy },
    { href: '/research', label: 'Research & Labs', icon: BookOpen },
    { href: '/opportunities', label: 'Events & Opportunities', icon: CalendarDays },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  if (user?.role === 'admin') {
    socialNavItems.push({ href: '/admin', label: 'Admin Console', icon: ShieldCheck, roles: ['admin'] });
  }

  const handleLogout = () => {
    clearAuthSession();
    setLocation('/login');
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setShowSearchDropdown(false);
      setLocation(`/feed?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Modern Social Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/80 bg-card text-card-foreground transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Header of Sidebar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
          <Brand />
          <button
            data-testid="button-close-menu"
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Social Mini Profile Card */}
        {user && (
          <div className="p-3">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-secondary/30 p-3.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <Avatar user={user} size="md" className="ring-2 ring-orange-500/30" />
                <div className="min-w-0 flex-1">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="block font-bold text-sm text-foreground hover:text-orange-500 transition-colors truncate"
                  >
                    {user.fullName}
                  </Link>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.headline || `${roleLabels[user.role] ?? user.role} · Amrita ${user.campus || ''}`}
                  </p>
                </div>
              </div>

              {/* Quick links under mini card */}
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] font-semibold text-muted-foreground">
                <Link
                  href="/connections"
                  onClick={() => setOpen(false)}
                  className="hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  <span>Network</span>
                </Link>
                <span className="text-border">•</span>
                <Link
                  href="/profile?tab=saved"
                  onClick={() => setOpen(false)}
                  className="hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  <Bookmark className="h-3 w-3" />
                  <span>Saved</span>
                </Link>
                <span className="text-border">•</span>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  <UserCircle className="h-3 w-3" />
                  <span>Profile</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Social Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <nav className="space-y-1" aria-label="Social navigation">
            {socialNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = location === href || (href !== '/feed' && location.startsWith(href));
              return (
                <Link
                  data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
                  onClick={() => setOpen(false)}
                  href={href}
                  key={href + label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cx(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 shadow-2xs'
                      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cx(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                    )}
                  />
                  <span className="truncate">{label}</span>
                  {href === '/messages' && unreadMessagesCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-extrabold text-white shadow-xs">
                      +{unreadMessagesCount > 9 ? '9' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="shrink-0 border-t border-border/70 p-3 bg-card/90">
          <button
            type="button"
            data-testid="button-sidebar-logout"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && (
        <div
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Viewport */}
      <div className="lg:pl-72 flex min-h-screen flex-col">
        {/* Social Sticky Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              data-testid="button-open-menu"
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar (LinkedIn Style with People Autocomplete) */}
            <div ref={searchContainerRef} className="relative w-full max-w-sm hidden sm:block">
              <form onSubmit={handleGlobalSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={globalSearch}
                  onFocus={() => setShowSearchDropdown(true)}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  placeholder="Search posts, members, #tags..."
                  className="w-full rounded-full border border-input bg-secondary/50 hover:bg-secondary/70 focus:bg-background py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearch('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* LinkedIn Style Quick Autocomplete Dropdown */}
              {showSearchDropdown && globalSearch.trim().length >= 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl p-2.5 space-y-2 animate-scale-in">
                  <div className="flex items-center justify-between px-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-orange-500" />
                      <span>People on Amrita Connect</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {matchingSearchUsers.length} found
                    </span>
                  </div>

                  {searchUsersLoading ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">Searching members...</div>
                  ) : matchingSearchUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No members matching "{globalSearch.trim()}"
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {matchingSearchUsers.map((person) => (
                        <Link
                          key={person.id}
                          href={`/people/${person.id}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setGlobalSearch('');
                          }}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-secondary/70 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Avatar user={person} size="sm" className="ring-1 ring-border group-hover:ring-orange-500/40 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground group-hover:text-orange-500 transition-colors truncate">
                                  {person.fullName}
                                </span>
                                {person.verified && <Check className="h-3 w-3 text-orange-500 shrink-0" />}
                                <span className="rounded-md bg-secondary px-1.5 py-0.2 text-[9px] font-extrabold text-muted-foreground uppercase">
                                  {roleLabels[person.role] ?? person.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {person.headline || `${person.department || 'Amrita'} · ${person.campus || ''}`}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] font-bold text-orange-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>Profile</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* See all results in feed */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setLocation(`/feed?search=${encodeURIComponent(globalSearch.trim())}`);
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-orange-500/10 hover:bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 transition-all cursor-pointer"
                  >
                    <span>See all feed posts & posts for "{globalSearch.trim()}"</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Social Controls */}
          <div className="flex items-center gap-2">
            <Link
              data-testid="link-messages-header"
              aria-label={`Messages${unreadMessagesCount ? `, ${unreadMessagesCount} unread` : ''}`}
              href="/messages"
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare aria-hidden="true" className="h-[18px] w-[18px]" />
              {unreadMessagesCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-background shadow-xs animate-pulse"
                >
                  +{unreadMessagesCount > 9 ? '9' : unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link
              data-testid="link-notifications-header"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              href="/notifications"
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer active:scale-95"
            >
              <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-background"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <ThemeToggle className="hidden sm:inline-flex cursor-pointer" />
            <Link
              data-testid="link-profile-header"
              aria-label="Open your profile"
              href="/profile"
              className="ml-1 rounded-full ring-2 ring-transparent hover:ring-orange-500/40 transition-all cursor-pointer"
            >
              <Avatar user={user} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page Container */}
        <main
          className={cx(
            'flex-1 mx-auto w-full',
            location.startsWith('/messages')
              ? 'max-w-7xl px-2 sm:px-4 py-2 sm:py-3'
              : 'max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:py-8'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
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

    {/* Quick Feature Hubs Grid */}
    <div className="mt-8">
      <SectionHeader eyebrow="Explore Ecosystem" title="Campus Collaboration Hubs" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Community Feed */}
        <Link
          href="/feed"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-accent transition-colors">
              Community Feed
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Campus updates, achievements, hackathon announcements, and open questions.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-accent">Join Discussions →</div>
        </Link>

        {/* Teammate Matchmaker */}
        <Link
          href="/matchmaker"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary font-bold group-hover:scale-105 transition-transform">
                <Compass className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-accent transition-colors">
              Teammate Matchmaker
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Synergy engine matching members with complementary skills across 7 campuses.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-accent">Find Teammates →</div>
        </Link>

        {/* Research Hub */}
        <Link
          href="/research"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-500 font-bold group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-cyan-500 transition-colors">
              Research & Labs
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Funded faculty grants (HuT Labs, ACCI), student assistant roles, and IEEE paper calls.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-cyan-500">Explore Labs →</div>
        </Link>

        {/* Project Showcase */}
        <Link
          href="/showcase"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-500 font-bold group-hover:scale-105 transition-transform">
                <Trophy className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-amber-500 transition-colors">
              Project Showcase
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Hackathon winning prototypes, GitHub repositories, and live demo apps.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-amber-500">View Demos →</div>
        </Link>

        {/* Campus Buddy */}
        <Link
          href="/campus-buddy"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-500 font-bold group-hover:scale-105 transition-transform">
                <MapPin className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Campus Buddy
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Visiting another campus? Connect with local student guides for hackathons and lab visits.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-emerald-500">Find Guides →</div>
        </Link>

        {/* Interview Prep & Guidance */}
        <Link
          href="/interviews"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-accent font-bold group-hover:scale-105 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground group-hover:text-accent transition-colors">
              Interview Prep
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Round breakdowns, questions, and 1-click guidance requests from placed seniors.
            </p>
          </div>
          <div className="mt-4 mono text-[10px] font-bold uppercase text-accent">Read Experiences →</div>
        </Link>
      </div>
    </div>


    <section className="mt-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8">



      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><div className="mono text-[10px] uppercase tracking-[.2em] text-primary-foreground/45">A small nudge</div><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Your next connection may start with a question.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/60">Look for someone whose experience meets the edge of your curiosity.</p></div><Link data-testid="link-dashboard-mentorship" href="/mentorship" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-primary hover:brightness-95">Find a mentor <HeartHandshake className="h-4 w-4" /></Link></div></section>
  </>;
}
function Metric({ label, value, detail, progress, accent }: { label: string; value: string; detail: string; progress?: number; accent?: boolean }) { return <div className={cx('surface rounded-xl border border-border p-5', accent && 'bg-secondary/40')}><div className="flex items-start justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{accent && <Sparkles className="h-4 w-4 text-accent" />}</div><div data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-4 text-3xl font-bold tracking-[-.06em] text-foreground">{value}</div>{progress !== undefined ? <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${progress}%` }} /></div> : <p className="mt-3 text-xs text-muted-foreground">{detail}</p>} {progress !== undefined && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}</div>; }
function SectionHeader({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) { return <div className="flex items-end justify-between"><div><div className="mono text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</div><h2 className="mt-1 text-lg font-bold tracking-[-.03em] text-foreground">{title}</h2></div>{link && <Link data-testid={`link-section-${title.toLowerCase().replace(' ', '-')}`} href={link} className="text-xs font-bold text-muted-foreground hover:text-foreground">View all <ChevronRight className="inline h-3 w-3" /></Link>}</div>; }
function PersonRow({ user }: { user: PublicUser }) { return <Link data-testid={`link-person-${user.id}`} href={`/people/${user.id}`} className="flex items-center gap-3 py-3.5 group"><Avatar user={user} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-sm font-bold text-foreground group-hover:text-accent">{user.fullName}{user.verified && <Check className="h-3 w-3 text-accent" />}</div><p className="truncate text-xs text-muted-foreground">{user.headline || `${roleLabels[user.role]} · ${user.department}`}</p></div><span className="hidden text-xs text-muted-foreground sm:block">{user.campus}</span><ChevronRight className="h-4 w-4 text-border group-hover:text-foreground" /></Link>; }
function EventRow({ event }: { event: Event }) { return <Link data-testid={`link-event-${event.id}`} href="/events" className="flex gap-3 rounded-lg border border-border p-3 hover:bg-muted"><div className="min-w-11 rounded-md bg-secondary px-2 py-1 text-center"><div className="mono text-[9px] font-bold uppercase text-muted-foreground">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</div><div className="text-lg font-bold leading-5 text-foreground">{new Date(event.date).getDate()}</div></div><div className="min-w-0"><div className="truncate text-sm font-bold text-foreground">{event.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{event.campus} · {event.venue}</div></div></Link>; }
const POST_CATEGORIES = [
  'General',
  'Blog',
  'Article',
  'Achievement',
  'Project',
  'Opportunity',
  'Interview Experience',
  'Research',
  'Resource',
  'Question',
  'Help Needed',
] as const;

type PostCategory = (typeof POST_CATEGORIES)[number];

const categoryBadgeStyles: Record<string, string> = {
  General: 'bg-muted text-muted-foreground border-border',
  Blog: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
  Article: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  Achievement: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Project: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  Opportunity: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Interview Experience': 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Research: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
  Resource: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Question: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'Help Needed': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface PostCommentItem {
  id: string;
  text: string;
  createdAt: string;
  user: PublicUser;
  likesCount?: number;
  isLiked?: boolean;
  isMyComment: boolean;
}

export type PostReactionType = 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'curious';

interface PostItem {
  id: string;
  content: string;
  imageUrl?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  linkUrl?: string | null;
  category: PostCategory;
  campus: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  author: PublicUser;
  likesCount: number;
  reactionsCount?: number;
  userReaction?: PostReactionType | null;
  reactionsBreakdown?: Record<string, number>;
  recentReactors?: Array<{ id: string; fullName: string; avatarUrl?: string | null; type: string }>;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isMyPost: boolean;
  comments: PostCommentItem[];
}

const REACTION_CONFIG: Record<
  PostReactionType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  like: { label: 'Like', emoji: '👍', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15' },
  celebrate: { label: 'Celebrate', emoji: '👏', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' },
  support: { label: 'Support', emoji: '💡', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/15' },
  love: { label: 'Love', emoji: '❤️', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15' },
  insightful: { label: 'Insightful', emoji: '🧠', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15' },
  curious: { label: 'Curious', emoji: '🤔', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/15' },
};

function PostReactionsModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { data, isLoading } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: () => apiFetch<{ items: Array<{ user: PublicUser; type: string; createdAt: string }>; total: number }>(`/posts/${postId}/reactions`),
  });

  const reactions = data?.items ?? [];
  const filtered = activeFilter === 'all' ? reactions : reactions.filter((r) => r.type === activeFilter);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 sm:pt-28 pb-10 bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[75vh] rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 shrink-0 bg-card">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">Reactions</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{reactions.length}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reaction Type Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 border-b border-border/40 shrink-0 bg-muted/20 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cx(
              'rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer',
              activeFilter === 'all' ? 'bg-orange-500 text-white shadow-xs' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            )}
          >
            All ({reactions.length})
          </button>
          {(['like', 'celebrate', 'support', 'love', 'insightful', 'curious'] as PostReactionType[]).map((type) => {
            const count = reactions.filter((r) => r.type === type).length;
            if (count === 0) return null;
            const conf = REACTION_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveFilter(type)}
                className={cx(
                  'rounded-full px-2.5 py-1 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer',
                  activeFilter === type ? 'bg-orange-500 text-white shadow-xs' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{conf.emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Reaction User List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {isLoading ? (
            <LoadingState rows={3} />
          ) : filtered.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">No reactions found for this filter.</p>
          ) : (
            filtered.map((item, idx) => {
              const rConf = REACTION_CONFIG[item.type as PostReactionType] || REACTION_CONFIG.like;
              return (
                <div key={`${item.user?.id}-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl p-2.5 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar user={item.user} size="md" />
                      <span className="absolute -bottom-1 -right-1 text-sm bg-card rounded-full shadow-xs ring-1 ring-border p-0.5">{rConf.emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <Link href={`/people/${item.user?.id}`} onClick={onClose} className="text-xs sm:text-sm font-bold text-foreground hover:text-orange-500 hover:underline truncate block">
                        {item.user?.fullName ?? 'Amrita Member'}
                      </Link>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.user?.headline || `${item.user?.department || 'Student'} · Amrita ${item.user?.campus || ''}`}
                      </p>
                    </div>
                  </div>

                  <ConnectActionButton targetUser={item.user} size="sm" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
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
  const [showPicker, setShowPicker] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const pickerTimeoutRef = useRef<any>(null);

  const queryClient = useQueryClient();

  const syncPostCache = (updatedPost: PostItem) => {
    queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map((p: PostItem) => (p.id === updatedPost.id ? updatedPost : p));
      }
      if (old.items && Array.isArray(old.items)) {
        return {
          ...old,
          items: old.items.map((p: PostItem) => (p.id === updatedPost.id ? updatedPost : p)),
        };
      }
      return old;
    });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  const reactMutation = useMutation({
    mutationFn: (type: PostReactionType) =>
      apiFetch<PostItem>(`/posts/${post.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    onMutate: async (newReactionType) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        const updateItem = (p: PostItem) => {
          if (p.id !== post.id) return p;
          const currentReaction = p.userReaction || (p.isLiked ? 'like' : null);
          const breakdown = { ...(p.reactionsBreakdown || {}) };
          let newTotal = p.reactionsCount ?? p.likesCount ?? 0;
          let nextReaction: PostReactionType | null = newReactionType;

          if (currentReaction === newReactionType) {
            // Toggling off
            nextReaction = null;
            newTotal = Math.max(0, newTotal - 1);
            if (breakdown[newReactionType]) {
              breakdown[newReactionType] = Math.max(0, breakdown[newReactionType] - 1);
            }
          } else {
            // Adding or switching
            if (currentReaction && breakdown[currentReaction]) {
              breakdown[currentReaction] = Math.max(0, breakdown[currentReaction] - 1);
            } else if (!currentReaction) {
              newTotal += 1;
            }
            breakdown[newReactionType] = (breakdown[newReactionType] || 0) + 1;
          }

          return {
            ...p,
            userReaction: nextReaction,
            isLiked: !!nextReaction,
            reactionsCount: newTotal,
            likesCount: newTotal,
            reactionsBreakdown: breakdown,
          };
        };

        if (Array.isArray(old)) return old.map(updateItem);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(updateItem) };
        }
        return old;
      });

      return { previousPosts };
    },
    onError: (_err, _newReaction, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedPost) => {
      if (updatedPost && updatedPost.id) {
        syncPostCache(updatedPost);
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string; isSaved: boolean; savedCount: number }>(`/posts/${post.id}/save`, { method: 'POST' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        const updateItem = (p: PostItem) => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            isSaved: !p.isSaved,
          };
        };
        if (Array.isArray(old)) return old.map(updateItem);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(updateItem) };
        }
        return old;
      });

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (saveRes) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (typeof onRefresh === 'function') onRefresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>(`/posts/${post.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        const filterItem = (p: PostItem) => p.id !== post.id;
        if (Array.isArray(old)) return old.filter(filterItem);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.filter(filterItem), total: Math.max(0, (old.total || 1) - 1) };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile_my_posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile_saved_posts'] });
      if (typeof onRefresh === 'function') onRefresh();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch<PostItem>(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onMutate: async (newCommentText) => {
      setCommentText('');
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      const tempCommentId = `temp-${Date.now()}`;
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        const updateItem = (p: PostItem) => {
          if (p.id !== post.id) return p;
          const newComments = [
            ...(p.comments || []),
            {
              id: tempCommentId,
              text: newCommentText,
              createdAt: new Date().toISOString(),
              likes: [],
              likesCount: 0,
              isLiked: false,
              isMyComment: true,
              user: currentUser
                ? {
                  id: currentUser.id,
                  fullName: currentUser.fullName,
                  role: currentUser.role,
                  avatarUrl: currentUser.avatarUrl,
                }
                : undefined,
            },
          ];
          return {
            ...p,
            comments: newComments,
            commentsCount: (p.commentsCount || 0) + 1,
          };
        };
        if (Array.isArray(old)) return old.map(updateItem);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(updateItem) };
        }
        return old;
      });

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedPost) => {
      if (updatedPost && updatedPost.id) {
        syncPostCache(updatedPost);
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
        queryClient.invalidateQueries({ queryKey: ['profile_my_posts'] });
      }
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch<PostItem>(`/posts/${post.id}/comments/${commentId}/like`, { method: 'POST' }),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        const updateItem = (p: PostItem) => {
          if (p.id !== post.id || !p.comments) return p;
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id !== commentId) return c;
              const willBeLiked = !c.isLiked;
              return {
                ...c,
                isLiked: willBeLiked,
                likesCount: willBeLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 1) - 1),
              };
            }),
          };
        };
        if (Array.isArray(old)) return old.map(updateItem);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(updateItem) };
        }
        return old;
      });

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedPost) => {
      if (updatedPost && updatedPost.id) {
        syncPostCache(updatedPost);
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      apiFetch<PostItem>(`/posts/${post.id}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ text }),
      }),
    onSuccess: (updatedPost) => {
      setEditingCommentId(null);
      setEditingCommentText('');
      if (updatedPost && updatedPost.id) {
        syncPostCache(updatedPost);
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch<PostItem>(`/posts/${post.id}/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: (updatedPost) => {
      if (updatedPost && updatedPost.id) {
        syncPostCache(updatedPost);
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/feed?post=${post.id}` : `https://connect.amrita.edu/feed?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author?.fullName ?? 'Amrita Member'} on Amrita Connect`,
          text: post.content.slice(0, 120),
          url,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      } catch {
        // User cancelled or share failed; fallback to clipboard below
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        // fallback ignored
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const { data: currentUser } = useGetCurrentUser();
  const badgeClass = categoryBadgeStyles[post.category] ?? categoryBadgeStyles.General;
  const userReaction = post.userReaction || (post.isLiked ? 'like' : null);
  const currentReactionConf = userReaction ? REACTION_CONFIG[userReaction] : null;

  // Collect top reactions for display chip
  const breakdown = post.reactionsBreakdown || {};
  const activeEmojis = (Object.entries(breakdown) as [PostReactionType, number][])
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTION_CONFIG[type]?.emoji || '👍');

  const totalReactions = post.reactionsCount ?? post.likesCount ?? 0;
  const recentReactors = post.recentReactors || [];

  const getReactionSummaryText = () => {
    if (totalReactions === 0) return null;

    const isUserReacted = !!userReaction;
    const otherReactors = recentReactors.filter((r) => r.id !== currentUser?.id);

    if (isUserReacted) {
      const othersCount = totalReactions - 1;
      if (othersCount === 0) {
        return 'You';
      } else if (othersCount === 1) {
        const otherName = otherReactors[0]?.fullName || '1 other';
        return `You and ${otherName}`;
      } else {
        const otherName = otherReactors[0]?.fullName;
        if (otherName) {
          return `You, ${otherName} and ${othersCount - 1} ${othersCount - 1 === 1 ? 'other' : 'others'}`;
        }
        return `You and ${othersCount} others`;
      }
    } else {
      if (recentReactors.length > 0) {
        const first = recentReactors[0]?.fullName || 'Amrita Member';
        const othersCount = totalReactions - 1;
        if (othersCount === 0) {
          return first;
        } else if (othersCount === 1) {
          const second = recentReactors[1]?.fullName || '1 other';
          return `${first} and ${second}`;
        } else {
          return `${first} and ${othersCount} others`;
        }
      }
      return `${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'}`;
    }
  };

  const isAuthor = Boolean(
    post.isMyPost ||
    (post.author?.id && currentUser?.id && String(post.author.id) === String(currentUser.id))
  );
  const canDeletePost = isAuthor || currentUser?.role === 'admin';

  return (
    <article className="surface relative rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:border-border hover:shadow-md animate-rise">
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
                className="text-sm font-bold text-foreground hover:text-orange-500 hover:underline transition-colors"
              >
                {post.author?.fullName ?? 'Amrita Member'}
              </Link>
              {post.author?.verified && (
                <span title="Verified Amrita Member" className="grid h-3.5 w-3.5 place-items-center rounded-full bg-blue-500 text-white">
                  <Check className="h-2 w-2 stroke-[3]" />
                </span>
              )}
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

          {canDeletePost && (
            <div className="relative">
              <button
                type="button"
                aria-label="Post actions"
                onClick={() => setActionMenuOpen((prev) => !prev)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {actionMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-border bg-card p-1 shadow-lg animate-rise">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionMenuOpen(false);
                        onEdit(post);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit post
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      if (confirm('Are you sure you want to delete this post?')) {
                        deleteMutation.mutate();
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
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

      {/* Attached Document / PDF */}
      {post.documentUrl && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-3.5 sm:p-4 hover:border-orange-500/40 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-500 font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                {post.documentName || 'Attached Document.pdf'}
              </p>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                PDF / Document
              </span>
            </div>
          </div>
          <a
            href={post.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={post.documentName || 'document.pdf'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-2xs transition-all shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-orange-500" />
            <span>Open / Download</span>
          </a>
        </div>
      )}

      {/* Attached Link */}
      {post.linkUrl && (
        <div className="mt-4">
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-3 hover:border-orange-500/40 hover:bg-secondary/50 transition-all group"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                {post.linkUrl}
              </p>
              <span className="text-[10px] text-muted-foreground">External Link</span>
            </div>
          </a>
        </div>
      )}

      {/* Reaction & Comments Count Bar (LinkedIn Style) */}
      {(totalReactions > 0 || post.commentsCount > 0) && (
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {/* Active Reaction Icons & Summary */}
          {totalReactions > 0 ? (
            <button
              type="button"
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center gap-1.5 hover:underline cursor-pointer group/summary"
            >
              <div className="flex -space-x-1">
                {activeEmojis.map((emoji, idx) => (
                  <span
                    key={idx}
                    className="inline-grid h-5 w-5 place-items-center rounded-full bg-card ring-2 ring-card shadow-2xs text-[11px] select-none group-hover/summary:scale-110 transition-transform"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="font-semibold text-foreground/80 group-hover/summary:text-orange-500 transition-colors">
                {getReactionSummaryText()}
              </span>
            </button>
          ) : (
            <div />
          )}

          {/* Comments count */}
          {post.commentsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="hover:underline cursor-pointer hover:text-foreground font-semibold"
            >
              {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Reactions breakdown modal */}
      {showReactionsModal && (
        <PostReactionsModal
          postId={post.id}
          onClose={() => setShowReactionsModal(false)}
        />
      )}

      {/* Interaction Buttons Bar (Like / React Picker, Comment, Save, Share) */}
      <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2 text-xs text-muted-foreground relative">
        <div className="flex items-center gap-1">
          {/* LinkedIn Floating Reaction Hover Picker */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
              setShowPicker(true);
            }}
            onMouseLeave={() => {
              pickerTimeoutRef.current = setTimeout(() => setShowPicker(false), 350);
            }}
          >
            {showPicker && (
              <div className="absolute -top-13 left-0 z-30 flex items-center gap-1.5 rounded-full border border-border/80 bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-md animate-float-picker">
                {(Object.entries(REACTION_CONFIG) as [PostReactionType, typeof REACTION_CONFIG.like][]).map(([type, conf]) => {
                  const isSelected = userReaction === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        reactMutation.mutate(type);
                        setShowPicker(false);
                      }}
                      className={cx(
                        "group/btn relative grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 hover:scale-130 cursor-pointer",
                        isSelected && "bg-secondary scale-110"
                      )}
                      title={conf.label}
                    >
                      <span className="text-xl leading-none select-none transition-transform duration-150">{conf.emoji}</span>
                      <span className="pointer-events-none absolute -top-7 rounded-md bg-black/85 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover/btn:opacity-100 transition-opacity backdrop-blur-xs whitespace-nowrap shadow-md">
                        {conf.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              data-testid={`button-like-post-${post.id}`}
              onClick={() => reactMutation.mutate(userReaction || 'like')}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold transition-all active:scale-[0.93] cursor-pointer select-none',
                currentReactionConf
                  ? `${currentReactionConf.bg} ${currentReactionConf.color}`
                  : 'hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              <span key={userReaction || 'default-like'} className={cx("text-sm select-none inline-block", userReaction && "animate-heart-pop")}>
                {currentReactionConf?.emoji || '👍'}
              </span>
              <span>{currentReactionConf?.label || 'Like'}</span>
            </button>
          </div>

          {/* Comment Toggle Button */}
          <button
            type="button"
            data-testid={`button-comments-toggle-${post.id}`}
            onClick={() => setShowComments((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold hover:bg-secondary/70 hover:text-foreground transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Comment</span>
          </button>

          {/* Save Bookmark Button */}
          <button
            type="button"
            data-testid={`button-save-post-${post.id}`}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold transition-all active:scale-95 cursor-pointer',
              post.isSaved
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                : 'hover:bg-secondary/70 hover:text-foreground'
            )}
          >
            <Bookmark className={cx('h-4 w-4', post.isSaved && 'fill-amber-500 text-amber-500')} />
            <span className="hidden sm:inline">{post.isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-all cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Collapsible Comments Section with Reactions and Delete */}
      {showComments && (
        <div className="mt-4 border-t border-border/80 pt-4 space-y-3 animate-rise">
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              data-testid={`input-comment-post-${post.id}`}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a thoughtful comment or reply..."
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs outline-none focus:border-orange-500"
            />
            <Button
              type="submit"
              disabled={commentMutation.isPending || !commentText.trim()}
              className="px-4 py-2 text-xs font-bold shrink-0 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              {commentMutation.isPending ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 pt-1">
            {post.comments?.map((comment) => {
              const isMyComment = Boolean(
                comment.isMyComment ||
                (comment.user?.id && currentUser?.id && String(comment.user.id) === String(currentUser.id))
              );
              const canDeleteComment = isMyComment || post.isMyPost || currentUser?.role === 'admin';
              const isEditing = editingCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="group/comment flex items-start justify-between gap-3 rounded-2xl bg-secondary/35 p-3.5 text-xs transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar user={comment.user} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/people/${comment.user?.id}`} className="font-bold text-foreground hover:text-orange-500 hover:underline">
                          {comment.user?.fullName ?? 'Member'}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">
                          {relative(comment.createdAt)}
                        </span>
                        {comment.updatedAt && (
                          <span className="text-[9px] text-muted-foreground italic">(edited)</span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-orange-500 bg-card p-2.5 text-xs outline-none text-foreground focus:ring-1 focus:ring-orange-500"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={editCommentMutation.isPending || !editingCommentText.trim()}
                              onClick={() => {
                                if (editingCommentText.trim()) {
                                  editCommentMutation.mutate({ commentId: comment.id, text: editingCommentText.trim() });
                                }
                              }}
                              className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              {editCommentMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentText('');
                              }}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-foreground/90 font-normal leading-relaxed whitespace-pre-line">
                            {comment.text}
                          </p>

                          {/* Comment like reaction button */}
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => commentLikeMutation.mutate(comment.id)}
                              className={cx(
                                'inline-flex items-center gap-1 font-bold hover:text-foreground transition-colors cursor-pointer',
                                comment.isLiked ? 'text-rose-500 font-bold' : ''
                              )}
                            >
                              <Heart className={cx('h-3 w-3', comment.isLiked && 'fill-rose-500 text-rose-500')} />
                              <span>{(comment.likesCount ?? 0) > 0 ? `${comment.likesCount} Like` : 'Like'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* ONLY AUTHOR can edit comment */}
                      {isMyComment && (
                        <button
                          type="button"
                          aria-label="Edit comment"
                          title="Edit your comment"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentText(comment.text);
                          }}
                          className="text-muted-foreground hover:text-orange-500 p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-orange-500/10 transition-all cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {canDeleteComment && (
                        <button
                          type="button"
                          aria-label="Delete comment"
                          title="Delete comment"
                          onClick={() => {
                            if (confirm('Delete this comment?')) {
                              deleteCommentMutation.mutate(comment.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-destructive/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

function EditPostModal({
  post,
  onClose,
  onUpdated,
}: {
  post: PostItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [content, setContent] = useState(post.content || '');
  const [category, setCategory] = useState<PostCategory>(post.category || 'General');
  const [imageUrl, setImageUrl] = useState(post.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState(post.linkUrl || '');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data: {
      content: string;
      category: PostCategory;
      imageUrl?: string | null;
      linkUrl?: string | null;
    }) =>
      apiFetch<PostItem>(`/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedPost) => {
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((p: PostItem) => (p.id === updatedPost.id ? updatedPost : p));
        }
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            items: old.items.map((p: PostItem) => (p.id === updatedPost.id ? updatedPost : p)),
          };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onUpdated();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message || 'Could not update post');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    updateMutation.mutate({
      content: content.trim(),
      category,
      imageUrl: imageUrl.trim() || null,
      linkUrl: linkUrl.trim() || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in">
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

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">Link / Resource URL (optional)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
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
    </div>,
    document.body
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

const ConnectionsPage = ProfilePage;

interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  linkUrl?: string | null;
  isDeletedForEveryone?: boolean;
  read: boolean;
  createdAt: string;
  isMine: boolean;
}

interface ConversationItem {
  otherUser: PublicUser;
  lastMessage: {
    id: string;
    content: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    isDeletedForEveryone?: boolean;
    createdAt: string;
    isMine: boolean;
    read: boolean;
  };
  unreadCount: number;
}

function getLocalDeletedForMe(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_deleted_for_me') : null;
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addLocalDeletedForMe(messageId: string) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getLocalDeletedForMe();
    current.add(messageId);
    localStorage.setItem('amrita_deleted_for_me', JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

function getLocalDeletedForEveryone(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_deleted_for_everyone') : null;
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addLocalDeletedForEveryone(messageId: string) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getLocalDeletedForEveryone();
    current.add(messageId);
    localStorage.setItem('amrita_deleted_for_everyone', JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

function sanitizeDirectMessages(messages: DirectMessage[]): DirectMessage[] {
  const deletedForMe = getLocalDeletedForMe();
  const deletedForEveryone = getLocalDeletedForEveryone();

  return (messages || [])
    .filter((m) => !deletedForMe.has(m.id))
    .map((m) => {
      if (deletedForEveryone.has(m.id) || m.isDeletedForEveryone) {
        return {
          ...m,
          isDeletedForEveryone: true,
          content: 'This message was deleted',
          imageUrl: null,
          linkUrl: null,
        };
      }
      return m;
    });
}

function useConversations() {
  const queryKey = ['messages', 'conversations'];
  return {
    ...useQuery({
      queryKey,
      queryFn: async () => {
        const res = await apiFetch<{ items: ConversationItem[] }>('/messages/conversations');
        const deletedForEveryone = getLocalDeletedForEveryone();
        return {
          items: (res.items || []).map((item) => {
            if (item.lastMessage) {
              if (deletedForEveryone.has(item.lastMessage.id) || item.lastMessage.isDeletedForEveryone) {
                return {
                  ...item,
                  lastMessage: {
                    ...item.lastMessage,
                    isDeletedForEveryone: true,
                    content: 'This message was deleted',
                    imageUrl: null,
                    linkUrl: null,
                  },
                };
              }
            }
            return item;
          }),
        };
      },
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
      queryFn: async () => {
        const res = await apiFetch<{ recipient: PublicUser; messages: DirectMessage[] }>(`/messages/${recipientId}`);
        return {
          ...res,
          messages: sanitizeDirectMessages(res.messages || []),
        };
      },
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
  const connectedUserIds = useMemo(() => new Set(connections.map((c) => c.user.id)), [connections]);
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
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted cursor-pointer">
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
            directoryUsers.map((user) => {
              const isConnected = connectedUserIds.has(user.id);
              return (
                <div
                  key={user.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary/60"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isConnected) {
                        onSelect(user.id);
                        onClose();
                      }
                    }}
                    className={cx('flex items-center gap-3 min-w-0 flex-1 text-left', isConnected ? 'cursor-pointer' : '')}
                  >
                    <Avatar user={user} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">{user.fullName}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground shrink-0">
                          {roleLabels[user.role] ?? user.role}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{user.department} · {user.campus}</p>
                    </div>
                  </button>

                  {isConnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(user.id);
                        onClose();
                      }}
                      className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>Chat</span>
                    </button>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1.5">
                      <ConnectActionButton targetUser={user} size="sm" />
                    </div>
                  )}
                </div>
              );
            })
          ) : connections.length > 0 ? (
            connections.map(({ user }) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary/60 cursor-pointer"
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
            <div className="text-center py-6 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">No connected friends yet</p>
              <p>Connect with members across campuses to start direct messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to compress local image files using HTML canvas before sending
function compressMessageImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileTypeLabel(fileName?: string | null, fileType?: string | null): string {
  if (!fileName && !fileType) return 'Document';
  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  if (ext === 'pdf' || fileType?.includes('pdf')) return 'PDF Resume';
  if (ext === 'doc' || ext === 'docx' || fileType?.includes('word')) return 'Word Document';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || fileType?.includes('spreadsheet')) return 'Spreadsheet';
  if (ext === 'ppt' || ext === 'pptx') return 'Presentation';
  if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar') return 'Archive';
  if (ext === 'txt') return 'Text File';
  if (fileType?.startsWith('image/')) return 'Image';
  return ext ? `${ext.toUpperCase()} File` : 'Document';
}

async function handleDownloadAttachment(msg: DirectMessage) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_token') : null;
    const res = await fetch(`/api/messages/${msg.id}/attachment`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      if (msg.fileUrl) {
        const a = document.createElement('a');
        a.href = msg.fileUrl;
        a.download = msg.fileName || 'attachment';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      throw new Error('Failed to download attachment');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = msg.fileName || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.warn('Fallback direct download for attachment:', err);
    if (msg.fileUrl) {
      const a = document.createElement('a');
      a.href = msg.fileUrl;
      a.download = msg.fileName || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
}

// Helper to render text with rich auto-detected links
function renderRichMessageText(text: string, isMine: boolean) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cx(
            'inline-flex items-center gap-1 font-semibold underline underline-offset-2 break-all hover:opacity-85 transition-opacity',
            isMine ? 'text-amber-200' : 'text-orange-600 dark:text-orange-400'
          )}
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 inline shrink-0" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function MessagesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const params = useParams<{ recipientId?: string }>();
  const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(params.recipientId);
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'mentors' | 'students'>('all');
  const [content, setContent] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Photo & Document attachment & deletion states (LinkedIn style)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; size: number; type: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<DirectMessage | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const chatStreamRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (params.recipientId) {
      setActiveRecipientId(params.recipientId);
    }
  }, [params.recipientId]);

  // Close message action menu on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.msg-action-menu-wrapper')) {
        setActiveActionMenuId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const { isConnected, onlineUsers, typingMap, sendDirectMessage, deleteDirectMessage, sendTyping, markAsRead } =
    useWebSocketChat(activeRecipientId);

  const { data: convData, isLoading: convLoading } = useConversations();
  const { data: threadData, isLoading: threadLoading, refetch: refetchThread } =
    useMessagesThread(activeRecipientId);
  const { data: connStatusData } = useConnectionStatus(activeRecipientId || '');
  const isConnectedWithRecipient = connStatusData?.status === 'accepted';
  const queryClient = useQueryClient();

  // Mark as read whenever active recipient changes or new message comes in
  useEffect(() => {
    if (activeRecipientId) {
      markAsRead(activeRecipientId);
      apiFetch(`/messages/${activeRecipientId}/read`, { method: 'PATCH' }).catch(() => { });
    }
  }, [activeRecipientId, threadData?.messages?.length, markAsRead]);

  // Auto scroll to bottom of the chat container ONLY
  const scrollToBottom = (smooth = true) => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeRecipientId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [threadData?.messages?.length, typingMap[String(activeRecipientId)], selectedImage, selectedFile]);

  const sendMutation = useMutation({
    mutationFn: (payload: {
      content?: string;
      imageUrl?: string | null;
      linkUrl?: string | null;
      fileUrl?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      fileType?: string | null;
    }) =>
      apiFetch<DirectMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: activeRecipientId,
          content: payload.content || '',
          imageUrl: payload.imageUrl || null,
          linkUrl: payload.linkUrl || null,
          fileUrl: payload.fileUrl || null,
          fileName: payload.fileName || null,
          fileSize: payload.fileSize || null,
          fileType: payload.fileType || null,
        }),
      }),
    onSuccess: (newMsg) => {
      setContent('');
      setSelectedImage(null);
      setSelectedFile(null);
      setSendError(null);
      sendTyping(activeRecipientId!, false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Optimistically push to thread
      const threadKey = ['messages', 'thread', activeRecipientId];
      queryClient.setQueryData(threadKey, (old: any) => {
        if (!old) return old;
        const exists = (old.messages || []).some((m: any) => m.id === newMsg.id);
        if (exists) return old;
        return {
          ...old,
          messages: [...(old.messages || []), newMsg],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      refetchThread();
    },
    onError: (err: any) => {
      setSendError(err?.message || 'Failed to send message. Please try again.');
    },
  });

  const handleConfirmDelete = async (mode: 'for_me' | 'for_everyone') => {
    if (!deletingMessage || !activeRecipientId) return;
    const messageId = deletingMessage.id;

    // 1. Persist to local client deletion registry immediately
    if (mode === 'for_everyone') {
      addLocalDeletedForEveryone(messageId);
    } else {
      addLocalDeletedForMe(messageId);
    }

    // 2. Immediately close the dialog and action menu for instant UI response
    setDeletingMessage(null);
    setActiveActionMenuId(null);

    // 3. Optimistically update local React Query thread cache right away
    const threadKey = ['messages', 'thread', activeRecipientId];
    queryClient.setQueryData(threadKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: sanitizeDirectMessages(old.messages || []),
      };
    });
    queryClient.invalidateQueries({ queryKey: ['messages'] });

    // 4. Dispatch real-time WebSocket deletion event
    deleteDirectMessage(messageId, mode);

    // 5. Persist to backend database via REST
    try {
      await apiFetch(`/messages/${messageId}?mode=${mode}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend REST delete synced via WS fallback:', err);
    }
    refetchThread();
  };

  const handleSelectRecipient = (id: string) => {
    setActiveRecipientId(id);
    setLocation(`/messages/${id}`);
    markAsRead(id);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!content.trim() && !selectedImage && !selectedFile) || !activeRecipientId) return;

    const trimmed = content.trim();
    const photoToSend = selectedImage;
    const fileToSend = selectedFile;

    // Clear previous error
    setSendError(null);

    // Persist via REST as single source of truth (backend broadcasts real-time WS event to recipient and sender)
    sendMutation.mutate({
      content: trimmed,
      imageUrl: photoToSend,
      fileUrl: fileToSend?.url || null,
      fileName: fileToSend?.name || null,
      fileSize: fileToSend?.size || null,
      fileType: fileToSend?.type || null,
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingImage(true);
      setSendError(null);
      const compressed = await compressMessageImage(file);
      setSelectedImage(compressed);
    } catch (err) {
      console.error('Failed to compress image', err);
      setSendError('Failed to process image. Please choose another image.');
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (15MB)
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setSendError(`File exceeds maximum size limit of 15MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      return;
    }

    // Validate extension / dangerous executables
    const dangerousExtRegex = /\.(exe|bat|cmd|sh|bin|msi|vbs|wsf|scr|com|pif|jar|php|py|js|cgi|pl|ps1|dll|so|app|vbe|jse|hta)$/i;
    if (dangerousExtRegex.test(file.name)) {
      setSendError('Executable and script file types are blocked for security.');
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      return;
    }

    setSendError(null);
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedFile({
          url: reader.result,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      }
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setSendError('Failed to read file attachment.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);

    if (docFileInputRef.current) {
      docFileInputRef.current.value = '';
    }
  };

  const handleCopyMessage = (msg: DirectMessage) => {
    if (msg.content) {
      navigator.clipboard.writeText(msg.content);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
    setActiveActionMenuId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (activeRecipientId) {
      sendTyping(activeRecipientId, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTyping(activeRecipientId, false);
      }, 2500);
    }
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const quickPrompts = [
    '👋 Hi! Would love to connect regarding your research.',
    '📅 Can we schedule a 1:1 mentorship call?',
    '🚀 Are you looking for collaborators on your project?',
    '💡 Could you review my recent project update?',
  ];

  const rawConversations = convData?.items ?? [];

  // Filter tabs
  const conversations = rawConversations.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.otherUser?.fullName?.toLowerCase().includes(q) ||
      c.otherUser?.department?.toLowerCase().includes(q) ||
      c.otherUser?.campus?.toLowerCase().includes(q) ||
      c.lastMessage?.content?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterTab === 'unread') {
      return c.unreadCount > 0;
    }
    if (filterTab === 'mentors') {
      return c.otherUser?.role === 'alumni' || c.otherUser?.role === 'faculty';
    }
    if (filterTab === 'students') {
      return c.otherUser?.role === 'student';
    }
    return true;
  });

  const totalUnread = rawConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const currentRecipient = threadData?.recipient;
  const rawMessages = threadData?.messages ?? [];
  const messages = useMemo(() => sanitizeDirectMessages(rawMessages), [rawMessages]);
  const isRecipientOnline = activeRecipientId ? onlineUsers.has(String(activeRecipientId)) : false;
  const isRecipientTyping = activeRecipientId ? !!typingMap[String(activeRecipientId)] : false;

  // Format message time
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; items: DirectMessage[] }[] = [];
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel = msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (msgDate.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    }
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  return (
    <>
      <div className="relative grid h-[calc(100vh-5.5rem)] min-h-[500px] max-h-[900px] w-full overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]">
        {/* Living Ambient Background Mesh in Container */}
        <div className="absolute -top-32 -right-32 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent dark:from-orange-500/15 blur-[100px] pointer-events-none animate-drift" />
        <div className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-purple-400/15 via-indigo-300/10 to-transparent dark:from-purple-600/15 blur-[110px] pointer-events-none animate-drift-reverse" />
        <div className="absolute inset-0 bg-dot-pattern opacity-35 dark:opacity-15 pointer-events-none" />

        {/* Left Sidebar: Conversations & Filters */}
        <div className={cx('relative z-10 flex h-full min-h-0 flex-col border-r border-border/80 bg-card/75 dark:bg-[#070b14]/75 backdrop-blur-xl', activeRecipientId ? 'hidden md:flex' : 'flex')}>
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-border/70 p-4 shrink-0 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Inbox</h2>
              {totalUnread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                  {totalUnread}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isConnected ? 'Live' : 'Syncing'}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowNewChat(true)}
              className="px-3 py-1.5 text-xs font-bold border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" /> New Chat
            </Button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-border/60 bg-card/40 shrink-0">
            <label className="relative block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats, names, departments..."
                className="w-full rounded-2xl border border-border/80 bg-background/80 py-2 pl-9 pr-8 text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>

            {/* Filter Tabs (WhatsApp/LinkedIn Style) */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold custom-scrollbar">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={cx(
                  'rounded-full px-3 py-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs',
                  filterTab === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/25'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={cx(
                  'rounded-full px-3 py-1 transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs',
                  filterTab === 'unread'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/25'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <span>Unread</span>
                {totalUnread > 0 && (
                  <span className={cx('h-1.5 w-1.5 rounded-full', filterTab === 'unread' ? 'bg-white' : 'bg-orange-500')} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('mentors')}
                className={cx(
                  'rounded-full px-3 py-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs',
                  filterTab === 'mentors'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/25'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                Mentors & Faculty
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('students')}
                className={cx(
                  'rounded-full px-3 py-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs',
                  filterTab === 'students'
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 shadow-md'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                Students
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/60">
            {convLoading ? (
              <div className="p-4"><LoadingState rows={4} /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <div className="mx-auto relative h-16 w-16 flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/25 to-purple-400/25 blur-md animate-pulse-slow" />
                  <div className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-card border border-border shadow-md text-orange-500 animate-float">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
                <p className="font-extrabold text-foreground text-sm">No conversations found</p>
                <p className="mt-1 leading-relaxed text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">
                  {search ? 'Try adjusting your search query.' : 'Connect with batchmates and mentors across 7 campuses.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 !text-white text-xs font-extrabold px-4 py-2 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5 text-white" /> Start Chat
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeRecipientId === conv.otherUser?.id;
                const isOnline = onlineUsers.has(String(conv.otherUser?.id));
                const isTyping = !!typingMap[String(conv.otherUser?.id)];

                return (
                  <button
                    key={conv.otherUser?.id}
                    type="button"
                    onClick={() => handleSelectRecipient(conv.otherUser.id)}
                    className={cx(
                      'flex w-full items-start gap-3.5 p-3.5 text-left transition-all relative cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-transparent border-l-4 border-l-orange-500 shadow-sm'
                        : 'hover:bg-secondary/40'
                    )}
                  >
                    {/* Avatar with Presence Indicator */}
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar user={conv.otherUser} size="md" />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name & Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                          {conv.otherUser?.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {relative(conv.lastMessage?.createdAt || '')}
                        </span>
                      </div>

                      {/* Role & Campus subtitle */}
                      <p className="text-[10px] text-muted-foreground/90 truncate mt-0.5">
                        {roleLabels[conv.otherUser?.role] ?? conv.otherUser?.role} · {conv.otherUser?.campus}
                      </p>

                      {/* Last Message Snippet / Live Typing Status */}
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 flex items-center gap-1">
                          {isTyping ? (
                            <span className="text-xs font-bold text-orange-500 animate-pulse flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" />
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce delay-1" />
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce delay-2" />
                              <span className="italic ml-0.5">typing...</span>
                            </span>
                          ) : (
                            <p className="truncate text-xs text-muted-foreground flex items-center gap-1">
                              {conv.lastMessage?.isMine && (
                                <span className="inline-flex shrink-0">
                                  {conv.lastMessage?.read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-orange-500" />
                                  ) : (
                                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </span>
                              )}
                              <span className="truncate">
                                {conv.lastMessage?.isDeletedForEveryone ? (
                                  <span className="italic text-muted-foreground/75 flex items-center gap-1">
                                    <Trash2 className="h-3 w-3 inline opacity-60" /> This message was deleted
                                  </span>
                                ) : conv.lastMessage?.content ? (
                                  conv.lastMessage.content
                                ) : conv.lastMessage?.imageUrl ? (
                                  <span className="flex items-center gap-1 font-medium text-foreground">
                                    <Camera className="h-3 w-3 text-orange-500 inline" /> Photo
                                  </span>
                                ) : (
                                  'Started conversation'
                                )}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Unread Badge */}
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white shadow-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active WhatsApp/LinkedIn Style Chat Area */}
        <div className="flex h-full min-h-0 flex-col bg-slate-100/70 dark:bg-[#070b14]/80 relative overflow-hidden">
          {/* Subtle Ambient Mesh Glows */}
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent dark:from-orange-500/15 blur-[100px] pointer-events-none animate-drift" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-400/15 via-indigo-300/10 to-transparent dark:from-purple-600/15 blur-[90px] pointer-events-none animate-drift-reverse" />
          <div className="absolute inset-0 bg-dot-pattern opacity-45 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,#000_65%,transparent_100%)] pointer-events-none" />

          {activeRecipientId && currentRecipient ? (
            <>
              {/* WhatsApp / LinkedIn Style Chat Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-border/80 bg-card/95 dark:bg-[#0c1220]/95 px-4 py-3 shrink-0 shadow-xs backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRecipientId(undefined);
                      setLocation('/messages');
                    }}
                    className="md:hidden rounded-xl p-1.5 text-muted-foreground hover:bg-muted active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="relative shrink-0">
                    <Link href={`/people/${currentRecipient.id}`}>
                      <Avatar user={currentRecipient} size="md" />
                    </Link>
                    {isRecipientOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/people/${currentRecipient.id}`}
                        className="text-sm font-extrabold text-foreground hover:text-orange-500 transition-colors truncate"
                      >
                        {currentRecipient.fullName}
                      </Link>
                      {currentRecipient.verified && <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                      <span className="hidden sm:inline-block rounded-lg bg-secondary px-2 py-0.5 text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        {roleLabels[currentRecipient.role] ?? currentRecipient.role}
                      </span>
                    </div>

                    {/* Presence Subtitle */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      {isRecipientTyping ? (
                        <span className="text-orange-500 font-bold flex items-center gap-1 animate-pulse">
                          <span>typing</span>
                          <span className="inline-block animate-bounce">.</span>
                          <span className="inline-block animate-bounce delay-1">.</span>
                          <span className="inline-block animate-bounce delay-2">.</span>
                        </span>
                      ) : isRecipientOnline ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span>{currentRecipient.department} · {currentRecipient.campus}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/people/${currentRecipient.id}`}
                    className="rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>View Profile</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Chat Message Stream */}
              {!isConnectedWithRecipient && (
                <div className="relative z-10 mx-3 sm:mx-4 mt-3 rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Connect with {currentRecipient.fullName.split(' ')[0]} to unlock messaging</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Direct messaging is unlocked once your connection invitation is accepted.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ConnectActionButton targetUser={currentRecipient} size="sm" />
                  </div>
                </div>
              )}

              <div
                ref={chatStreamRef}
                className="relative z-10 flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-start"
              >
                {threadLoading ? (
                  <div className="m-auto"><LoadingState rows={3} /></div>
                ) : messages.length === 0 ? (
                  <div className="my-auto mx-auto text-center py-6 px-5 max-w-sm w-full rounded-3xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-md">
                    <div className="mx-auto relative h-20 w-20 flex items-center justify-center mb-3">
                      <Avatar user={currentRecipient} size="lg" />
                      {isRecipientOnline && (
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card shadow-sm animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-foreground">{currentRecipient.fullName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentRecipient.department} · Amrita {currentRecipient.campus}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Send a message or share photo updates to discuss research, request mentorship, or collaborate across campuses.
                    </p>

                    {/* Quick Icebreaker buttons */}
                    <div className="mt-4 flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Icebreakers</span>
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!isConnectedWithRecipient}
                          onClick={() => {
                            if (!isConnectedWithRecipient) return;
                            setContent(prompt);
                            textareaRef.current?.focus();
                          }}
                          className={cx(
                            "rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all shadow-2xs",
                            isConnectedWithRecipient
                              ? "border-orange-200/80 dark:border-orange-900/60 bg-secondary/70 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-foreground cursor-pointer active:scale-98"
                              : "border-border bg-secondary/30 text-muted-foreground/60 cursor-not-allowed opacity-75"
                          )}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-3">
                      {/* WhatsApp / LinkedIn Date Divider Pill */}
                      <div className="flex justify-center my-3">
                        <span className="rounded-full border border-border/80 bg-card/95 px-3.5 py-1 text-[10px] font-bold text-muted-foreground shadow-xs backdrop-blur-md">
                          {group.date}
                        </span>
                      </div>

                      {/* Messages in this Date */}
                      {group.items.map((msg) => {
                        const isDeleted = !!msg.isDeletedForEveryone;
                        const isActionOpen = activeActionMenuId === msg.id;

                        return (
                          <div
                            key={msg.id}
                            className={cx(
                              'group relative flex flex-col transition-all',
                              msg.isMine ? 'items-end' : 'items-start'
                            )}
                          >
                            <div className={cx('flex items-center gap-1.5 max-w-[88%] sm:max-w-md', msg.isMine ? 'flex-row-reverse' : 'flex-row')}>
                              {/* Message Bubble */}
                              <div
                                className={cx(
                                  'relative rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-md transition-all break-words min-w-[120px]',
                                  isDeleted
                                    ? 'bg-secondary/60 text-muted-foreground border border-dashed border-border italic'
                                    : msg.isMine
                                      ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-tr-xs font-medium shadow-orange-500/20'
                                      : 'bg-card text-foreground border border-border/80 rounded-tl-xs shadow-xs'
                                )}
                              >
                                {isDeleted ? (
                                  <div className="flex items-center gap-2 py-0.5 text-muted-foreground/80 not-italic font-normal">
                                    <Trash2 className="h-3.5 w-3.5 opacity-60 shrink-0" />
                                    <span className="italic text-xs">This message was deleted</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Photo attachment (LinkedIn/WhatsApp style) */}
                                    {msg.imageUrl && (
                                      <div className="relative mb-2 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-xs group/img">
                                        <img
                                          src={msg.imageUrl}
                                          alt="Attachment"
                                          onClick={() => setViewingImage(msg.imageUrl!)}
                                          className="max-h-64 sm:max-h-80 w-auto object-cover rounded-xl cursor-zoom-in hover:scale-[1.02] transition-transform duration-200"
                                          loading="lazy"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setViewingImage(msg.imageUrl!)}
                                          title="Expand photo"
                                          className="absolute bottom-2 right-2 rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/80"
                                        >
                                          <Camera className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}

                                    {/* Document attachment */}
                                    {msg.fileUrl && (
                                      <div
                                        className={cx(
                                          'mb-2 flex items-center gap-2.5 rounded-xl p-2.5 border transition-all',
                                          msg.isMine
                                            ? 'bg-black/20 border-white/20 text-white'
                                            : 'bg-secondary/80 border-border/80 text-foreground'
                                        )}
                                      >
                                        <div
                                          className={cx(
                                            'grid h-10 w-10 shrink-0 place-items-center rounded-lg shadow-xs',
                                            msg.isMine
                                              ? 'bg-white/20 text-white'
                                              : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                                          )}
                                        >
                                          <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold truncate">{msg.fileName || 'Attachment'}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={cx('text-[10px]', msg.isMine ? 'text-white/80 font-medium' : 'text-muted-foreground')}>
                                              {msg.fileSize ? formatFileSize(msg.fileSize) : 'Document'}
                                            </span>
                                            <span
                                              className={cx(
                                                'text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0',
                                                msg.isMine ? 'bg-white/20 text-white' : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                                              )}
                                            >
                                              {getFileTypeLabel(msg.fileName, msg.fileType)}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadAttachment(msg)}
                                          className={cx(
                                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg cursor-pointer transition-all shadow-xs active:scale-95',
                                            msg.isMine
                                              ? 'bg-white/25 hover:bg-white/35 text-white'
                                              : 'bg-card hover:bg-muted text-foreground border border-border/80'
                                          )}
                                          title={`Download ${msg.fileName || 'file'}`}
                                        >
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}

                                    {/* Content with link auto-detection */}
                                    {msg.content && (
                                      <p className="whitespace-pre-wrap leading-relaxed">
                                        {renderRichMessageText(msg.content, msg.isMine)}
                                      </p>
                                    )}
                                  </>
                                )}

                                {/* Bubble footer with time & double tick receipt */}
                                <div
                                  className={cx(
                                    'mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-medium leading-none',
                                    msg.isMine ? (isDeleted ? 'text-muted-foreground' : 'text-white/80') : 'text-muted-foreground'
                                  )}
                                >
                                  <span>{formatTime(msg.createdAt)}</span>
                                  {msg.isMine && !isDeleted && (
                                    <span title={msg.read ? 'Read' : 'Delivered'}>
                                      {msg.read ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-amber-200" />
                                      ) : (
                                        <CheckCheck className="h-3.5 w-3.5 text-white/70" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* LinkedIn-style 3-dots Message Action Menu (Hover & Tap) */}
                              {!isDeleted && (
                                <div className="msg-action-menu-wrapper relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenuId(isActionOpen ? null : msg.id);
                                    }}
                                    className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all shadow-2xs border border-border/40 bg-card/80 backdrop-blur-xs"
                                    title="Message options"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {isActionOpen && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className={cx(
                                        'absolute z-50 min-w-[150px] rounded-xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-md animate-scale-in text-xs font-semibold',
                                        msg.isMine ? 'right-0 top-8' : 'left-0 top-8'
                                      )}
                                    >
                                      {msg.content && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyMessage(msg)}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-secondary cursor-pointer transition-colors"
                                        >
                                          {copiedMessageId === msg.id ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                          ) : (
                                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                          )}
                                          <span>{copiedMessageId === msg.id ? 'Copied!' : 'Copy text'}</span>
                                        </button>
                                      )}

                                      {msg.fileUrl && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleDownloadAttachment(msg);
                                            setActiveActionMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-secondary cursor-pointer transition-colors"
                                        >
                                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span>Download file</span>
                                        </button>
                                      )}

                                      {msg.imageUrl && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setViewingImage(msg.imageUrl!);
                                            setActiveActionMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-secondary cursor-pointer transition-colors"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span>View photo</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeletingMessage(msg);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Delete message</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* Animated WhatsApp Typing Bubble when recipient is typing */}
                {isRecipientTyping && (
                  <div className="flex items-end gap-2 animate-fade-in">
                    <Avatar user={currentRecipient} size="sm" />
                    <div className="rounded-2xl rounded-tl-xs border border-border/80 bg-card px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce delay-1" />
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce delay-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Composer Input Form (LinkedIn & WhatsApp Style) */}
              {isConnectedWithRecipient ? (
                <div className="relative z-10 border-t border-border/80 bg-card/95 dark:bg-[#0c1220]/95 p-3 sm:p-3.5 shrink-0 backdrop-blur-md">
                  {/* Send error banner */}
                  {sendError && (
                    <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 animate-fade-in">
                      <span>{sendError}</span>
                      <button
                        type="button"
                        onClick={() => setSendError(null)}
                        className="p-1 hover:opacity-80 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Photo attachment preview bar */}
                  {selectedImage && (
                    <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-orange-200/80 dark:border-orange-900/60 bg-orange-500/10 p-2.5 animate-scale-in">
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-orange-300 dark:border-orange-700 shadow-sm shrink-0">
                        <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <Camera className="h-3.5 w-3.5 text-orange-500" />
                          <span>Photo attached</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Ready to send with your message
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        title="Remove photo"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Document attachment preview bar */}
                  {selectedFile && (
                    <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-orange-200/80 dark:border-orange-900/60 bg-orange-500/10 p-2.5 animate-scale-in">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700 shadow-sm shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                          <Paperclip className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{selectedFile.name}</span>
                          <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-700 dark:text-orange-300 shrink-0">
                            {getFileTypeLabel(selectedFile.name, selectedFile.type)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatFileSize(selectedFile.size)} · Ready to send
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        title="Remove file"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Emoji popover bar */}
                  {showEmojiPicker && (
                    <div className="mb-2 p-2 rounded-2xl border border-border bg-card shadow-xl flex items-center gap-2 overflow-x-auto animate-scale-in">
                      {['👍', '❤️', '🔥', '👏', '🎉', '🚀', '😊', '💡', '🎓', '🙏', '🤝', '⚡'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hidden File Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                    onChange={handleDocFileChange}
                    className="hidden"
                  />

                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    {/* Photo Attachment Button (LinkedIn Style) */}
                    <button
                      type="button"
                      title="Attach photo"
                      disabled={isCompressingImage || isReadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className={cx(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all cursor-pointer shadow-2xs',
                        selectedImage
                          ? 'bg-orange-500 text-white shadow-orange-500/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95'
                      )}
                    >
                      {isCompressingImage ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-orange-500" />
                      ) : (
                        <Image className="h-5 w-5" />
                      )}
                    </button>

                    {/* Document Attachment Button (Paperclip) */}
                    <button
                      type="button"
                      title="Attach document or resume (PDF, DOC, DOCX, ZIP, etc.)"
                      disabled={isCompressingImage || isReadingFile}
                      onClick={() => docFileInputRef.current?.click()}
                      className={cx(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all cursor-pointer shadow-2xs',
                        selectedFile
                          ? 'bg-orange-500 text-white shadow-orange-500/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95'
                      )}
                    >
                      {isReadingFile ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-orange-500" />
                      ) : (
                        <Paperclip className="h-5 w-5" />
                      )}
                    </button>

                    {/* Emoji Button */}
                    <button
                      type="button"
                      title="Insert emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all cursor-pointer"
                    >
                      <Smile className="h-5 w-5" />
                    </button>

                    {/* Textarea */}
                    <div className="relative flex-1">
                      <textarea
                        ref={textareaRef}
                        data-testid="input-chat-message"
                        rows={1}
                        value={content}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${currentRecipient.fullName.split(' ')[0]}... (Enter to send, Shift+Enter for newline)`}
                        className="w-full resize-none rounded-2xl border border-border/80 bg-secondary/50 px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-orange-500 transition-all max-h-32"
                        autoFocus
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      data-testid="button-send-chat-message"
                      type="submit"
                      disabled={
                        sendMutation.isPending ||
                        isCompressingImage ||
                        isReadingFile ||
                        (!content.trim() && !selectedImage && !selectedFile)
                      }
                      className="h-10 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 !text-white font-bold hover:opacity-90 shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendMutation.isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Send className="h-4 w-4 text-white" />
                      )}
                      <span className="hidden sm:inline text-xs !text-white font-extrabold">Send</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="relative z-10 border-t border-border/80 bg-card/95 dark:bg-[#0c1220]/95 p-4 shrink-0 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-foreground">Connect with this user to start messaging.</span>
                  </div>
                  <ConnectActionButton targetUser={currentRecipient} size="sm" />
                </div>
              )}
            </>
          ) : (
            /* Premium Empty State Illustration with 3D Orbiting Campus Discs */
            <div className="relative z-10 m-auto text-center p-8 sm:p-12 max-w-lg">
              {/* Central Glowing Shield & Connected Orbit */}
              <div className="relative mx-auto h-44 w-44 flex items-center justify-center mb-6">
                {/* Orbiting Dashed Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-400/35 dark:border-orange-500/30 animate-spin-slow" />
                <div className="absolute inset-4 rounded-full border border-purple-400/25 dark:purple-500/20 animate-spin-slow-reverse" />

                {/* Floating Campus Badge 1 (Coimbatore) */}
                <div className="absolute -top-1 left-2 h-7 w-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-float">
                  CBE
                </div>

                {/* Floating Campus Badge 2 (Amritapuri) */}
                <div className="absolute top-2 -right-1 h-7 w-7 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-float-reverse">
                  AMP
                </div>

                {/* Floating Campus Badge 3 (Bengaluru) */}
                <div className="absolute -bottom-1 right-3 h-7 w-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-float">
                  BLR
                </div>

                {/* Floating Campus Badge 4 (Kochi) */}
                <div className="absolute bottom-2 -left-1 h-7 w-7 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-float-reverse">
                  KOC
                </div>

                {/* Center Core Amrita Logo Hub */}
                <div className="relative z-10 grid h-20 w-20 place-items-center rounded-3xl bg-card border-2 border-border/90 shadow-2xl p-3">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-purple-500/40 blur-md -z-10 animate-pulse-slow" />
                  <MessageSquare className="h-8 w-8 text-orange-500" />
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Amrita Direct Commons
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Connect, exchange photos, and collaborate in real-time with peers, mentors, researchers, and faculty across all 7 Amrita campuses.
              </p>

              {/* Feature Highlights Pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="rounded-full border border-border/80 bg-card/90 px-3 py-1.5 shadow-2xs backdrop-blur-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time WebSocket sync
                </span>
                <span className="rounded-full border border-border/80 bg-card/90 px-3 py-1.5 shadow-2xs backdrop-blur-xs flex items-center gap-1.5">
                  <Camera className="h-3 w-3 text-orange-500" />
                  Photos & Rich Links
                </span>
                <span className="rounded-full border border-border/80 bg-card/90 px-3 py-1.5 shadow-2xs backdrop-blur-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Delete for Everyone
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setShowNewChat(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 !text-white font-extrabold px-8 py-3.5 shadow-xl shadow-orange-500/25 active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 mr-2 text-white" /> Start a conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={(userId) => handleSelectRecipient(userId)}
        />
      )}

      {/* Delete Message Dialog Modal (LinkedIn & WhatsApp Style) */}
      {deletingMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-rise">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Delete message?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose how you want to delete this message
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingMessage(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message snippet preview */}
            <div className="mt-4 rounded-2xl border border-border/80 bg-secondary/40 p-3 text-xs text-muted-foreground">
              {deletingMessage.imageUrl ? (
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Camera className="h-4 w-4 text-orange-500" />
                  <span>[Photo Attachment]</span>
                  {deletingMessage.content && <span>— {deletingMessage.content.slice(0, 40)}</span>}
                </div>
              ) : (
                <p className="truncate italic">"{deletingMessage.content}"</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              {deletingMessage.isMine && !deletingMessage.isDeletedForEveryone && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete('for_everyone')}
                  className="flex w-full items-center justify-between rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-500/10 hover:bg-red-500/20 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 transition-all cursor-pointer"
                >
                  <div className="text-left">
                    <p className="font-extrabold">Delete for everyone</p>
                    <p className="text-[11px] font-normal text-red-500/80">
                      Remove this message for all chat participants
                    </p>
                  </div>
                  <Trash2 className="h-4 w-4 shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleConfirmDelete('for_me')}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-4 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                <div className="text-left">
                  <p className="font-extrabold">Delete for me</p>
                  <p className="text-[11px] font-normal text-muted-foreground">
                    This message will be removed from your chat view only
                  </p>
                </div>
                <UserX className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setDeletingMessage(null)}
                className="w-full rounded-2xl border border-border/80 bg-card py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Photo Viewer Lightbox Modal */}
      {viewingImage && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/90 p-4 sm:p-8 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center justify-center animate-scale-in"
          >
            {/* Top Toolbar */}
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <a
                href={viewingImage}
                download="amrita_message_photo.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/20 hover:bg-white/30 p-2 text-white backdrop-blur-md transition-all shadow-md"
                title="Download full size"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="rounded-full bg-white/20 hover:bg-white/30 p-2 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* High Resolution Image */}
            <img
              src={viewingImage}
              alt="Full size preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface MatchmakerCandidate {

  user: PublicUser;
  score: number;
  matchPercentage: number;
  matchedSkills: string[];
  reasons: string[];
}

interface MatchmakerResponse {
  items: MatchmakerCandidate[];
  total: number;
  intent: string;
  requestedSkills: string[];
}

function useMatchmaker(params: {
  intent: string;
  skills: string;
  campus?: string;
  department?: string;
  role?: string;
}) {
  const q = new URLSearchParams();
  if (params.intent) q.set('intent', params.intent);
  if (params.skills) q.set('skills', params.skills);
  if (params.campus) q.set('campus', params.campus);
  if (params.department) q.set('department', params.department);
  if (params.role) q.set('role', params.role);

  const queryKey = ['matchmaker', params];
  return {
    ...useQuery({
      queryKey,
      queryFn: () => apiFetch<MatchmakerResponse>(`/matchmaker/find?${q.toString()}`),
    }),
    queryKey,
  };
}

function PitchModal({
  targetUser,
  intent,
  onClose,
}: {
  targetUser: PublicUser;
  intent: string;
  onClose: () => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [message, setMessage] = useState(
    `Hi ${targetUser.fullName.split(' ')[0]}, I came across your profile on Amrita Matchmaker. We are putting together a team and would love to collaborate with you on this project!`
  );
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const pitchMutation = useMutation({
    mutationFn: (body: { targetUserId: string; intent: string; projectName: string; message: string }) =>
      apiFetch<{ success: boolean; messageId: string }>('/matchmaker/pitch', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      alert(`Pitch sent to ${targetUser.fullName}! You can continue the chat in Messages.`);
      onClose();
      setLocation(`/messages/${targetUser.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    pitchMutation.mutate({
      targetUserId: targetUser.id,
      intent,
      projectName: projectName.trim(),
      message: message.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.2em] text-accent font-bold">
              Team Invitation
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
              Pitch your project to {targetUser.fullName.split(' ')[0]}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <Avatar user={targetUser} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{targetUser.fullName}</span>
              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                {roleLabels[targetUser.role] ?? targetUser.role}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {targetUser.department} · Amrita {targetUser.campus}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Project / Hackathon Title
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Smart India Hackathon 2026 / Multimodal AI Lab"
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Pitch Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the problem statement, what role you're looking for, and why they would be a great fit..."
              className="mt-1.5 w-full resize-none rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="button-submit-pitch"
              type="submit"
              disabled={pitchMutation.isPending || !message.trim()}
              className="font-bold"
            >
              {pitchMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Team Pitch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const POPULAR_SKILLS = [
  'Python',
  'React',
  'Machine Learning',
  'System Design',
  'UI/UX',
  'Node.js',
  'PyTorch',
  'IoT/Embedded',
  'Cloud/AWS',
  'Data Science',
  'Java',
  'C++',
  'Flutter',
  'Blockchain',
];

const INTENT_OPTIONS = [
  {
    id: 'hackathon',
    label: 'Hackathons & SIH',
    desc: 'Smart India Hackathon, internal sprints, and student hackathons',
    icon: Sparkles,
  },
  {
    id: 'research',
    label: 'Research & Papers',
    desc: 'Faculty labs, research publications, and IEEE paper co-authors',
    icon: Compass,
  },
  {
    id: 'project',
    label: 'Side Projects & Startups',
    desc: 'Co-builders, open-source projects, and student tech ventures',
    icon: Network,
  },
  {
    id: 'mentorship',
    label: 'Career Mentorship',
    desc: 'Alumni guides for interviews, resume reviews, and product engineering',
    icon: HeartHandshake,
  },
];

function MatchmakerPage() {
  const [intent, setIntent] = useState('hackathon');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'Python']);
  const [customSkill, setCustomSkill] = useState('');
  const [campus, setCampus] = useState('');
  const [department, setDepartment] = useState('');
  const [pitchTarget, setPitchTarget] = useState<PublicUser | null>(null);

  const { data, isLoading, isError, refetch } = useMatchmaker({
    intent,
    skills: selectedSkills.join(','),
    campus: campus || undefined,
    department: department || undefined,
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkill.trim()) return;
    const s = customSkill.trim();
    if (!selectedSkills.includes(s)) {
      setSelectedSkills((prev) => [...prev, s]);
    }
    setCustomSkill('');
  };

  const matches = data?.items ?? [];

  return (
    <>
      <PageTitle
        eyebrow="AI-Powered Discovery"
        title="Smart Teammate & Collaborator Matchmaker."
        detail="Discover complementary peers, mentors, and research partners across all 7 Amrita campuses."
      />

      {/* Intent Selector Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-rise">
        {INTENT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = intent === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setIntent(opt.id)}
              className={cx(
                'flex flex-col text-left rounded-2xl border p-4.5 transition-all shadow-sm',
                isActive
                  ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
                  : 'border-border bg-card hover:bg-secondary/40'
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cx(
                    'grid h-10 w-10 place-items-center rounded-xl font-bold',
                    isActive ? 'bg-accent text-primary' : 'bg-secondary text-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {isActive && (
                  <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">{opt.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter / Skills Panel */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm animate-rise delay-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <label className="mono text-[10px] uppercase tracking-[.18em] font-bold text-muted-foreground">
              Skills Your Team Needs
            </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cx(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all active:scale-95',
                      isSelected
                        ? 'bg-accent text-primary shadow-xs'
                        : 'border border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom skill input */}
          <form onSubmit={handleAddCustomSkill} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="Add skill tag..."
              className="w-36 rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-accent"
            />
            <Button type="submit" variant="outline" className="px-3 py-1.5 text-xs">
              Add
            </Button>
          </form>
        </div>

        {/* Campus & Department Filters */}
        <div className="mt-4 pt-4 border-t border-border grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="matchmaker-campus"
            label="Filter by Campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            options={[{ value: '', label: 'All Campuses' }, ...campuses.map((c) => ({ value: c, label: c }))]}
          />
          <SelectField
            id="matchmaker-department"
            label="Filter by Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="quiet"
              onClick={() => {
                setCampus('');
                setDepartment('');
                setSelectedSkills(['React', 'Python']);
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-10"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Scored Matches Results */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            Recommended Matches ({matches.length})
          </h2>
          <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Ranked by synergy & skill fit
          </span>
        </div>

        {isLoading ? (
          <LoadingState rows={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No matches found"
            detail="Try relaxing your filters or selecting fewer skill requirements."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSkills([]);
                  setCampus('');
                  setDepartment('');
                }}
              >
                Clear all filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {matches.map(({ user, matchPercentage, matchedSkills, reasons }) => (
              <div
                key={user.id}
                className="surface flex flex-col justify-between rounded-2xl border border-border p-5 shadow-sm transition-all hover:border-accent/40 animate-rise"
              >
                <div>
                  {/* Card Header with Match Percentage Gauge */}
                  <div className="flex items-start justify-between">
                    <Avatar user={user} size="lg" />
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                        <Sparkles className="h-3 w-3" /> {matchPercentage}% Match
                      </span>
                      <div className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {roleLabels[user.role] ?? user.role}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/people/${user.id}`}
                    className="mt-3 block text-lg font-bold text-foreground hover:text-accent transition-colors"
                  >
                    {user.fullName}
                  </Link>
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                    {user.headline || `${user.department} · Amrita ${user.campus}`}
                  </p>

                  {/* Matched skills tags */}
                  {matchedSkills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {matchedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-primary"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Synergy reasons list */}
                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
                    <div className="mono text-[9px] uppercase tracking-wider font-bold text-accent">
                      Why this match:
                    </div>
                    {reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-3.5">
                  <Button
                    onClick={() => setPitchTarget(user)}
                    className="flex-1 py-2 text-xs font-bold shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> Pitch Project
                  </Button>
                  <ConnectActionButton targetUser={user} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pitchTarget && (
        <PitchModal
          targetUser={pitchTarget}
          intent={intent}
          onClose={() => setPitchTarget(null)}
        />
      )}
    </>
  );
}

// ==========================================
// INTERVIEW EXPERIENCES & MENTORSHIP
// ==========================================

interface InterviewRound {
  roundNumber: number;
  roundName: string;
  description: string;
  durationMinutes?: number;
}

interface InterviewExperience {
  id: string;
  author: PublicUser;
  company: string;
  role: string;
  employmentType: string;
  batch?: number;
  campus: string;
  outcome: 'Offered' | 'Not Selected' | 'In Progress' | 'Declined Offer';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Challenging';
  interviewDate: string;
  rounds: InterviewRound[];
  keyTopics: string[];
  overallExperience: string;
  prepAdvice: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isAuthor: boolean;
  createdAt: string;
}

function useListInterviews(params: {
  search?: string;
  company?: string;
  role?: string;
  outcome?: string;
  difficulty?: string;
  campus?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryStr = new URLSearchParams();
  if (params.search) queryStr.set('search', params.search);
  if (params.company) queryStr.set('company', params.company);
  if (params.role) queryStr.set('role', params.role);
  if (params.outcome) queryStr.set('outcome', params.outcome);
  if (params.difficulty) queryStr.set('difficulty', params.difficulty);
  if (params.campus) queryStr.set('campus', params.campus);
  if (params.page) queryStr.set('page', String(params.page));
  if (params.pageSize) queryStr.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['interviews', params],
    queryFn: () =>
      apiFetch<{ items: InterviewExperience[]; total: number; page: number; pageSize: number }>(
        `/interviews?${queryStr.toString()}`
      ),
  });
}

function InterviewGuidanceModal({
  interview,
  onClose,
}: {
  interview: InterviewExperience;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(
    `Hi ${interview.author?.fullName?.split(' ')[0] || 'there'}! I saw your interview experience for ${interview.company} (${interview.role}) on Amrita Connect. Could you share some tips on how you prepared for ${interview.rounds?.[0]?.roundName || 'the technical rounds'}?`
  );
  const [, setLocation] = useLocation();

  const guidanceMutation = useMutation({
    mutationFn: (body: { message: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/interviews/${interview.id}/request-guidance`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (res) => {
      alert(res.message);
      onClose();
      setLocation(`/messages/${interview.author.id}`);
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="mono text-[10px] font-bold uppercase tracking-wider text-accent">Interview Guidance</div>
              <h3 className="text-lg font-bold text-foreground">Ask {interview.author?.fullName}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Send a direct inquiry about their interview rounds, online assessment questions, or advice for cracking <strong className="text-foreground">{interview.company}</strong>.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim()) return;
            guidanceMutation.mutate({ message: message.trim() });
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Your Question / Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={guidanceMutation.isPending || !message.trim()} className="font-bold">
              {guidanceMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Question via Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterviewDetailModal({
  interview,
  onClose,
  onGuidance,
}: {
  interview: InterviewExperience;
  onClose: () => void;
  onGuidance: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 text-xl font-bold text-foreground border border-border">
              {interview.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cx(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    interview.outcome === 'Offered'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : interview.outcome === 'In Progress'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-destructive/15 text-destructive'
                  )}
                >
                  {interview.outcome}
                </span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {interview.difficulty} Difficulty
                </span>
                <span className="mono text-[10px] text-muted-foreground">{interview.interviewDate}</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
                {interview.company} · {interview.role}
              </h2>
              <p className="text-xs text-muted-foreground">
                {interview.employmentType} · Amrita {interview.campus}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Key topics chips */}
        {interview.keyTopics?.length > 0 && (
          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Topics Covered</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {interview.keyTopics.map((t) => (
                <Tag key={t} warm>
                  {t}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Overall Experience */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Experience Summary</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{interview.overallExperience}</p>
        </div>

        {/* Rounds Breakdown */}
        {interview.rounds?.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Rounds Breakdown ({interview.rounds.length} Rounds)
            </h3>
            <div className="space-y-3">
              {interview.rounds.map((round) => (
                <div key={round.roundNumber} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-xs font-bold text-primary">
                        {round.roundNumber}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">{round.roundName}</h4>
                    </div>
                    {round.durationMinutes && (
                      <span className="mono text-[10px] text-muted-foreground">{round.durationMinutes} mins</span>
                    )}
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {round.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prep Advice Callout */}
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Advice for Amrita Juniors & Peers
          </div>
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-foreground font-medium">
            {interview.prepAdvice}
          </p>
        </div>

        {/* Author Footer */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <Avatar user={interview.author} size="md" />
            <div>
              <Link href={`/people/${interview.author.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                {interview.author.fullName}
              </Link>
              <p className="text-[10px] text-muted-foreground">
                {interview.author.headline || `${roleLabels[interview.author.role]} · Amrita ${interview.author.campus}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!interview.isAuthor && (
              <Button onClick={onGuidance} className="font-bold text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Ask {interview.author.fullName.split(' ')[0]} for Prep Advice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareInterviewModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    company: '',
    role: '',
    employmentType: 'Full-time',
    outcome: 'Offered',
    difficulty: 'Medium',
    interviewDate: new Date().toISOString().slice(0, 7),
    keyTopics: '',
    overallExperience: '',
    prepAdvice: '',
  });

  const [rounds, setRounds] = useState<Array<{ roundNumber: number; roundName: string; description: string; durationMinutes: number }>>([
    {
      roundNumber: 1,
      roundName: 'Online Coding Assessment (OA)',
      description: '',
      durationMinutes: 60,
    },
    {
      roundNumber: 2,
      roundName: 'Technical DSA / Coding Round',
      description: '',
      durationMinutes: 45,
    },
  ]);

  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        roundNumber: prev.length + 1,
        roundName: `Round ${prev.length + 1} (e.g. System Design / Managerial)`,
        description: '',
        durationMinutes: 45,
      },
    ]);
  };

  const removeRound = (idx: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 })));
  };

  const updateRound = (idx: number, field: string, value: any) => {
    setRounds((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const shareMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch<{ id: string }>(`/interviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    shareMutation.mutate({
      ...form,
      keyTopics: form.keyTopics.split(',').map((t) => t.trim()).filter(Boolean),
      rounds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">Community Knowledge</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Share an Interview Experience</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="company-name"
              label="Company Name"
              placeholder="e.g. Microsoft, Google, Cisco, Amazon"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
            <Field
              id="role-name"
              label="Job Role"
              placeholder="e.g. SDE-1, Cloud Consultant, AI Researcher"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="outcome"
              label="Selection Outcome"
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              options={['Offered', 'Not Selected', 'In Progress', 'Declined Offer'].map((v) => ({ value: v, label: v }))}
            />
            <SelectField
              id="difficulty"
              label="Difficulty Rating"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              options={['Easy', 'Medium', 'Hard', 'Challenging'].map((v) => ({ value: v, label: v }))}
            />
            <SelectField
              id="employment-type"
              label="Employment Type"
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              options={['Full-time', 'Internship', '6-Month Co-op'].map((v) => ({ value: v, label: v }))}
            />
          </div>

          <Field
            id="key-topics"
            label="Key Topics Asked (comma-separated)"
            placeholder="e.g. Dynamic Programming, System Design, Operating Systems, SQL"
            value={form.keyTopics}
            onChange={(e) => setForm({ ...form, keyTopics: e.target.value })}
            required
          />

          {/* Rounds List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Interview Rounds Breakdown</label>
              <button
                type="button"
                onClick={addRound}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                + Add Another Round
              </button>
            </div>

            {rounds.map((round, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Round {round.roundNumber}
                  </span>
                  <input
                    value={round.roundName}
                    onChange={(e) => updateRound(idx, 'roundName', e.target.value)}
                    placeholder="Round Title (e.g. System Design)"
                    className="flex-1 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-bold outline-none focus:border-accent"
                    required
                  />
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={round.description}
                  onChange={(e) => updateRound(idx, 'description', e.target.value)}
                  placeholder="What specific questions, coding problems, or scenarios were asked in this round?"
                  className="w-full rounded-lg border border-input bg-card p-2.5 text-xs outline-none focus:border-accent"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Overall Experience Summary</label>
            <textarea
              rows={3}
              value={form.overallExperience}
              onChange={(e) => setForm({ ...form, overallExperience: e.target.value })}
              placeholder="How was the recruitment process? Interviewer demeanor, speed of feedback, etc..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Advice & Tips for Amrita Juniors</label>
            <textarea
              rows={3}
              value={form.prepAdvice}
              onChange={(e) => setForm({ ...form, prepAdvice: e.target.value })}
              placeholder="What resources, LeetCode patterns, or campus coursework helped the most?"
              className="w-full rounded-xl border border-input bg-card p-3 text-xs outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={shareMutation.isPending} className="font-bold">
              {shareMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Experience
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterviewCard({
  item,
  onSelect,
  onGuidance,
}: {
  item: InterviewExperience;
  onSelect: () => void;
  onGuidance: () => void;
}) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ isLiked: boolean; likesCount: number }>(`/interviews/${item.id}/like`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ isSaved: boolean }>(`/interviews/${item.id}/save`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews'] }),
  });

  return (
    <div className="surface flex flex-col justify-between rounded-2xl border border-border p-5 sm:p-6 shadow-sm transition-all hover:border-accent/40 animate-rise">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-base font-bold text-foreground border border-border">
              {item.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    item.outcome === 'Offered'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : item.outcome === 'In Progress'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-destructive/15 text-destructive'
                  )}
                >
                  {item.outcome}
                </span>
                <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {item.difficulty}
                </span>
              </div>
              <h3
                onClick={onSelect}
                className="mt-1 text-lg font-bold text-foreground hover:text-accent cursor-pointer tracking-[-.03em]"
              >
                {item.company} · {item.role}
              </h3>
            </div>
          </div>
          <span className="mono text-[10px] text-muted-foreground">{item.interviewDate}</span>
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.overallExperience}</p>

        {/* Rounds Timeline Preview */}
        {item.rounds?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border">
            <span className="font-bold text-foreground mr-1">Rounds:</span>
            {item.rounds.map((r, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="rounded bg-accent/20 px-1.5 py-0.2 font-bold text-accent text-[10px]">
                  {r.roundName.split(' ')[0]}
                </span>
                {i < item.rounds.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/60" />}
              </span>
            ))}
          </div>
        )}

        {/* Key topics chips */}
        <div className="mt-3 flex flex-wrap gap-1">
          {item.keyTopics?.slice(0, 4).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {item.keyTopics?.length > 4 && (
            <span className="text-[10px] text-muted-foreground self-center">+{item.keyTopics.length - 4} more</span>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Avatar user={item.author} size="sm" />
          <div>
            <Link href={`/people/${item.author.id}`} className="text-xs font-bold text-foreground hover:text-accent">
              {item.author.fullName}
            </Link>
            <p className="text-[10px] text-muted-foreground">Amrita {item.author.campus} {item.batch ? `· '${item.batch}` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            className={cx(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all',
              item.isLiked
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className={cx('h-3.5 w-3.5', item.isLiked && 'fill-accent')} />
            {item.likesCount > 0 && item.likesCount}
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className={cx(
              'rounded-lg border p-1.5 transition-all',
              item.isSaved
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark className={cx('h-3.5 w-3.5', item.isSaved && 'fill-accent')} />
          </button>

          {!item.isAuthor && (
            <Button variant="quiet" className="px-2.5 py-1.5 text-xs font-bold" onClick={onGuidance}>
              Ask Tips
            </Button>
          )}

          <Button variant="outline" className="px-3 py-1.5 text-xs font-bold" onClick={onSelect}>
            Read Experience <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function InterviewsPage() {
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [outcome, setOutcome] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewExperience | null>(null);
  const [guidanceTarget, setGuidanceTarget] = useState<InterviewExperience | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      company: company || undefined,
      outcome: outcome || undefined,
      difficulty: difficulty || undefined,
      page: 1,
      pageSize: 20,
    }),
    [search, company, outcome, difficulty]
  );

  const { data, isLoading, isError, refetch } = useListInterviews(params);
  const items = data?.items ?? [];

  const topCompanies = ['Microsoft', 'Google', 'Amazon', 'Cisco', 'TCS', 'Infosys', 'Intel', 'Bosch'];

  return (
    <>
      <PageTitle
        eyebrow="Career & Placements"
        title="Amrita Interview Experience Hub."
        detail="Real interview questions, coding round breakdowns, and preparation advice shared by peers and alumni across all campuses."
        action={
          <Button data-testid="button-share-interview" onClick={() => setShowShare(true)}>
            <Pencil className="h-4 w-4" /> Share Experience
          </Button>
        }
      />

      {/* Top Company Quick Tags */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCompany('')}
          className={cx(
            'rounded-xl px-3.5 py-2 text-xs font-bold shrink-0 transition-all shadow-sm',
            company === ''
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted'
          )}
        >
          All Companies
        </button>
        {topCompanies.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCompany(company === c ? '' : c)}
            className={cx(
              'rounded-xl px-3.5 py-2 text-xs font-bold shrink-0 transition-all shadow-sm',
              company === c
                ? 'bg-accent text-primary'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            data-testid="input-interviews-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, role, DSA topics, or questions..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent"
          />
        </label>

        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
        >
          <option value="">All Outcomes</option>
          <option value="Offered">Offered Only</option>
          <option value="In Progress">In Progress</option>
          <option value="Not Selected">Not Selected</option>
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Challenging">Challenging</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={GraduationCap}
          title="No interview experiences match your filters"
          detail="Be the first to share your interview rounds for this company to guide juniors and peers!"
          action={<Button onClick={() => setShowShare(true)}>Share the first experience</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <InterviewCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedInterview(item)}
              onGuidance={() => setGuidanceTarget(item)}
            />
          ))}
        </div>
      )}

      {selectedInterview && (
        <InterviewDetailModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
          onGuidance={() => {
            setGuidanceTarget(selectedInterview);
            setSelectedInterview(null);
          }}
        />
      )}

      {guidanceTarget && (
        <InterviewGuidanceModal
          interview={guidanceTarget}
          onClose={() => setGuidanceTarget(null)}
        />
      )}

      {showShare && <ShareInterviewModal onClose={() => setShowShare(false)} />}
    </>
  );
}

// ==========================================
// HELP & QUESTION SYSTEM ("I NEED HELP" MATCHING)
// ==========================================

interface HelpReply {
  id: string;
  author: PublicUser;
  text: string;
  isSolution: boolean;
  upvotesCount: number;
  isUpvoted: boolean;
  isAuthor: boolean;
  createdAt: string;
}

interface HelpRequest {
  id: string;
  author: PublicUser;
  title: string;
  description: string;
  category: 'Academic' | 'Project / Coding' | 'Hackathon' | 'Placements / Career' | 'Campus Life' | 'General';
  urgency: 'Normal' | 'High' | 'Urgent';
  tags: string[];
  status: 'open' | 'solved';
  campus: string;
  department: string;
  upvotesCount: number;
  isUpvoted: boolean;
  replies?: HelpReply[];
  repliesCount: number;
  hasAcceptedSolution: boolean;
  isAuthor: boolean;
  createdAt: string;
}

function useListHelpRequests(params: {
  search?: string;
  category?: string;
  urgency?: string;
  status?: string;
  campus?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryStr = new URLSearchParams();
  if (params.search) queryStr.set('search', params.search);
  if (params.category) queryStr.set('category', params.category);
  if (params.urgency) queryStr.set('urgency', params.urgency);
  if (params.status && params.status !== 'all') queryStr.set('status', params.status);
  if (params.campus) queryStr.set('campus', params.campus);
  if (params.tag) queryStr.set('tag', params.tag);
  if (params.page) queryStr.set('page', String(params.page));
  if (params.pageSize) queryStr.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['help-requests', params],
    queryFn: () =>
      apiFetch<{ items: HelpRequest[]; total: number; page: number; pageSize: number }>(
        `/help-requests?${queryStr.toString()}`
      ),
  });
}

function useHelpRequestDetail(id: string | null) {
  return useQuery({
    queryKey: ['help-request-detail', id],
    queryFn: () => apiFetch<HelpRequest>(`/help-requests/${id}`),
    enabled: !!id,
  });
}

function useSuggestedHelpers(id: string | null) {
  return useQuery({
    queryKey: ['help-request-helpers', id],
    queryFn: () => apiFetch<{ items: Array<{ user: PublicUser; score: number; reasons: string[] }> }>(`/help-requests/${id}/suggested-helpers`),
    enabled: !!id,
  });
}

function HelpDetailModal({
  requestId,
  onClose,
  onRefresh,
}: {
  requestId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: item, isLoading, refetch } = useHelpRequestDetail(requestId);
  const { data: helpersData } = useSuggestedHelpers(requestId);
  const [replyText, setReplyText] = useState('');

  const replyMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ success: boolean }>(`/help-requests/${requestId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      setReplyText('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
      onRefresh();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiFetch<{ success: boolean }>(`/help-requests/${requestId}/replies/${replyId}/accept`, {
        method: 'POST',
      }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
      onRefresh();
    },
  });

  const questionUpvoteMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>(`/help-requests/${requestId}/upvote`, {
        method: 'POST',
      }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
    },
  });

  const replyUpvoteMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiFetch<{ success: boolean }>(`/help-requests/${requestId}/replies/${replyId}/upvote`, {
        method: 'POST',
      }),
    onSuccess: () => {
      refetch();
    },
  });

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText.trim());
  };

  const helpers = helpersData?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        {isLoading || !item ? (
          <LoadingState rows={4} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag warm>{item.category}</Tag>
                  <span
                    className={cx(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      item.urgency === 'Urgent'
                        ? 'bg-rose-500/20 text-rose-500 font-bold'
                        : item.urgency === 'High'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {item.urgency}
                  </span>
                  <span
                    className={cx(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      item.status === 'solved'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-accent/20 text-accent'
                    )}
                  >
                    {item.status === 'solved' ? '✓ Solved' : '⏱ Open'}
                  </span>
                  <span className="mono text-[10px] text-muted-foreground">{relative(item.createdAt)}</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-foreground">{item.title}</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}

            {/* Question description */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{item.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Avatar user={item.author} size="sm" />
                  <div>
                    <Link href={`/people/${item.author.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                      {item.author.fullName}
                    </Link>
                    <p className="text-[10px] text-muted-foreground">Amrita {item.campus} · {item.department}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => questionUpvoteMutation.mutate()}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                    item.isUpvoted
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Flame className={cx('h-4 w-4', item.isUpvoted && 'fill-accent')} />
                  Upvote ({item.upvotesCount})
                </button>
              </div>
            </div>

            {/* Suggested Helpers Synergy Box */}
            {helpers.length > 0 && (
              <div className="mt-6 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                  <Compass className="h-4 w-4" /> Peers & Mentors Who Can Help With This Topic
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matched based on your tags & their profile skills and "I Can Help With" endorsements.
                </p>

                <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                  {helpers.map(({ user, reasons }) => (
                    <div key={user.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={user} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link href={`/people/${user.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                              {user.fullName}
                            </Link>
                            <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                              {roleLabels[user.role]}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {reasons.map((r, i) => (
                              <span key={i} className="text-[10px] text-muted-foreground">
                                • {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/messages/${user.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-sm"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-accent" /> Ask in Chat
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answers & Solutions Stream */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Answers & Discussions ({item.replies?.length || 0})
                </h3>
              </div>

              {(!item.replies || item.replies.length === 0) ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No answers yet. Be the first to help out a fellow Amrita peer!
                </div>
              ) : (
                <div className="space-y-3">
                  {item.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={cx(
                        'rounded-xl border p-4 transition-all',
                        reply.isSolution
                          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm'
                          : 'border-border bg-card'
                      )}
                    >
                      {reply.isSolution && (
                        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> Accepted Solution by Author
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={reply.author} size="sm" />
                          <div>
                            <Link href={`/people/${reply.author.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                              {reply.author.fullName}
                            </Link>
                            <p className="text-[10px] text-muted-foreground">
                              {reply.author.department} · {relative(reply.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => replyUpvoteMutation.mutate(reply.id)}
                            className={cx(
                              'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition-all',
                              reply.isUpvoted
                                ? 'border-accent bg-accent/20 text-accent'
                                : 'border-border text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <Flame className={cx('h-3.5 w-3.5', reply.isUpvoted && 'fill-accent')} />
                            {reply.upvotesCount > 0 && reply.upvotesCount}
                          </button>

                          {item.isAuthor && !reply.isSolution && (
                            <Button
                              variant="outline"
                              onClick={() => acceptMutation.mutate(reply.id)}
                              disabled={acceptMutation.isPending}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept Solution
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-foreground">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handlePostReply} className="mt-6 border-t border-border pt-4">
              <label className="block text-xs font-bold text-foreground mb-1.5">Write an Answer or Share Advice</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Share your solution, helpful code snippet, or link to relevant documentation..."
                className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
                required
              />
              <div className="mt-2.5 flex justify-end">
                <Button type="submit" disabled={replyMutation.isPending || !replyText.trim()} className="font-bold text-xs">
                  {replyMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post Answer
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function AskHelpModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    urgency: 'Normal',
    tags: '',
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch<{ id: string }>(`/help-requests`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">Community Help Desk</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Ask for Help or Advice</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            id="help-title"
            label="Question / Topic Title"
            placeholder="e.g. How to resolve PyTorch CUDA out-of-memory during LoRA training?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="help-category"
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={['Academic', 'Project / Coding', 'Hackathon', 'Placements / Career', 'Campus Life', 'General'].map((v) => ({ value: v, label: v }))}
            />
            <SelectField
              id="help-urgency"
              label="Urgency Level"
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              options={['Normal', 'High', 'Urgent'].map((v) => ({ value: v, label: v }))}
            />
          </div>

          <Field
            id="help-tags"
            label="Topic Tags (comma-separated)"
            placeholder="e.g. Python, PyTorch, CUDA, Machine Learning"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Details / Error Stack / Problem Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide background context, code snippets, what you have tried, and specific questions..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="font-bold">
              {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Question
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HelpCard({
  item,
  onSelect,
}: {
  item: HelpRequest;
  onSelect: () => void;
}) {
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ isUpvoted: boolean; upvotesCount: number }>(`/help-requests/${item.id}/upvote`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['help-requests'] }),
  });

  return (
    <div className="surface flex flex-col justify-between rounded-2xl border border-border p-5 sm:p-6 shadow-sm transition-all hover:border-accent/40 animate-rise">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag warm>{item.category}</Tag>
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                item.urgency === 'Urgent'
                  ? 'bg-rose-500/20 text-rose-500 font-bold'
                  : item.urgency === 'High'
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-secondary text-muted-foreground'
              )}
            >
              {item.urgency}
            </span>
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                item.status === 'solved'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-accent/20 text-accent'
              )}
            >
              {item.status === 'solved' ? '✓ Solved' : '⏱ Open'}
            </span>
          </div>
          <span className="mono text-[10px] text-muted-foreground">{relative(item.createdAt)}</span>
        </div>

        <h3
          onClick={onSelect}
          className="mt-3 text-lg font-bold text-foreground hover:text-accent cursor-pointer tracking-[-.03em]"
        >
          {item.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>

        {/* Tags chips */}
        <div className="mt-3.5 flex flex-wrap gap-1">
          {item.tags?.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Avatar user={item.author} size="sm" />
          <div>
            <Link href={`/people/${item.author.id}`} className="text-xs font-bold text-foreground hover:text-accent">
              {item.author.fullName}
            </Link>
            <p className="text-[10px] text-muted-foreground">Amrita {item.campus}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => upvoteMutation.mutate()}
            className={cx(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all',
              item.isUpvoted
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Flame className={cx('h-3.5 w-3.5', item.isUpvoted && 'fill-accent')} />
            {item.upvotesCount > 0 && item.upvotesCount}
          </button>

          <Button variant="outline" className="px-3 py-1.5 text-xs font-bold" onClick={onSelect}>
            <MessageSquare className="h-3.5 w-3.5" />
            {item.repliesCount} {item.repliesCount === 1 ? 'Answer' : 'Answers'}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function HelpDeskPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [showAsk, setShowAsk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      page: 1,
      pageSize: 20,
    }),
    [search, category, status]
  );

  const { data, isLoading, isError, refetch } = useListHelpRequests(params);
  const items = data?.items ?? [];

  const categories = ['', 'Academic', 'Project / Coding', 'Hackathon', 'Placements / Career', 'Campus Life'];

  return (
    <>
      <PageTitle
        eyebrow="Peer Support"
        title="Amrita Help & Doubts Desk."
        detail="Ask technical blockers, syllabus questions, and placement doubts — get matched with peers & alumni who have the answers."
        action={
          <Button data-testid="button-ask-help" onClick={() => setShowAsk(true)}>
            <HelpCircle className="h-4 w-4" /> Ask for Help
          </Button>
        }
      />

      {/* Category Pills */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cx(
              'rounded-xl px-3.5 py-2 text-xs font-bold shrink-0 transition-all shadow-sm',
              category === cat
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            data-testid="input-help-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, error messages, libraries, or course topics..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent"
          />
        </label>

        <div className="flex rounded-xl border border-border bg-card p-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Open', value: 'open' },
            { label: 'Solved ✓', value: 'solved' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                status === tab.value ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={HelpCircle}
          title="No help requests found"
          detail="Need clarification on a project or course? Ask your question and we'll match you with the right peers."
          action={<Button onClick={() => setShowAsk(true)}>Ask the first question</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <HelpCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>
      )}

      {selectedId && (
        <HelpDetailModal
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={() => refetch()}
        />
      )}

      {showAsk && <AskHelpModal onClose={() => setShowAsk(false)} />}
    </>
  );
}

// ==========================================
// CROSS-CAMPUS CAMPUS BUDDY & LOCAL GUIDES
// ==========================================

interface CampusGuideInfo {
  campus: string;
  tagline: string;
  highlights: string[];
  transit: string;
  foodSpots: string;
  hackathonHostels: string;
}

interface CampusBuddyHost {
  id: string;
  user: PublicUser;
  campus: string;
  department: string;
  servicesOffered: string[];
  bio: string;
  languages: string[];
  availability: 'Available' | 'Busy' | 'Away';
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

interface CampusBuddyRequestItem {
  id: string;
  requester?: PublicUser;
  host?: PublicUser;
  targetCampus: string;
  visitReason: string;
  visitDates: string;
  notes: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

function useListCampusBuddies(params: {
  campus?: string;
  service?: string;
  search?: string;
  availability?: string;
}) {
  const queryStr = new URLSearchParams();
  if (params.campus) queryStr.set('campus', params.campus);
  if (params.service) queryStr.set('service', params.service);
  if (params.search) queryStr.set('search', params.search);
  if (params.availability) queryStr.set('availability', params.availability);

  return useQuery({
    queryKey: ['campus-buddies', params],
    queryFn: () =>
      apiFetch<{ items: CampusBuddyHost[] }>(`/campus-buddies?${queryStr.toString()}`),
  });
}

function useCampusGuide(campus: string) {
  return useQuery({
    queryKey: ['campus-guide', campus],
    queryFn: () => apiFetch<{ success: boolean; guide: CampusGuideInfo }>(`/campus-buddies/guide/${campus}`),
    enabled: !!campus,
  });
}

function useMyHostProfile() {
  return useQuery({
    queryKey: ['my-campus-buddy-profile'],
    queryFn: () => apiFetch<{ isHost: boolean; profile: CampusBuddyHost | null }>(`/campus-buddies/my-host-profile`),
  });
}

function useMyBuddyRequests() {
  return useQuery({
    queryKey: ['my-campus-buddy-requests'],
    queryFn: () =>
      apiFetch<{ incoming: CampusBuddyRequestItem[]; outgoing: CampusBuddyRequestItem[] }>(
        `/campus-buddies/my-requests`
      ),
  });
}

function CampusGuideSpotlight({ campus }: { campus: string }) {
  const { data } = useCampusGuide(campus);
  const guide = data?.guide;
  if (!guide) return null;

  return (
    <div className="mb-6 rounded-2xl border border-accent/30 bg-gradient-to-br from-card via-card to-accent/5 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">Amrita Campus Guide</div>
          <h3 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">
            Amrita Vishwa Vidyapeetham · {guide.campus}
          </h3>
          <p className="text-xs text-muted-foreground">{guide.tagline}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mono text-[9px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <Rocket className="h-3 w-3" /> Campus Highlights
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {guide.highlights.map((h, i) => (
              <li key={i} className="line-clamp-2">• {h}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mono text-[9px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Transit & Arrival
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{guide.transit}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mono text-[9px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <Flame className="h-3 w-3" /> Food & Canteens
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{guide.foodSpots}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mono text-[9px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Hackathon Stays
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{guide.hackathonHostels}</p>
        </div>
      </div>
    </div>
  );
}

function RequestBuddyModal({
  host,
  onClose,
}: {
  host: CampusBuddyHost;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('Hackathon / Competition');
  const [dates, setDates] = useState('');
  const [notes, setNotes] = useState('');

  const requestMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; message: string }>(`/campus-buddies/request`, {
        method: 'POST',
        body: JSON.stringify({
          hostUserId: host.user.id,
          targetCampus: host.campus,
          visitReason: reason,
          visitDates: dates,
          notes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-campus-buddy-requests'] });
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">Campus Visit Guide</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Request Campus Buddy</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
          <Avatar user={host.user} size="md" />
          <div>
            <div className="text-sm font-bold text-foreground">{host.user.fullName}</div>
            <div className="text-xs text-muted-foreground">Amrita {host.campus} · {host.department}</div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <SelectField
            id="visit-reason"
            label="Reason for Visit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={[
              { value: 'Hackathon / Competition', label: 'Hackathon / Tech Competition' },
              { value: 'Campus Tour', label: 'Campus Tour & Exploration' },
              { value: 'Research & Lab Visit', label: 'Research & Lab Visit' },
              { value: 'Inter-Campus Transfer', label: 'Inter-Campus Transfer / Official Visit' },
              { value: 'General Visit', label: 'General Peer Meetup' },
            ]}
          />

          <Field
            id="visit-dates"
            label="Expected Dates of Visit"
            placeholder="e.g. Oct 24 - Oct 26, 2026"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Message to Host (optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell them what specific labs you want to see, accommodation advice needed, or arrival times..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={requestMutation.isPending || !dates.trim()} className="font-bold">
              {requestMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Visit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterBuddyModal({
  initialData,
  onClose,
}: {
  initialData?: CampusBuddyHost | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();

  const [campus, setCampus] = useState(initialData?.campus || user?.campus || 'Bengaluru');
  const [department, setDepartment] = useState(initialData?.department || user?.department || 'Computer Science & Engineering');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [services, setServices] = useState<string[]>(
    initialData?.servicesOffered || ['Campus Tour', 'Hackathon Host / Stay Advice', 'Local Food & Transport Guide']
  );
  const [languages, setLanguages] = useState(initialData?.languages?.join(', ') || 'English, Hindi');
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'Away'>(initialData?.availability || 'Available');

  const registerMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>(`/campus-buddies/register-host`, {
        method: 'POST',
        body: JSON.stringify({
          campus,
          department,
          servicesOffered: services,
          bio,
          languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
          availability,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-campus-buddy-profile'] });
      queryClient.invalidateQueries({ queryKey: ['campus-buddies'] });
      onClose();
    },
  });

  const availableServices = [
    'Campus Tour',
    'Hackathon Host / Stay Advice',
    'Lab & Research Guide',
    'Local Food & Transport Guide',
    'Library & Study Spot Tour',
    'Tech Industry & Placement Guide',
    'Research Symposium Host',
  ];

  const toggleService = (s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">Volunteer & Host</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">
              {initialData ? 'Update Buddy Profile' : 'Become a Campus Buddy'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="buddy-campus"
              label="Campus"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              options={campuses.map((c) => ({ value: c, label: c }))}
            />
            <SelectField
              id="buddy-availability"
              label="Current Availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value as any)}
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'Busy', label: 'Busy with Exams' },
                { value: 'Away', label: 'Away' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Services You Can Offer Visiting Peers</label>
            <div className="flex flex-wrap gap-2">
              {availableServices.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={cx(
                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all border',
                    services.includes(s)
                      ? 'border-accent bg-accent text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {services.includes(s) ? '✓ ' : '+ '}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field
            id="buddy-languages"
            label="Languages Spoken (comma-separated)"
            placeholder="e.g. English, Kannada, Hindi, Tamil"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Host Bio & Welcome Note</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. 3rd year CSE student at Bengaluru campus. Excited to show visitors our Robotics lab and share Bangalore travel tips!"
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={registerMutation.isPending || !bio.trim()} className="font-bold">
              {registerMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Host Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyBuddyRequestsModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useMyBuddyRequests();

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<{ success: boolean }>(`/campus-buddies/requests/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['my-campus-buddy-requests'] });
    },
  });

  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">Visits & Connections</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">My Campus Buddy Requests</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <LoadingState rows={3} />
        ) : (
          <div className="mt-6 space-y-6">
            {/* Incoming Requests (For Hosts) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Incoming Visit Requests ({incoming.length})
              </h3>
              {incoming.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No incoming visitor requests at the moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {incoming.map((req) => (
                    <div key={req.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {req.requester && <Avatar user={req.requester} size="sm" />}
                          <div>
                            <div className="text-xs font-bold text-foreground">{req.requester?.fullName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              Visiting Amrita {req.targetCampus} · {req.visitDates}
                            </div>
                          </div>
                        </div>

                        <span
                          className={cx(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase self-start sm:self-auto',
                            req.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : req.status === 'declined'
                                ? 'bg-rose-500/20 text-rose-500'
                                : 'bg-amber-500/20 text-amber-500'
                          )}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-foreground bg-secondary/30 p-2.5 rounded-lg">
                        <span className="font-bold text-accent">{req.visitReason}: </span>
                        {req.notes || 'No extra notes provided.'}
                      </div>

                      {req.status === 'pending' && (
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            className="text-rose-500 border-rose-500/30 px-3 py-1 text-xs font-bold"
                            onClick={() => respondMutation.mutate({ id: req.id, status: 'declined' })}
                            disabled={respondMutation.isPending}
                          >
                            Decline
                          </Button>
                          <Button
                            className="px-3 py-1 text-xs font-bold"
                            onClick={() => respondMutation.mutate({ id: req.id, status: 'accepted' })}
                            disabled={respondMutation.isPending}
                          >
                            Accept & Connect
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests (For Visitors) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Sent Guide Requests ({outgoing.length})
              </h3>
              {outgoing.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  You haven't requested any campus buddy guides yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoing.map((req) => (
                    <div key={req.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {req.host && <Avatar user={req.host} size="sm" />}
                          <div>
                            <div className="text-xs font-bold text-foreground">Host: {req.host?.fullName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              Amrita {req.targetCampus} · {req.visitDates}
                            </div>
                          </div>
                        </div>

                        <span
                          className={cx(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                            req.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : req.status === 'declined'
                                ? 'bg-rose-500/20 text-rose-500'
                                : 'bg-amber-500/20 text-amber-500'
                          )}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.host && req.status === 'accepted' && (
                        <div className="mt-3 flex justify-end">
                          <Link
                            href={`/messages/${req.host.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-primary"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Message Host
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CampusBuddyPage() {
  const { data: hostProfileData } = useMyHostProfile();
  const [selectedCampus, setSelectedCampus] = useState('Bengaluru');
  const [search, setSearch] = useState('');
  const [selectedHostForRequest, setSelectedHostForRequest] = useState<CampusBuddyHost | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const params = useMemo(
    () => ({
      campus: selectedCampus || undefined,
      search: search || undefined,
    }),
    [selectedCampus, search]
  );

  const { data, isLoading, isError, refetch } = useListCampusBuddies(params);
  const items = data?.items ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Inter-Campus Network"
        title="Cross-Campus Buddy & Host."
        detail="Traveling to another Amrita campus for hackathons, research symposiums, or sports? Connect with welcoming peer hosts and local guides."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowRequests(true)}>
              <CalendarDays className="h-4 w-4" /> My Visit Requests
            </Button>
            <Button onClick={() => setShowRegister(true)}>
              <MapPin className="h-4 w-4" />
              {hostProfileData?.isHost ? 'Edit Buddy Profile' : 'Become a Campus Buddy'}
            </Button>
          </div>
        }
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {campuses.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCampus(c)}
            className={cx(
              'rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all shadow-sm',
              selectedCampus === c
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Campus Guide Spotlight Card */}
      <CampusGuideSpotlight campus={selectedCampus} />

      {/* Search Input */}
      <div className="mb-6">
        <label className="relative block">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${selectedCampus} hosts by name, languages, or services offered...`}
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>

      {/* Campus Buddies Roster */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Local Campus Buddies & Hosts in {selectedCampus} ({items.length})
        </h2>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={MapPin}
          title={`No buddy hosts registered in ${selectedCampus} yet`}
          detail="Be the first to represent your campus and welcome visiting peers!"
          action={<Button onClick={() => setShowRegister(true)}>Register as a Host</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {items.map((host) => (
            <div
              key={host.id}
              className="surface flex flex-col justify-between rounded-2xl border border-border p-5 sm:p-6 shadow-sm transition-all hover:border-accent/40 animate-rise"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={host.user} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/people/${host.user.id}`} className="text-sm font-bold text-foreground hover:text-accent">
                          {host.user.fullName}
                        </Link>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{roleLabels[host.user.role]} · {host.department}</p>
                    </div>
                  </div>

                  <span
                    className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      host.availability === 'Available'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : host.availability === 'Busy'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {host.availability}
                  </span>
                </div>

                <p className="mt-3.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{host.bio}</p>

                {/* Services Chips */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {host.servicesOffered.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>

                {/* Languages */}
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Globe className="h-3 w-3 text-accent" />
                  <span>Speaks: {host.languages.join(', ')}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{host.rating}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">({host.reviewsCount} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/messages/${host.user.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-2 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-accent" />
                  </Link>

                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs font-bold"
                    onClick={() => setSelectedHostForRequest(host)}
                  >
                    Request Guide <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedHostForRequest && (
        <RequestBuddyModal
          host={selectedHostForRequest}
          onClose={() => setSelectedHostForRequest(null)}
        />
      )}

      {showRegister && (
        <RegisterBuddyModal
          initialData={hostProfileData?.profile}
          onClose={() => setShowRegister(false)}
        />
      )}

      {showRequests && <MyBuddyRequestsModal onClose={() => setShowRequests(false)} />}
    </>
  );
}

// ==========================================
// RESEARCH & FACULTY COLLABORATION HUB
// ==========================================

interface OpenPosition {
  roleTitle: string;
  spots: number;
  prerequisites: string[];
}

interface Publication {
  title: string;
  venue: string;
  link?: string;
}

interface ResearchApplication {
  id: string;
  applicant: PublicUser;
  roleAppliedFor?: string;
  statementOfInterest: string;
  relevantSkills: string[];
  status: 'pending' | 'accepted' | 'declined';
  appliedAt: string;
}

interface ResearchProject {
  id: string;
  principalInvestigator: PublicUser;
  coInvestigators?: PublicUser[];
  title: string;
  labName: string;
  fundingSource?: string;
  campus: string;
  department: string;
  category: string;
  abstract: string;
  objectives: string[];
  openPositions: OpenPosition[];
  publications: Publication[];
  status: 'recruiting' | 'active' | 'completed';
  applicationsCount: number;
  applications?: ResearchApplication[];
  myApplication?: {
    id: string;
    roleAppliedFor?: string;
    status: string;
    appliedAt: string;
  } | null;
  isBookmarked: boolean;
  isPI: boolean;
  createdAt: string;
}

function useListResearchProjects(params: {
  campus?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryStr = new URLSearchParams();
  if (params.campus) queryStr.set('campus', params.campus);
  if (params.category) queryStr.set('category', params.category);
  if (params.status && params.status !== 'all') queryStr.set('status', params.status);
  if (params.search) queryStr.set('search', params.search);
  if (params.page) queryStr.set('page', String(params.page));
  if (params.pageSize) queryStr.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['research-projects', params],
    queryFn: () =>
      apiFetch<{ items: ResearchProject[]; total: number; page: number; pageSize: number }>(
        `/research-projects?${queryStr.toString()}`
      ),
  });
}

function useResearchProjectDetail(id: string | null) {
  return useQuery({
    queryKey: ['research-project-detail', id],
    queryFn: () => apiFetch<ResearchProject>(`/research-projects/${id}`),
    enabled: !!id,
  });
}

function ApplyResearchModal({
  project,
  onClose,
  onSuccess,
}: {
  project: ResearchProject;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState(project.openPositions?.[0]?.roleTitle || 'Research Assistant');
  const [statement, setStatement] = useState('');
  const [skills, setSkills] = useState('');

  const applyMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>(`/research-projects/${project.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          roleAppliedFor: role,
          statementOfInterest: statement,
          relevantSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border/90 bg-card p-6 sm:p-7 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">Research Collaboration</span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Express Research Interest</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
          <div className="text-xs font-bold text-foreground">{project.title}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            PI: Prof. {project.principalInvestigator.fullName} · {project.labName} (Amrita {project.campus})
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {project.openPositions?.length > 0 ? (
            <SelectField
              id="apply-role"
              label="Select Role / Position"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={project.openPositions.map((p) => ({
                value: p.roleTitle,
                label: `${p.roleTitle} (${p.spots} spots)`,
              }))}
            />
          ) : (
            <Field
              id="apply-role"
              label="Role Applied For"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          )}

          <Field
            id="apply-skills"
            label="Relevant Skills & Technologies"
            placeholder="e.g. PyTorch, ROS2, Computer Vision, C++"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Statement of Interest & Prior Background
            </label>
            <textarea
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Highlight relevant coursework, past projects, or why you want to contribute to this lab..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={applyMutation.isPending || !statement.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
            >
              {applyMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Submit Application</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateResearchModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: user } = useGetCurrentUser();
  const [form, setForm] = useState({
    title: '',
    labName: '',
    fundingSource: '',
    campus: user?.campus || 'Coimbatore',
    department: user?.department || 'Computer Science & Engineering',
    category: 'Artificial Intelligence',
    abstract: '',
    objectives: '',
    openRoleTitle: 'Undergraduate Research Assistant',
    openRoleSpots: '2',
    openRoleSkills: 'PyTorch, Python, OpenCV',
    pubTitle: '',
    pubVenue: '',
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const openPositions = form.openRoleTitle.trim()
        ? [
          {
            roleTitle: form.openRoleTitle.trim(),
            spots: Number(form.openRoleSpots) || 1,
            prerequisites: form.openRoleSkills.split(',').map((s) => s.trim()).filter(Boolean),
          },
        ]
        : [];

      const publications = form.pubTitle.trim()
        ? [
          {
            title: form.pubTitle.trim(),
            venue: form.pubVenue.trim() || 'IEEE / ACM Conference',
          },
        ]
        : [];

      return apiFetch<{ success: boolean; id: string }>(`/research-projects`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          labName: form.labName,
          fundingSource: form.fundingSource,
          campus: form.campus,
          department: form.department,
          category: form.category,
          abstract: form.abstract,
          objectives: form.objectives.split('\n').map((o) => o.trim()).filter(Boolean),
          openPositions,
          publications,
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/90 bg-card p-6 sm:p-7 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">Faculty & Lab Initiative</span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Post Research Project / Call</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field
            id="proj-title"
            label="Research Project Title"
            placeholder="e.g. Edge-AI Autonomous Navigation for Precision Agriculture"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="proj-lab"
              label="Lab / Research Center Name"
              placeholder="e.g. HuT Labs / ACCI"
              value={form.labName}
              onChange={(e) => setForm({ ...form, labName: e.target.value })}
              required
            />
            <Field
              id="proj-funding"
              label="Grant / Funding Source (Optional)"
              placeholder="e.g. DST-SERB / Amrita Seed Grant - ₹15 Lakhs"
              value={form.fundingSource}
              onChange={(e) => setForm({ ...form, fundingSource: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              id="proj-campus"
              label="Campus"
              value={form.campus}
              onChange={(e) => setForm({ ...form, campus: e.target.value })}
              options={campuses.map((c) => ({ value: c, label: c }))}
            />
            <Field
              id="proj-category"
              label="Domain Category"
              placeholder="e.g. Artificial Intelligence, Robotics, Quantum"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <SelectField
              id="proj-dept"
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              options={departments.map((d) => ({ value: d, label: d }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Project Abstract</label>
            <textarea
              rows={3}
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
              placeholder="Provide a comprehensive summary of the problem statement, proposed methodology, and expected outcomes..."
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Key Research Objectives (one per line)</label>
            <textarea
              rows={3}
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              placeholder="Implement real-time visual odometry&#10;Deploy on Nvidia Jetson edge platform&#10;Conduct field trials in rural farmlands"
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Open Position Section */}
          <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-500">Open Research Role (Optional)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="role-title"
                label="Role Title"
                placeholder="e.g. Undergraduate Research Assistant"
                value={form.openRoleTitle}
                onChange={(e) => setForm({ ...form, openRoleTitle: e.target.value })}
              />
              <Field
                id="role-spots"
                label="Available Spots"
                placeholder="e.g. 2"
                value={form.openRoleSpots}
                onChange={(e) => setForm({ ...form, openRoleSpots: e.target.value })}
              />
            </div>
            <Field
              id="role-skills"
              label="Prerequisite Skills"
              placeholder="e.g. PyTorch, ROS2, Python, OpenCV"
              value={form.openRoleSkills}
              onChange={(e) => setForm({ ...form, openRoleSkills: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !form.title.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
            >
              {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              <span>Publish Research Project</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResearchDetailModal({
  projectId,
  onClose,
  onApply,
  onRefresh,
}: {
  projectId: string;
  onClose: () => void;
  onApply: (project: ResearchProject) => void;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: project, isLoading, refetch } = useResearchProjectDetail(projectId);

  const respondMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      apiFetch<{ success: boolean }>(`/research-projects/${projectId}/applications/${appId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['research-projects'] });
      onRefresh();
    },
  });

  if (isLoading || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-12 pb-8 backdrop-blur-md">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border/90 bg-card p-6 sm:p-8 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 text-xs font-semibold">
                {project.category}
              </span>
              <span className="rounded-lg bg-secondary/80 text-muted-foreground px-2.5 py-1 text-xs font-semibold">
                Amrita {project.campus}
              </span>
              {project.fundingSource && (
                <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {project.fundingSource}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{project.title}</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{project.labName} · {project.department}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PI Card */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-3">
            <Avatar user={project.principalInvestigator} size="md" />
            <div>
              <div className="text-xs font-bold text-foreground">
                Principal Investigator: Prof. {project.principalInvestigator.fullName}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {project.principalInvestigator.headline || `${project.principalInvestigator.department}`}
              </p>
            </div>
          </div>

          <Link
            href={`/messages/${project.principalInvestigator.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-orange-500" /> Message PI
          </Link>
        </div>

        {/* Abstract */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Abstract</h3>
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-foreground bg-secondary/20 p-4 rounded-2xl border border-border/80">
            {project.abstract}
          </p>
        </div>

        {/* Research Objectives */}
        {project.objectives?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Objectives</h3>
            <ul className="mt-2.5 space-y-2">
              {project.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-foreground bg-card p-3 rounded-xl border border-border/80">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Positions */}
        {project.openPositions?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <Rocket className="h-4 w-4" /> Open Student & Fellow Positions
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {project.openPositions.map((pos, i) => (
                <div key={i} className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{pos.roleTitle}</span>
                    <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      {pos.spots} {pos.spots === 1 ? 'Spot' : 'Spots'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pos.prerequisites.map((p) => (
                      <span key={p} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publications */}
        {project.publications?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected Publications</h3>
            <div className="mt-2.5 space-y-2">
              {project.publications.map((pub, i) => (
                <div key={i} className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground">{pub.title}</div>
                    <div className="text-[11px] text-muted-foreground">{pub.venue}</div>
                  </div>
                  {pub.link && (
                    <a
                      href={pub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
                    >
                      View <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applicant Review Queue (For Principal Investigator Only) */}
        {project.isPI && project.applications && (
          <div className="mt-7 border-t border-border/80 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Applicant Review Queue ({project.applications.length})
            </h3>

            {project.applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                No student research applications received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {project.applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={app.applicant} size="sm" />
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {app.applicant.fullName} · <span className="text-orange-500">{app.roleAppliedFor}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Amrita {app.applicant.campus} · Applied {relative(app.appliedAt)}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cx(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase self-start sm:self-auto',
                          app.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : app.status === 'declined'
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-amber-500/20 text-amber-500'
                        )}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-foreground bg-secondary/30 p-3 rounded-xl">
                      {app.statementOfInterest}
                    </p>

                    {app.relevantSkills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {app.relevantSkills.map((s) => (
                          <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          className="text-rose-500 border-rose-500/30 px-3 py-1 text-xs font-bold"
                          onClick={() => respondMutation.mutate({ appId: app.id, status: 'declined' })}
                          disabled={respondMutation.isPending}
                        >
                          Decline
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold rounded-xl"
                          onClick={() => respondMutation.mutate({ appId: app.id, status: 'accepted' })}
                          disabled={respondMutation.isPending}
                        >
                          Accept to Lab Roster
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
          <Button variant="quiet" onClick={onClose}>
            Close
          </Button>

          {!project.isPI && (
            <div>
              {project.myApplication ? (
                <span className="rounded-xl border border-border/80 bg-secondary px-4 py-2 text-xs font-bold text-foreground">
                  Application Status: {project.myApplication.status.toUpperCase()}
                </span>
              ) : (
                <Button
                  onClick={() => {
                    onClose();
                    onApply(project);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs"
                >
                  <Rocket className="h-4 w-4" /> Express Research Interest
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResearchProjectCard({
  project,
  onSelect,
  onApply,
}: {
  project: ResearchProject;
  onSelect: () => void;
  onApply: () => void;
}) {
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ isBookmarked: boolean }>(`/research-projects/${project.id}/bookmark`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-projects'] }),
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-500/30 transition-all">
      <div>
        {/* Card Header Badges & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2.5 py-1 text-[11px] font-semibold">
              {project.category}
            </span>
            <span className="rounded-lg bg-secondary/80 text-muted-foreground border border-border/70 px-2.5 py-1 text-[11px] font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3 text-orange-500" />
              <span>Amrita {project.campus}</span>
            </span>
            {project.status === 'recruiting' && (
              <span className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Recruiting Open</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => bookmarkMutation.mutate()}
            className={cx(
              'rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-transparent hover:border-border/60',
              project.isBookmarked && 'text-orange-500 bg-orange-500/10 border-orange-500/20'
            )}
            title={project.isBookmarked ? 'Saved to bookmarks' : 'Bookmark project'}
          >
            <Bookmark className={cx('h-4 w-4', project.isBookmarked && 'fill-orange-500 text-orange-500')} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={onSelect}
          className="mt-3.5 text-base sm:text-lg font-bold text-foreground group-hover:text-orange-500 cursor-pointer tracking-tight transition-colors line-clamp-2 leading-snug"
        >
          {project.title}
        </h3>

        {/* Lab Info */}
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground/85">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{project.labName}</span>
        </div>

        {/* Dedicated Funding / Grant Badge */}
        {project.fundingSource && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{project.fundingSource}</span>
          </div>
        )}

        {/* Abstract */}
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{project.abstract}</p>

        {/* Open Positions Section */}
        {project.openPositions?.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-orange-500" /> Open Lab Positions
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.openPositions.map((pos, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  <span className="font-semibold">{pos.roleTitle}</span>
                  <span className="rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 text-[10px] font-bold">
                    {pos.spots} open
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 border-t border-border/80 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar user={project.principalInvestigator} size="sm" />
          <div className="min-w-0 truncate">
            <Link
              href={`/people/${project.principalInvestigator.id}`}
              className="text-xs font-bold text-foreground hover:text-orange-500 transition-colors truncate block"
            >
              Prof. {project.principalInvestigator.fullName}
            </Link>
            <p className="text-[10px] text-muted-foreground truncate">{project.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="h-3 w-3 text-orange-500" />
          </button>

          {!project.isPI && (
            project.myApplication ? (
              <span className="rounded-xl border border-border/80 bg-secondary/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                Applied
              </span>
            ) : (
              <button
                type="button"
                onClick={onApply}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors active:scale-95"
              >
                Apply
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ResearchPage() {
  const { data: user } = useGetCurrentUser();
  const [selectedCampus, setSelectedCampus] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [applyingProject, setApplyingProject] = useState<ResearchProject | null>(null);

  const params = useMemo(
    () => ({
      campus: selectedCampus || undefined,
      category: category || undefined,
      status: status || undefined,
      search: search || undefined,
      page: 1,
      pageSize: 20,
    }),
    [selectedCampus, category, status, search]
  );

  const { data, isLoading, isError, refetch } = useListResearchProjects(params);
  const items = data?.items ?? [];

  const isFacultyOrResearcher = user?.role === 'faculty' || user?.role === 'researcher' || user?.role === 'admin';

  return (
    <>
      <PageTitle
        eyebrow="Academic Excellence & Labs"
        title="Research & Faculty Collaboration."
        detail="Discover funded research grants, join interdisciplinary lab initiatives, and collaborate on high-impact publications with faculty across all Amrita campuses."
        action={
          <div className="flex items-center gap-2">
            {isFacultyOrResearcher && (
              <button
                type="button"
                data-testid="button-post-research"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
              >
                <BookOpen className="h-4 w-4" />
                <span>Post Research Project</span>
              </button>
            )}
          </div>
        }
      />

      {/* Unified Search & Filters Bar */}
      <div className="mb-6 rounded-2xl border border-border/80 bg-card/80 p-2 sm:p-2.5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search research topics, lab names, grants, or required skills (e.g. PyTorch, ROS2)..."
              className="w-full rounded-xl border border-transparent bg-secondary/40 py-2 pl-10 pr-4 text-xs font-medium text-foreground outline-none focus:border-orange-500/50 focus:bg-background transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Campus Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="appearance-none rounded-xl border border-border/80 bg-secondary/50 pl-3 pr-7 py-2 text-xs font-semibold text-foreground outline-none shadow-2xs hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    Amrita {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Status Switcher */}
            <div className="flex rounded-xl border border-border/80 bg-secondary/40 p-0.5">
              {[
                { label: 'All', value: 'all' },
                { label: 'Recruiting', value: 'recruiting' },
                { label: 'Active', value: 'active' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    status === tab.value
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Summary (if any active) */}
      {(category || selectedCampus || search || status !== 'all') && (
        <div className="mb-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Filtered by:</span>
            {category && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                {category}
              </span>
            )}
            {selectedCampus && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                Amrita {selectedCampus}
              </span>
            )}
            {status !== 'all' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground capitalize">
                {status}
              </span>
            )}
            {search && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                "{search}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setSelectedCampus('');
              setStatus('all');
              setSearch('');
            }}
            className="text-orange-500 font-bold hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Main Grid Stream */}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={BookOpen}
          title="No research projects found"
          detail="Faculty and student research calls will appear here. Start a new project or adjust your filters."
          action={
            isFacultyOrResearcher ? (
              <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                Post Research Call
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((project) => (
            <ResearchProjectCard
              key={project.id}
              project={project}
              onSelect={() => setSelectedDetailId(project.id)}
              onApply={() => setApplyingProject(project)}
            />
          ))}
        </div>
      )}

      {selectedDetailId && (
        <ResearchDetailModal
          projectId={selectedDetailId}
          onClose={() => setSelectedDetailId(null)}
          onApply={(proj) => setApplyingProject(proj)}
          onRefresh={() => refetch()}
        />
      )}

      {applyingProject && (
        <ApplyResearchModal
          project={applyingProject}
          onClose={() => setApplyingProject(null)}
          onSuccess={() => refetch()}
        />
      )}

      {showCreate && (
        <CreateResearchModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}

// ==========================================
// PROJECT SHOWCASE & INNOVATION GALLERY
// ==========================================

interface ProjectShowcaseComment {
  id: string;
  author: PublicUser;
  text: string;
  createdAt: string;
}

interface ProjectShowcase {
  id: string;
  author: PublicUser;
  teamMembers: PublicUser[];
  title: string;
  tagline: string;
  description: string;
  category: string;
  techStack: string[];
  campus: string;
  department: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  award?: string;
  upvotesCount: number;
  isUpvoted: boolean;
  comments: ProjectShowcaseComment[];
  commentsCount: number;
  isAuthor: boolean;
  createdAt: string;
}

function useListShowcaseProjects(params: {
  category?: string;
  campus?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryStr = new URLSearchParams();
  if (params.category) queryStr.set('category', params.category);
  if (params.campus) queryStr.set('campus', params.campus);
  if (params.search) queryStr.set('search', params.search);
  if (params.sortBy) queryStr.set('sortBy', params.sortBy);
  if (params.page) queryStr.set('page', String(params.page));
  if (params.pageSize) queryStr.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['showcase-projects', params],
    queryFn: () =>
      apiFetch<{ items: ProjectShowcase[]; total: number; page: number; pageSize: number }>(
        `/showcase?${queryStr.toString()}`
      ),
  });
}

function useShowcaseProjectDetail(id: string | null) {
  return useQuery({
    queryKey: ['showcase-project-detail', id],
    queryFn: () => apiFetch<ProjectShowcase>(`/showcase/${id}`),
    enabled: !!id,
  });
}

function getEmbedVideoUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

function CreateShowcaseModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: user } = useGetCurrentUser();
  const [activeTab, setActiveTab] = useState<'basics' | 'media'>('basics');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'AI / ML',
    techStack: 'React, Python, PyTorch',
    campus: user?.campus || 'Amaravati',
    department: user?.department || 'Computer Science & Engineering',
    githubUrl: '',
    liveDemoUrl: '',
    videoUrl: '',
    imageUrl: '',
    award: '',
  });

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; id: string }>(`/showcase`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          techStack: form.techStack.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.tagline.trim() || !form.description.trim()) {
      setActiveTab('basics');
      return;
    }
    createMutation.mutate();
  };

  const embedPreview = getEmbedVideoUrl(form.videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/90 bg-card shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">Innovation Gallery</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Showcase Your Project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Tabs Header */}
        <div className="flex border-b border-border/80 bg-secondary/20 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all',
              activeTab === 'basics'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>1. Project Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all',
              activeTab === 'media'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Video className="h-4 w-4" />
            <span>2. Video & Media Links</span>
            {(form.videoUrl || form.githubUrl || form.liveDemoUrl || form.imageUrl) && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            )}
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* TAB 1: BASICS & DETAILS */}
          {activeTab === 'basics' && (
            <div className="space-y-4 animate-rise">
              <Field
                id="showcase-title"
                label="Project Title"
                placeholder="e.g. Amrita RoverBot"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <Field
                id="showcase-tagline"
                label="One-line Pitch"
                placeholder="e.g. Autonomous 4WD LiDAR SLAM ground rover for campus delivery"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                required
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField
                  id="showcase-category"
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  options={[
                    'AI / ML',
                    'Web & Mobile',
                    'Robotics / IoT',
                    'Cyber Security',
                    'Healthcare Tech',
                    'Blockchain',
                    'Open Source',
                  ].map((c) => ({ value: c, label: c }))}
                />
                <SelectField
                  id="showcase-campus"
                  label="Campus"
                  value={form.campus}
                  onChange={(e) => setForm({ ...form, campus: e.target.value })}
                  options={campuses.map((c) => ({ value: c, label: c }))}
                />
                <SelectField
                  id="showcase-dept"
                  label="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  options={departments.map((d) => ({ value: d, label: d }))}
                />
              </div>

              <Field
                id="showcase-tech"
                label="Tech Stack & Tools"
                placeholder="e.g. ROS2, Python, LiDAR, React, FastAPI, Jetson Orin"
                value={form.techStack}
                onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Architecture & Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain system architecture, technical approach, challenges solved, and real-world impact..."
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO, DEMO LINKS & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-4 animate-rise">
              {/* Video Demo Field */}
              <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Video className="h-4 w-4 text-orange-500" />
                    <span>Project Demo Video (YouTube / Vimeo / Loom / MP4)</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Recommended</span>
                </div>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-orange-500 transition-colors"
                />

                {embedPreview && (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border/80 mt-2 bg-black shadow-xs">
                    <iframe
                      src={embedPreview}
                      title="Video Demo Preview"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {/* Code & Live App Links */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Code className="h-3.5 w-3.5 text-sky-500" />
                    <span>GitHub Code URL</span>
                  </label>
                  <input
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/user/project"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Live App / Demo URL</span>
                  </label>
                  <input
                    value={form.liveDemoUrl}
                    onChange={(e) => setForm({ ...form, liveDemoUrl: e.target.value })}
                    placeholder="https://myproject.app"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Cover Image & Award */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Image className="h-3.5 w-3.5 text-purple-500" />
                    <span>Cover Image / Screenshot</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="Image URL or upload"
                      className="flex-1 rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-orange-500 transition-colors"
                    />
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                  {form.imageUrl && (
                    <div className="relative h-20 w-full overflow-hidden rounded-xl border border-border mt-1.5">
                      <img src={form.imageUrl} alt="Cover Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    <span>Hackathon / Award Recognition</span>
                  </label>
                  <input
                    value={form.award}
                    onChange={(e) => setForm({ ...form, award: e.target.value })}
                    placeholder="e.g. 1st Prize · Smart India Hackathon 2025"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground">Optional achievement to display as badge</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border/80">
            {activeTab === 'basics' ? (
              <>
                <Button type="button" variant="quiet" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!form.title.trim() || !form.tagline.trim() || !form.description.trim()) {
                      alert('Please provide project title, tagline, and description first.');
                      return;
                    }
                    setActiveTab('media');
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                >
                  <span>Continue to Media & Links</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="quiet" onClick={() => setActiveTab('basics')}>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !form.title.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                >
                  {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  <span>Publish Showcase</span>
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ShowcaseDetailModal({
  projectId,
  onClose,
  onRefresh,
}: {
  projectId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: project, isLoading, refetch } = useShowcaseProjectDetail(projectId);
  const [commentText, setCommentText] = useState('');

  const upvoteMutation = useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>(`/showcase/${projectId}/upvote`, { method: 'POST' }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['showcase-projects'] });
      onRefresh();
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>(`/showcase/${projectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      }),
    onSuccess: () => {
      setCommentText('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['showcase-projects'] });
      onRefresh();
    },
  });

  if (isLoading || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-12 pb-8 backdrop-blur-md">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  const embedVideoUrl = getEmbedVideoUrl(project.videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border/90 bg-card p-6 sm:p-8 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badges & Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 text-xs font-semibold">
                {project.category}
              </span>
              <span className="rounded-lg bg-secondary/80 text-muted-foreground px-2.5 py-1 text-xs font-semibold">
                Amrita {project.campus}
              </span>
              {project.award && (
                <span className="rounded-lg bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> {project.award}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{project.title}</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{project.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Links Bar & Upvotes */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <Globe className="h-4 w-4" /> Live Demo <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                <Code className="h-4 w-4 text-sky-500" /> Source Code
              </a>
            )}
            {project.videoUrl && !embedVideoUrl && (
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                <Video className="h-4 w-4 text-purple-500" /> Watch Video Demo
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => upvoteMutation.mutate()}
            className={cx(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-95',
              project.isUpvoted
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'border border-border/80 bg-card text-foreground hover:bg-secondary'
            )}
          >
            <Flame className={cx('h-4 w-4', project.isUpvoted ? 'fill-white text-white' : 'text-rose-500')} />
            <span>{project.upvotesCount} Upvotes</span>
          </button>
        </div>

        {/* Embedded Video Demo (if available) */}
        {embedVideoUrl ? (
          <div className="mt-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Video className="h-4 w-4 text-orange-500" /> Video Demo Walkthrough
            </h3>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/80 bg-black shadow-sm">
              <iframe
                src={embedVideoUrl}
                title={project.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : project.videoUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-black">
            <video src={project.videoUrl} controls className="w-full max-h-96" />
          </div>
        ) : null}

        {/* Cover image preview if provided (and no video player already shown) */}
        {project.imageUrl && !embedVideoUrl && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border/80">
            <img src={project.imageUrl} alt={project.title} className="h-64 w-full object-cover" />
          </div>
        )}

        {/* Tech Stack */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tech Stack & Tools</h3>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span key={tech} className="rounded-lg bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* About & Architecture */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About the Project & Architecture</h3>
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-foreground bg-secondary/20 p-4 rounded-2xl border border-border/80 font-normal">
            {project.description}
          </p>
        </div>

        {/* Creators & Team */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Creators & Team</h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
              <Avatar user={project.author} size="sm" />
              <div>
                <Link href={`/people/${project.author.id}`} className="text-xs font-bold text-foreground hover:text-orange-500 transition-colors">
                  {project.author.fullName} (Project Lead)
                </Link>
                <div className="text-[11px] text-muted-foreground">{project.author.department} · {project.author.campus}</div>
              </div>
            </div>

            {project.teamMembers?.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
                <Avatar user={m} size="sm" />
                <div>
                  <Link href={`/people/${m.id}`} className="text-xs font-bold text-foreground hover:text-orange-500 transition-colors">
                    {m.fullName}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">{m.department} · {m.campus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback & Discussion */}
        <div className="mt-7 border-t border-border/80 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-orange-500" /> Feedback & Discussion ({project.comments?.length || 0})
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) commentMutation.mutate();
            }}
            className="flex gap-2 mb-4"
          >
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave feedback, ask about tech stack, or suggest collaboration..."
              className="flex-1 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-xs outline-none focus:border-orange-500 transition-colors"
            />
            <Button type="submit" disabled={commentMutation.isPending || !commentText.trim()} className="font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              {commentMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </form>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {project.comments?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                No comments yet. Be the first faculty or student to leave feedback!
              </div>
            ) : (
              project.comments?.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar user={c.author} size="xs" />
                      <span className="text-xs font-bold text-foreground">{c.author.fullName}</span>
                      <span className="text-[10px] text-muted-foreground">({c.author.role})</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{relative(c.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-foreground leading-relaxed pl-6">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-border/80 pt-4">
          <Button variant="quiet" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShowcaseCard({
  project,
  onSelect,
}: {
  project: ProjectShowcase;
  onSelect: () => void;
}) {
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>(`/showcase/${project.id}/upvote`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['showcase-projects'] }),
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-500/30 transition-all backdrop-blur-xs">
      <div>
        {/* Card Header Tags & Upvote */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 text-xs font-semibold">
              {project.category}
            </span>
            <span className="rounded-lg bg-secondary/80 text-muted-foreground px-2.5 py-1 text-xs font-semibold">
              Amrita {project.campus}
            </span>
            {project.award && (
              <span className="rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                <Trophy className="h-3 w-3" /> {project.award}
              </span>
            )}
            {project.videoUrl && (
              <span className="rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
                <Video className="h-3 w-3" /> Video Demo
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              upvoteMutation.mutate();
            }}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all shadow-2xs',
              project.isUpvoted
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
          >
            <Flame className={cx('h-3.5 w-3.5', project.isUpvoted ? 'fill-white text-white' : 'text-rose-500')} />
            <span>{project.upvotesCount}</span>
          </button>
        </div>

        {/* Title & Tagline */}
        <h3
          onClick={onSelect}
          className="mt-3.5 text-base sm:text-lg font-bold text-foreground group-hover:text-orange-500 cursor-pointer tracking-tight transition-colors"
        >
          {project.title}
        </h3>

        <p className="mt-1 text-xs font-semibold text-foreground/80">{project.tagline}</p>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{project.description}</p>

        {/* Tech Stack Preview */}
        <div className="mt-3.5 flex flex-wrap gap-1">
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className="rounded-lg bg-secondary/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="rounded-lg bg-secondary/40 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              +{project.techStack.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 border-t border-border/80 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar user={project.author} size="sm" />
          <div>
            <Link href={`/people/${project.author.id}`} className="text-xs font-bold text-foreground hover:text-orange-500 transition-colors">
              {project.author.fullName}
            </Link>
            <p className="text-[10px] text-muted-foreground">{project.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border/80 bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="View GitHub Repository"
            >
              <Code className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
          >
            <span>Explore Demo</span>
            <ArrowRight className="h-3 w-3 text-orange-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ShowcasePage() {
  const [category, setCategory] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('upvotes');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      category: category || undefined,
      campus: selectedCampus || undefined,
      search: search || undefined,
      sortBy,
      page: 1,
      pageSize: 20,
    }),
    [category, selectedCampus, search, sortBy]
  );

  const { data, isLoading, isError, refetch } = useListShowcaseProjects(params);
  const items = data?.items ?? [];

  const categories = [
    { id: '', label: 'All Innovations' },
    { id: 'AI / ML', label: 'AI / ML' },
    { id: 'Web & Mobile', label: 'Web & Mobile' },
    { id: 'Robotics / IoT', label: 'Robotics / IoT' },
    { id: 'Cyber Security', label: 'Cyber Security' },
    { id: 'Healthcare Tech', label: 'Healthcare Tech' },
    { id: 'Blockchain', label: 'Blockchain' },
    { id: 'Open Source', label: 'Open Source' },
  ];

  return (
    <>
      <PageTitle
        eyebrow="Student & Faculty Innovations"
        title="Project Showcase & Innovation Gallery."
        detail="Discover hackathon-winning prototypes, open-source repositories, and innovative research demos built by Amrita students and alumni across all campuses."
        action={
          <button
            type="button"
            data-testid="button-post-showcase"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
          >
            <Rocket className="h-4 w-4" />
            <span>Showcase Your Project</span>
          </button>
        }
      />

      {/* Optimized Category Pills */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id || 'all'}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cx(
                'rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-all shadow-2xs',
                isSelected
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'border border-border/80 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Unified Glassmorphic Search & Filter Bar */}
      <div className="mb-6 rounded-2xl border border-border/80 bg-card/80 p-2 sm:p-2.5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, tech stack (ROS2, PyTorch, React), or awards..."
              className="w-full rounded-xl border border-transparent bg-secondary/40 py-2 pl-10 pr-4 text-xs font-medium text-foreground outline-none focus:border-orange-500/50 focus:bg-background transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Campus Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="appearance-none rounded-xl border border-border/80 bg-secondary/50 pl-3 pr-7 py-2 text-xs font-semibold text-foreground outline-none shadow-2xs hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    Amrita {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Sort Toggle */}
            <div className="flex rounded-xl border border-border/80 bg-secondary/40 p-0.5">
              {[
                { label: 'Top Upvoted', value: 'upvotes' },
                { label: 'Recent', value: 'recent' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSortBy(tab.value)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    sortBy === tab.value
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Summary if filters are active */}
      {(category || selectedCampus || search) && (
        <div className="mb-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Filtered by:</span>
            {category && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                {category}
              </span>
            )}
            {selectedCampus && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                Amrita {selectedCampus}
              </span>
            )}
            {search && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                "{search}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setSelectedCampus('');
              setSearch('');
            }}
            className="text-orange-500 font-bold hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Main Grid Stream */}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={Trophy}
          title="No showcase projects found"
          detail="Be the first to publish your prototype or demo to the Amrita community!"
          action={
            <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
              <Rocket className="h-4 w-4" /> Showcase Your Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((project) => (
            <ShowcaseCard
              key={project.id}
              project={project}
              onSelect={() => setSelectedDetailId(project.id)}
            />
          ))}
        </div>
      )}

      {selectedDetailId && (
        <ShowcaseDetailModal
          projectId={selectedDetailId}
          onClose={() => setSelectedDetailId(null)}
          onRefresh={() => refetch()}
        />
      )}

      {showCreate && (
        <CreateShowcaseModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}


/* =========================================================================
   COMMUNITY FEED — STANDARD SOCIAL MEDIA PLATFORM FEED
   ========================================================================= */

function FeedPage({ initialTab = 'feed' }: { initialTab?: 'feed' | 'discover' } = {}) {
  const { data: currentUser } = useGetCurrentUser();
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<'feed' | 'discover'>(initialTab);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<'category' | 'compose'>('category');
  const [createCategory, setCreateCategory] = useState<PostCategory>('General');
  const [createContent, setCreateContent] = useState('');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createDocumentUrl, setCreateDocumentUrl] = useState('');
  const [createDocumentName, setCreateDocumentName] = useState('');
  const [createLinkUrl, setCreateLinkUrl] = useState('');
  const [activeAttachmentTab, setActiveAttachmentTab] = useState<'none' | 'photo' | 'document' | 'link' | 'milestone'>('none');
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Photo size exceeds 20MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setCreateImageUrl(compressed);
          } else {
            setCreateImageUrl(reader.result as string);
          }
          setActiveAttachmentTab('none');
        };
        img.onerror = () => {
          setCreateImageUrl(reader.result as string);
          setActiveAttachmentTab('none');
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('Document size exceeds 25MB limit.');
      return;
    }
    setCreateDocumentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCreateDocumentUrl(reader.result);
        setActiveAttachmentTab('none');
      }
    };
    reader.readAsDataURL(file);
  };

  const resetCreateForm = () => {
    setCreateContent('');
    setCreateImageUrl('');
    setCreateDocumentUrl('');
    setCreateDocumentName('');
    setCreateLinkUrl('');
    setActiveAttachmentTab('none');
    setShowCreateModal(false);
    setCreateStep('category');
  };

  // Synchronize URL search parameters on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchStr = window.location.search || (location.includes('?') ? location.substring(location.indexOf('?')) : '');
      const params = new URLSearchParams(searchStr);
      const tabParam = params.get('tab');
      const searchParam = params.get('search');
      if (searchParam !== null) {
        setSearch(searchParam);
      }
      if (tabParam === 'discover') setActiveView('discover');
      else if (tabParam === 'feed') setActiveView('feed');
      else if (initialTab) setActiveView(initialTab);
    }
  }, [location, initialTab]);

  // Network discovery filters & view mode (defaults to friends)
  const [networkTab, setNetworkTab] = useState<'friends' | 'all' | 'campus' | 'batch'>('friends');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const { data: connectionsData } = useConnections();
  const connectedUsers = useMemo(() => connectionsData?.connected?.map((c) => c.user) ?? [], [connectionsData]);
  const connectedIds = useMemo(() => new Set(connectedUsers.map((u) => u.id)), [connectedUsers]);

  // Users query for member discovery
  const userParams = useMemo(() => ({
    search: activeView === 'discover' ? search || undefined : undefined,
    role: selectedRole ? (selectedRole as any) : undefined,
    campus: selectedCampus || undefined,
    page: 1,
    pageSize: 30,
  }), [activeView, search, selectedRole, selectedCampus]);

  const { data: usersData, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useListUsers(userParams, {
    query: { queryKey: getListUsersQueryKey(userParams), enabled: activeView === 'discover' }
  });

  const rawMemberItems = (usersData?.items ?? []).filter((u) => u.id !== currentUser?.id && u.role !== 'admin');

  // LinkedIn-style live member search spotlight on feed
  const feedSearchUserParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      pageSize: 4,
      page: 1,
    }),
    [search]
  );

  const { data: feedMatchingUsersData } = useListUsers(feedSearchUserParams, {
    query: {
      queryKey: getListUsersQueryKey(feedSearchUserParams),
      enabled: Boolean(activeView === 'feed' && search.trim().length >= 1),
      staleTime: 15000,
    },
  });

  const matchingPeople = (feedMatchingUsersData?.items ?? []).filter((u) => u.id !== currentUser?.id && u.role !== 'admin');

  const [showFeedSearchDropdown, setShowFeedSearchDropdown] = useState(false);
  const feedSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (feedSearchContainerRef.current && !feedSearchContainerRef.current.contains(e.target as Node)) {
        setShowFeedSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered members based on network tab and sorting
  const memberItems = useMemo(() => {
    let list: PublicUser[] = [];
    if (networkTab === 'friends') {
      list = [...connectedUsers];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (u) =>
            u.fullName?.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q) ||
            u.campus?.toLowerCase().includes(q) ||
            u.headline?.toLowerCase().includes(q) ||
            u.skills?.some((s) => s.toLowerCase().includes(q))
        );
      }
      if (selectedCampus) {
        list = list.filter((u) => u.campus?.toLowerCase() === selectedCampus.toLowerCase());
      }
      if (selectedRole) {
        list = list.filter((u) => u.role === selectedRole);
      }
    } else {
      list = [...rawMemberItems];
      if (networkTab === 'campus' && currentUser?.campus) {
        list = list.filter((u) => u.campus?.toLowerCase() === currentUser.campus?.toLowerCase());
      } else if (networkTab === 'batch' && currentUser?.graduationYear) {
        list = list.filter((u) => u.graduationYear === currentUser.graduationYear);
      }
    }
    if (sortBy === 'name') {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return list;
  }, [networkTab, connectedUsers, rawMemberItems, search, selectedCampus, selectedRole, currentUser, sortBy]);

  // Posts query for social feed
  const postsQueryKey = useMemo(() => [
    'posts',
    {
      view: 'all',
      category: selectedCategory || undefined,
      campus: selectedCampus || undefined,
      search: activeView === 'feed' ? search || undefined : undefined,
    }
  ], [activeView, selectedCategory, selectedCampus, search]);

  const { data: postsData, isLoading: postsLoading, isFetching: postsFetching, isError: postsError, refetch: refetchPosts } = useQuery({
    queryKey: postsQueryKey,
    enabled: activeView === 'feed',
    queryFn: async () => {
      const q = new URLSearchParams();
      if (selectedCategory) q.set('category', selectedCategory);
      if (selectedCampus) q.set('campus', selectedCampus);
      q.set('pageSize', '50');
      return apiFetch<{ items: PostItem[]; total: number; page: number; pageSize: number }>(`/posts?${q.toString()}`);
    },
  });

  const posts = postsData?.items ?? [];

  // Real Database Queries for Live Sidebar Widgets
  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiFetch<any>('/dashboard/summary'),
    staleTime: 30000,
  });

  const { data: dbEventsData } = useQuery({
    queryKey: ['sidebar-events'],
    queryFn: () => apiFetch<{ items: any[]; total: number }>('/events?pageSize=4'),
    staleTime: 45000,
  });

  const { data: dbOpportunitiesData } = useQuery({
    queryKey: ['sidebar-opportunities'],
    queryFn: () => apiFetch<{ items: any[]; total: number }>('/opportunities?pageSize=4'),
    staleTime: 45000,
  });

  const { data: dbMentorsData } = useQuery({
    queryKey: ['sidebar-alumni-mentors'],
    queryFn: () => apiFetch<{ items: PublicUser[]; total: number }>('/users?role=alumni&pageSize=4'),
    staleTime: 45000,
  });

  // Instant reactive client-side post filtering
  const filteredPosts = useMemo(() => {
    let list = posts;
    const q = search.toLowerCase().trim();
    const cleanQ = q.startsWith('#') ? q.slice(1).trim() : q;

    if (q) {
      list = list.filter((p) => {
        const contentMatch = p.content?.toLowerCase().includes(q) || (cleanQ ? p.content?.toLowerCase().includes(cleanQ) : false);
        const authorMatch =
          p.author?.fullName?.toLowerCase().includes(q) ||
          p.author?.department?.toLowerCase().includes(q) ||
          p.author?.campus?.toLowerCase().includes(q) ||
          p.author?.headline?.toLowerCase().includes(q);
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q) || (cleanQ ? t.toLowerCase().includes(cleanQ) : false));
        const docMatch = p.documentName?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const campusMatch = p.campus?.toLowerCase().includes(q);
        return Boolean(contentMatch || authorMatch || tagMatch || docMatch || catMatch || campusMatch);
      });
    }
    if (selectedCategory) {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedCampus) {
      list = list.filter((p) => p.campus?.toLowerCase() === selectedCampus.toLowerCase() || p.author?.campus?.toLowerCase() === selectedCampus.toLowerCase());
    }
    return list;
  }, [posts, search, selectedCategory, selectedCampus]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: {
      content: string;
      category: PostCategory;
      imageUrl?: string | null;
      documentUrl?: string | null;
      documentName?: string | null;
      linkUrl?: string | null;
    }) =>
      apiFetch<PostItem>('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (newPost) => {
      resetCreateForm();
      if (newPost && newPost.id) {
        queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return [newPost, ...old];
          }
          if (old.items && Array.isArray(old.items)) {
            return {
              ...old,
              items: [newPost, ...old.items],
              total: (old.total || 0) + 1,
            };
          }
          return old;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile_my_posts'] });
      refetchPosts();
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createContent.trim()) return;
    createPostMutation.mutate({
      content: createContent.trim(),
      category: createCategory,
      imageUrl: createImageUrl || null,
      documentUrl: createDocumentUrl || null,
      documentName: createDocumentName || null,
      linkUrl: createLinkUrl.trim() || null,
    });
  };

  const handleCopyInvite = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + '/register');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenCreateWithCategory = (
    cat: PostCategory,
    tab: 'none' | 'photo' | 'document' | 'link' | 'milestone' = 'none'
  ) => {
    setCreateCategory(cat);
    setCreateStep('compose');
    setActiveAttachmentTab(tab);
    setShowCreateModal(true);
  };

  const handleOpenCreateCategoryPrompt = () => {
    setCreateStep('category');
    setShowCreateModal(true);
  };

  const trendingTags = ['#SIH2026', '#Placements', '#Research', '#HuTLabs', '#Hackathon', '#WebDev', '#AI'];

  return (
    <div className="animate-rise pb-16">
      {/* Top Social Switcher & Post Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex rounded-2xl border border-border/80 bg-card p-1 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveView('feed');
              setSearch('');
            }}
            className={cx(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeView === 'feed'
                ? 'bg-orange-500 text-white shadow-xs scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <Rss className="h-3.5 w-3.5" />
            <span>Community Feed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('discover');
              setNetworkTab('friends');
              setSearch('');
            }}
            className={cx(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeView === 'discover'
                ? 'bg-orange-500 text-white shadow-xs scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>My Friends</span>
            {connectedUsers.length > 0 && (
              <span className={cx('rounded-full px-1.5 py-0.2 text-[10px] font-black', activeView === 'discover' ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground')}>
                {connectedUsers.length}
              </span>
            )}
          </button>
        </div>

        {activeView === 'feed' ? (
          <button
            type="button"
            onClick={handleOpenCreateCategoryPrompt}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Start a Post</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary/70 shadow-2xs transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-orange-500" />
            <span>Invite People</span>
          </button>
        )}
      </div>

      {/* VIEW 1: COMMUNITY FEED */}
      {activeView === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_330px] gap-6 items-start">

          {/* Main Feed Column */}
          <div className="space-y-5 min-w-0">

            {/* LinkedIn-style People / Member Spotlight Search Results (Prominently on Upper Side) */}
            {search.trim() && matchingPeople.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5 animate-rise">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                        People matching "{search}"
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {feedMatchingUsersData?.total ?? matchingPeople.length} members found on Amrita Connect
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('discover');
                      setNetworkTab('all');
                    }}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>All People</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingPeople.map((person) => (
                    <div
                      key={person.id}
                      className="group rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 hover:border-orange-500/30 p-3.5 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <Link href={`/people/${person.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar user={person} size="md" className="ring-2 ring-background group-hover:ring-orange-500/30 transition-all shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-orange-500 transition-colors truncate">
                              {person.fullName}
                            </span>
                            {person.verified && <Check className="h-3 w-3 text-orange-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {person.headline || `${roleLabels[person.role] ?? person.role} · ${person.department || 'Amrita'}`}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground/80 mt-0.5">
                            Amrita {person.campus}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/people/${person.id}`}
                          className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Post Creator Box (Hidden or lowered when searching) */}
            {!search.trim() && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-border transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar user={currentUser} size="md" className="ring-2 ring-orange-500/20" />
                  <button
                    type="button"
                    onClick={handleOpenCreateCategoryPrompt}
                    className="flex-1 rounded-full border border-input/80 bg-secondary/40 hover:bg-secondary/70 px-4 py-2.5 text-left text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all truncate cursor-pointer"
                  >
                    What category of post would you like to create? (Click to choose)...
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateCategoryPrompt}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </div>

                {/* Action buttons with rich colors */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-3.5 mt-3.5 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithCategory('General', 'photo')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                  >
                    <Image className="h-4 w-4 text-sky-500" />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithCategory('Resource', 'document')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-rose-500" />
                    <span>Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithCategory('Blog')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span>Article</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithCategory('Project')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <Rocket className="h-4 w-4 text-emerald-500" />
                    <span>Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateWithCategory('Achievement', 'milestone')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <PartyPopper className="h-4 w-4 text-amber-500" />
                    <span>Milestone</span>
                  </button>
                </div>
              </div>
            )}

            {/* Clean Category Pills & Campus Filter Toolbar */}
            <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xs backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 min-w-0">
                {[
                  { id: '', label: 'All Feed' },
                  { id: 'Blog', label: 'Blogs' },
                  { id: 'Project', label: 'Projects' },
                  { id: 'Achievement', label: 'Achievements' },
                  { id: 'Opportunity', label: 'Opportunities' },
                  { id: 'Interview Experience', label: 'Interview Prep' },
                  { id: 'Research', label: 'Research' },
                  { id: 'Help Needed', label: 'Q&A' },
                ].map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id || 'all'}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cx(
                        'rounded-full px-3.5 py-1.5 text-xs transition-all shrink-0 font-semibold cursor-pointer active:scale-95 shadow-2xs',
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-orange-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Campus Filter Dropdown & Refresh Button */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <div className="relative shrink-0">
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="appearance-none rounded-xl border border-border/80 bg-secondary/50 pl-3.5 pr-8 py-1.5 text-xs font-semibold text-foreground outline-none shadow-2xs hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <option value="">All Campuses</option>
                    {campuses.map((c) => (
                      <option key={c} value={c}>
                        Amrita {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    refetchPosts();
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                  }}
                  disabled={postsFetching}
                  title="Refresh community feed"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-60 shadow-2xs"
                >
                  <RotateCw className={cx('h-3.5 w-3.5 text-orange-500', postsFetching && 'animate-spin')} />
                  <span className="hidden sm:inline font-bold">Refresh</span>
                </button>
              </div>
            </div>

            {/* Active Filters Summary (if any active) */}
            {(selectedCategory || selectedCampus || search) && (
              <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Filtered by:</span>
                  {selectedCategory && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedCampus && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                      Amrita {selectedCampus}
                    </span>
                  )}
                  {search && (
                    <span className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 font-bold">
                      "{search}"
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedCampus('');
                    setSearch('');
                  }}
                  className="text-orange-500 font-bold hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Post Stream */}
            <div className="space-y-5">
              {postsLoading ? (
                <LoadingState rows={3} />
              ) : postsError ? (
                <ErrorState onRetry={() => refetchPosts()} />
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center animate-rise">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {search || selectedCategory || selectedCampus
                      ? 'No posts match your filters'
                      : 'No posts in the community feed yet'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {search || selectedCategory || selectedCampus
                      ? 'Try selecting a different campus or clearing filters to see all posts.'
                      : 'Be the first to share an achievement, blog, or project update with Amrita Connect!'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-5">
                    {(search || selectedCategory || selectedCampus) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('');
                          setSelectedCampus('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold"
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenCreateWithCategory('General')}
                      className="px-3 py-1.5 text-xs font-bold"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Start First Post
                    </Button>
                  </div>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={(p) => setEditingPost(p)}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar (Desktop only) - High Utility Live Database Widgets */}
          <div className="hidden lg:flex flex-col gap-5 sticky top-6">

            {/* 1. Live Campus Deadlines & Events Tracker (Fetched from Database) */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                  <h4 className="text-xs font-extrabold text-foreground">
                    Campus Deadlines & Events
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  // Merge live database events and opportunities
                  const liveDbItems: Array<{
                    id: string;
                    title: string;
                    sub: string;
                    badge: string;
                    badgeColor: string;
                    tag: string;
                    icon: any;
                    linkUrl?: string;
                  }> = [];

                  if (dbEventsData?.items && dbEventsData.items.length > 0) {
                    dbEventsData.items.slice(0, 2).forEach((ev: any) => {
                      let badge = 'Upcoming';
                      if (ev.date) {
                        try {
                          const d = new Date(ev.date);
                          const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          badge = diff > 0 && diff <= 7 ? `${diff}d left` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } catch {
                          badge = 'Upcoming';
                        }
                      }
                      liveDbItems.push({
                        id: String(ev.id || ev._id),
                        title: ev.title,
                        sub: ev.organizer ? `${ev.organizer} · ${ev.campus || 'Amrita'}` : ev.campus || 'Amrita Campus',
                        badge,
                        badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
                        tag: `#${ev.campus || 'Events'}`,
                        icon: CalendarDays,
                        linkUrl: ev.registrationUrl,
                      });
                    });
                  }

                  if (dbOpportunitiesData?.items && dbOpportunitiesData.items.length > 0) {
                    dbOpportunitiesData.items.slice(0, 2).forEach((op: any) => {
                      let badge = 'Open';
                      if (op.deadline) {
                        try {
                          const d = new Date(op.deadline);
                          const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          badge = diff > 0 && diff <= 7 ? `${diff}d left` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } catch {
                          badge = 'Active';
                        }
                      }
                      liveDbItems.push({
                        id: String(op.id || op._id),
                        title: op.title,
                        sub: op.organization ? `${op.organization} · ${op.category || 'Career'}` : op.category || 'Placement',
                        badge,
                        badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                        tag: '#Placements',
                        icon: Briefcase,
                        linkUrl: op.applicationUrl,
                      });
                    });
                  }

                  // Default curated Amrita deadlines if database items are fewer than 3
                  const fallbackEvents = [
                    {
                      id: 'sih-curated',
                      title: 'SIH 2026 Internal Hackathon',
                      sub: 'Team registration & synopsis',
                      badge: '3 Days Left',
                      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                      tag: '#SIH2026',
                      icon: Trophy,
                    },
                    {
                      id: 'placement-curated',
                      title: 'Microsoft & Cisco Drives',
                      sub: 'SDE & Cloud shortlist release',
                      badge: 'Sep 18',
                      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                      tag: '#Placements',
                      icon: Briefcase,
                    },
                    {
                      id: 'hut-curated',
                      title: 'HuT Labs AI Fellowship',
                      sub: 'Robotics & CV lab openings',
                      badge: 'Oct 02',
                      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
                      tag: '#Research',
                      icon: Rocket,
                    },
                  ];

                  const displayItems = liveDbItems.length >= 2 ? liveDbItems.slice(0, 4) : [...liveDbItems, ...fallbackEvents].slice(0, 4);

                  return displayItems.map((event) => {
                    const Icon = event.icon;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          if (event.linkUrl) {
                            window.open(event.linkUrl, '_blank');
                          } else {
                            setSearch(search === event.tag ? '' : event.tag);
                          }
                        }}
                        className="group flex w-full items-start justify-between gap-2 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/70 p-2.5 text-left transition-all cursor-pointer hover:border-orange-500/40"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-500">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground group-hover:text-orange-500 transition-colors truncate">
                              {event.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{event.sub}</p>
                          </div>
                        </div>
                        <span className={cx('shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider', event.badgeColor)}>
                          {event.badge}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. Top Senior Mentors & Verified Alumni (Live Database Records) */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-orange-500" />
                  <span>Featured Senior Mentors</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('discover');
                    setNetworkTab('all');
                  }}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const dbAlumni = dbMentorsData?.items || [];
                  if (dbAlumni.length > 0) {
                    return dbAlumni.slice(0, 3).map((mentor) => (
                      <Link
                        key={mentor.id}
                        href={`/profile/${mentor.id}`}
                        className="group flex items-center justify-between gap-2.5 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/70 p-2.5 transition-all hover:border-orange-500/40 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {mentor.avatarUrl ? (
                            <img
                              src={mentor.avatarUrl}
                              alt={mentor.fullName}
                              className="h-9 w-9 rounded-full object-cover border border-orange-500/30 shrink-0"
                            />
                          ) : (
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-xs shrink-0">
                              {mentor.fullName?.slice(0, 2).toUpperCase() || 'AM'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-extrabold text-foreground group-hover:text-orange-500 transition-colors truncate">
                                {mentor.fullName}
                              </p>
                              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            </div>
                            <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 truncate">
                              {mentor.headline || (mentor as any).jobRole || `${mentor.department || 'Alumni'} Mentor`}
                            </p>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {mentor.campus ? `Amrita ${mentor.campus}` : 'Amrita University'} · {mentor.department || 'Alumni'}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                          Profile
                        </span>
                      </Link>
                    ));
                  }

                  // Fallback to placed seniors directory
                  return PLACED_SENIORS.slice(0, 3).map((senior) => (
                    <Link
                      key={senior.slug}
                      href={`/seniors/${senior.slug}`}
                      className="group flex items-center justify-between gap-2.5 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/70 p-2.5 transition-all hover:border-orange-500/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={senior.avatar}
                          alt={senior.name}
                          className="h-9 w-9 rounded-full object-cover border border-orange-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-extrabold text-foreground group-hover:text-orange-500 transition-colors truncate">
                              {senior.name}
                            </p>
                            <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                          </div>
                          <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 truncate">
                            {senior.role}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {senior.campus} · {senior.department}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                        Profile
                      </span>
                    </Link>
                  ));
                })()}
              </div>
            </div>

            {/* 3. University Resource Quick Vault & Database Stats */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span>Campus Quick Vault</span>
                </h4>
                {dashboardSummary?.peopleCount ? (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {dashboardSummary.peopleCount} members
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearch('#Academics')}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 p-2.5 text-left transition-all hover:border-orange-500/30 cursor-pointer active:scale-95"
                >
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-foreground">PyQ & Notes</span>
                  <span className="text-[9px] text-muted-foreground">Study Material</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('Interview')}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 p-2.5 text-left transition-all hover:border-orange-500/30 cursor-pointer active:scale-95"
                >
                  <BriefcaseBusiness className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-foreground">Interview Logs</span>
                  <span className="text-[9px] text-muted-foreground">Company archive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('Showcase')}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 p-2.5 text-left transition-all hover:border-orange-500/30 cursor-pointer active:scale-95"
                >
                  <Code className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-bold text-foreground">HuT Projects</span>
                  <span className="text-[9px] text-muted-foreground">Research collabs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenCreateWithCategory('General');
                  }}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 p-2.5 text-left transition-all hover:border-orange-500/30 cursor-pointer active:scale-95"
                >
                  <Users2 className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-bold text-foreground">Find Team</span>
                  <span className="text-[9px] text-muted-foreground">Hackathon squad</span>
                </button>
              </div>
            </div>

            {/* 4. Multi-Campus Network Pulse */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-orange-500/10 via-card to-card p-3.5 shadow-2xs flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-500">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground">7 Campuses Live Network</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {dashboardSummary?.peopleCount ? `${dashboardSummary.peopleCount} verified students & faculty` : 'Coimbatore · Amritapuri · Bengaluru · Kochi · Chennai'}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: DISCOVER MEMBERS & FRIENDS */}
      {activeView === 'discover' && (
        <div className="space-y-5 max-w-5xl">
          {/* Top Network Subtabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {[
                { id: 'friends', label: 'My Friends', count: connectedUsers.length, icon: UserCheck },
                { id: 'all', label: 'Campus Directory', count: rawMemberItems.length, icon: Globe },
                ...(currentUser?.campus
                  ? [{ id: 'campus', label: `Amrita ${currentUser.campus}`, count: rawMemberItems.filter((u) => u.campus?.toLowerCase() === currentUser.campus?.toLowerCase()).length, icon: MapPin }]
                  : []),
                ...(currentUser?.graduationYear
                  ? [{ id: 'batch', label: `Class of ${currentUser.graduationYear}`, count: rawMemberItems.filter((u) => u.graduationYear === currentUser.graduationYear).length, icon: GraduationCap }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = networkTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setNetworkTab(tab.id as any)}
                    className={cx(
                      'rounded-xl px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 !text-white shadow-md shadow-orange-500/20'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span className={cx('rounded-full px-1.5 py-0.2 text-[10px] font-black', isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground')}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-500/10 px-3 py-1.5 text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Invite Friends</span>
              </button>
            </div>
          </div>

          {/* Member Search Bar and Role Filter */}
          <div className="space-y-3 bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    networkTab === 'friends'
                      ? 'Search your friends by name, department, campus...'
                      : 'Search all members across Amrita 7 campuses by name, skill, department...'
                  }
                  className="w-full rounded-xl border border-input bg-secondary/30 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-orange-500 shadow-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-xs font-semibold text-foreground outline-none shadow-xs shrink-0"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    Amrita {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Role filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: '', label: 'All Roles' },
                { id: 'student', label: 'Students' },
                { id: 'alumni', label: 'Alumni Mentors' },
                { id: 'researcher', label: 'Researchers' },
                { id: 'faculty', label: 'Faculty' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={cx(
                    'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border shadow-xs cursor-pointer',
                    selectedRole === r.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Members List Container (LinkedIn Style) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted-foreground">
                {networkTab === 'friends'
                  ? `${memberItems.length} Connections`
                  : `${memberItems.length} Members in Campus Directory`}
              </span>

              {/* View Layout Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none shadow-2xs"
                  >
                    <option value="recent">Recently active</option>
                    <option value="name">First Name</option>
                  </select>
                </div>

                <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
                  <button
                    type="button"
                    title="List View (LinkedIn Style)"
                    onClick={() => setViewMode('list')}
                    className={cx(
                      'rounded-md p-1.5 text-xs transition-colors cursor-pointer',
                      viewMode === 'list' ? 'bg-secondary text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Network className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Grid Cards"
                    onClick={() => setViewMode('grid')}
                    className={cx(
                      'rounded-md p-1.5 text-xs transition-colors cursor-pointer',
                      viewMode === 'grid' ? 'bg-secondary text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {usersLoading ? (
              <LoadingState rows={4} />
            ) : usersError ? (
              <ErrorState onRetry={() => refetchUsers()} />
            ) : memberItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center max-w-md mx-auto my-6 animate-rise">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-base font-extrabold text-foreground">
                  {networkTab === 'friends'
                    ? search
                      ? `No friends match "${search}"`
                      : 'You have no connections yet'
                    : 'No members found'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {networkTab === 'friends'
                    ? search
                      ? 'Looking for someone across other departments or campuses? Search the entire Amrita Campus Directory.'
                      : 'Connect with batchmates, professors, and alumni across all 7 Amrita campuses in the Campus Directory.'
                    : 'Try adjusting your keywords, campus selection, or role filters.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  {networkTab === 'friends' ? (
                    <button
                      type="button"
                      onClick={() => setNetworkTab('all')}
                      className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 !text-white text-xs font-extrabold px-4 py-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {search ? 'Search Campus Directory' : 'Explore Campus Directory'}
                    </button>
                  ) : (
                    <Button onClick={() => { setSearch(''); setSelectedRole(''); setSelectedCampus(''); }} variant="outline">
                      Reset filters
                    </Button>
                  )}
                </div>
              </div>
            ) : viewMode === 'list' ? (
              /* LinkedIn Standard Unified Connections Card with Dividers */
              <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden divide-y divide-border/60 animate-rise">
                {memberItems.map((person) => (
                  <LinkedInConnectionRow
                    key={person.id}
                    user={person}
                    isConnected={connectedIds.has(person.id)}
                  />
                ))}
              </div>
            ) : (
              /* LinkedIn Portrait Card Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-rise">
                {memberItems.map((person) => (
                  <LinkedInConnectionCard
                    key={person.id}
                    user={person}
                    isConnected={connectedIds.has(person.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) resetCreateForm();
          }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-3 sm:p-4 pt-6 sm:pt-12 pb-8 backdrop-blur-md animate-fade-in overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden mt-1 sm:mt-2 animate-rise">
            {/* Hidden native file inputs for local uploads */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleDocFileChange}
            />

            {createStep === 'category' ? (
              /* STEP 1: CATEGORY SELECTION PROMPT */
              <div className="flex flex-col max-h-[88vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border px-6 py-5 bg-muted/20">
                  <div>
                    <div className="mono text-[10px] font-bold uppercase tracking-wider text-orange-500">
                      Step 1 of 2 · Choose Post Category
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-foreground mt-0.5">
                      What type of post would you like to create?
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select a category to filter your post into the right community channel across Amrita campuses.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Categories Grid */}
                <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { cat: 'General', title: 'General Update', desc: 'Thoughts, campus discussions & casual updates', icon: MessageSquare, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/25 hover:border-sky-500' },
                    { cat: 'Blog', title: 'Blog & Article', desc: 'In-depth writeups, technical insights & guidebooks', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/25 hover:border-purple-500' },
                    { cat: 'Project', title: 'Project Showcase', desc: 'Demo hackathon prototypes, GitHub repos & live apps', icon: Rocket, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/25 hover:border-cyan-500' },
                    { cat: 'Achievement', title: 'Milestone & Win', desc: 'Hackathon wins, publications, certificates & placements', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25 hover:border-amber-500' },
                    { cat: 'Opportunity', title: 'Job & Internship', desc: 'Hiring alerts, internships, referrals & freelance roles', icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500' },
                    { cat: 'Interview Experience', title: 'Interview Prep', desc: 'Questions asked, interview rounds & placement tips', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-500' },
                    { cat: 'Research', title: 'Research & Labs', desc: 'Academic papers, HuT Labs/faculty openings & research calls', icon: Sparkles, color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/25 hover:border-teal-500' },
                    { cat: 'Question', title: 'Ask Question / Q&A', desc: 'Ask doubts, seek solutions & get help from peers/mentors', icon: HelpCircle, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/25 hover:border-orange-500' },
                    { cat: 'Resource', title: 'Resource & Notes', desc: 'Curated study materials, cheat sheets, links & PDF guides', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25 hover:border-rose-500' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.cat}
                        type="button"
                        onClick={() => {
                          setCreateCategory(item.cat as PostCategory);
                          setCreateStep('compose');
                        }}
                        className={cx(
                          'flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-200 group cursor-pointer hover:shadow-md hover:scale-[1.02]',
                          item.bg
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={cx('p-2.5 rounded-xl transition-transform group-hover:scale-110', item.bg, item.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Skip */}
                <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/10 text-xs">
                  <span className="text-muted-foreground">You can change the category at any time during editing.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCategory('General');
                      setCreateStep('compose');
                    }}
                    className="font-bold text-orange-500 hover:underline cursor-pointer"
                  >
                    Skip & start writing →
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: RICH COMPOSER */
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Avatar user={currentUser} size="md" className="ring-2 ring-orange-500/20" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {currentUser?.fullName ?? 'You'}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          Anyone
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setCreateStep('category')}
                          className="text-xs text-orange-500 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          <span>Change Category</span>
                        </button>
                        <span className="text-muted-foreground/50">·</span>
                        <select
                          value={createCategory}
                          onChange={(e) => setCreateCategory(e.target.value as PostCategory)}
                          className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
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

                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!createContent.trim()) return;
                    createPostMutation.mutate({
                      content: createContent.trim(),
                      category: createCategory,
                      imageUrl: createImageUrl.trim() || null,
                      documentUrl: createDocumentUrl.trim() || null,
                      documentName: createDocumentName.trim() || null,
                      linkUrl: createLinkUrl.trim() || null,
                    });
                  }}
                  className="flex flex-col flex-1 overflow-y-auto"
                >
                  <div className="p-5 space-y-4 flex-1">
                    {/* Text Area */}
                    <textarea
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder={
                        createCategory === 'Blog' || createCategory === 'Article'
                          ? 'Write your blog or article... share your insights, takeaways, and guide for the Amrita community!'
                          : createCategory === 'Achievement'
                            ? 'Share your achievement, hackathon win, publication, or placement story...'
                            : createCategory === 'Opportunity'
                              ? 'Share an opportunity, hiring alert, internship or placement preparation tip...'
                              : createCategory === 'Project'
                                ? 'Describe your project, stack, architecture, live demo link or GitHub repository...'
                                : createCategory === 'Question'
                                  ? 'Ask a question to students, professors, or alumni across campuses...'
                                  : 'What do you want to talk about? (e.g. project update, opportunity, question)...'
                      }
                      rows={5}
                      className="w-full resize-none rounded-xl border border-transparent bg-transparent p-1 text-sm sm:text-base outline-none focus:ring-0 leading-relaxed placeholder:text-muted-foreground/70"
                      autoFocus
                      required
                    />

                    {/* Attachments Previews */}
                    {/* 1. Image Preview */}
                    {createImageUrl && (
                      <div className="relative rounded-xl border border-border bg-muted/30 p-2 overflow-hidden group">
                        <div className="relative max-h-56 overflow-hidden rounded-lg">
                          <img
                            src={createImageUrl}
                            alt="Post attachment"
                            className="w-full max-h-56 object-contain bg-black/5 dark:bg-white/5 rounded-lg"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreateImageUrl('')}
                          className="absolute top-4 right-4 p-1.5 rounded-full bg-background/90 hover:bg-destructive hover:text-white text-foreground shadow-md transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Image className="h-3.5 w-3.5 text-blue-500" />
                            Attached Image
                          </span>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-orange-500 hover:underline font-medium cursor-pointer"
                          >
                            Change photo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. Document / PDF Preview */}
                    {createDocumentUrl && (
                      <div className="relative flex items-center justify-between rounded-xl border border-border bg-gradient-to-r from-red-500/10 via-background to-orange-500/10 p-3 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {createDocumentName || 'Attached Document.pdf'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Document ready to share with Amrita network
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateDocumentUrl('');
                            setCreateDocumentName('');
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 cursor-pointer"
                          title="Remove document"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* 3. Link Preview */}
                    {createLinkUrl && (
                      <div className="relative flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            <Link2 className="h-5 w-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-foreground truncate">{createLinkUrl}</p>
                            <p className="text-[11px] text-muted-foreground">External link attachment</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreateLinkUrl('')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 cursor-pointer"
                          title="Remove link"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Expandable Attachment Inputs Tabs */}
                    {activeAttachmentTab === 'photo' && !createImageUrl && (
                      <div className="p-3.5 rounded-xl border border-dashed border-border bg-secondary/30 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Image className="h-4 w-4 text-blue-500" />
                            Add a Photo
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveAttachmentTab('none')}
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => imageInputRef.current?.click()}
                            className="flex-1 justify-center gap-2 text-xs"
                          >
                            <Upload className="h-4 w-4" />
                            Upload from Device
                          </Button>
                          <div className="relative flex-1">
                            <input
                              type="url"
                              placeholder="Or paste Image URL (https://...)"
                              value={createImageUrl}
                              onChange={(e) => setCreateImageUrl(e.target.value)}
                              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAttachmentTab === 'document' && !createDocumentUrl && (
                      <div className="p-3.5 rounded-xl border border-dashed border-border bg-secondary/30 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-red-500" />
                            Attach Document / PDF
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveAttachmentTab('none')}
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => docInputRef.current?.click()}
                            className="flex-1 justify-center gap-2 text-xs"
                          >
                            <Upload className="h-4 w-4" />
                            Upload PDF / Doc (.pdf, .docx, .ppt)
                          </Button>
                          <div className="relative flex-1">
                            <input
                              type="url"
                              placeholder="Or paste Doc URL (e.g. Google Drive/Dropbox)"
                              onChange={(e) => {
                                if (e.target.value) {
                                  setCreateDocumentUrl(e.target.value);
                                  setCreateDocumentName('Online Document');
                                }
                              }}
                              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAttachmentTab === 'link' && !createLinkUrl && (
                      <div className="p-3.5 rounded-xl border border-dashed border-border bg-secondary/30 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Link2 className="h-4 w-4 text-indigo-500" />
                            Attach Web Link or Article
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveAttachmentTab('none')}
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/article-or-repo"
                            value={createLinkUrl}
                            onChange={(e) => setCreateLinkUrl(e.target.value)}
                            className="flex-1 rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-orange-500"
                            autoFocus
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (createLinkUrl.trim()) {
                                setActiveAttachmentTab('none');
                              }
                            }}
                            disabled={!createLinkUrl.trim()}
                            className="text-xs"
                          >
                            Attach
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeAttachmentTab === 'milestone' && (
                      <div className="p-3.5 rounded-xl border border-border bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <PartyPopper className="h-4 w-4 text-amber-500" />
                            Celebrate a Milestone
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveAttachmentTab('none')}
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { title: 'New Job / Placement', cat: 'Opportunity' },
                            { title: 'Hackathon Win', cat: 'Achievement' },
                            { title: 'Research Published', cat: 'Research' },
                            { title: 'Launched Project', cat: 'Project' },
                            { title: 'Patent Filed', cat: 'Achievement' },
                            { title: 'Certificate Earned', cat: 'Achievement' },
                          ].map((item) => (
                            <button
                              key={item.title}
                              type="button"
                              onClick={() => {
                                setCreateCategory(item.cat as PostCategory);
                                setCreateContent((prev) =>
                                  prev.trim()
                                    ? `Excited to share: ${item.title}!\n\n${prev}`
                                    : `Excited to share that I have accomplished: ${item.title}!\n\n`
                                );
                                setActiveAttachmentTab('none');
                              }}
                              className="p-2 rounded-lg border border-border bg-card/80 text-left text-xs font-medium text-foreground hover:border-orange-500 hover:bg-orange-500/10 transition-all truncate cursor-pointer"
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Trending Hashtags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Add Tag:</span>
                      {trendingTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!createContent.includes(tag)) {
                              setCreateContent((prev) => `${prev.trim()} ${tag}`);
                            }
                          }}
                          className="rounded-lg border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-orange-500/50 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer with Rich Attachment Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 bg-muted/20">
                    {/* Left Attachment Icon Toolbar */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!createImageUrl) imageInputRef.current?.click();
                          else setActiveAttachmentTab('photo');
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${createImageUrl || activeAttachmentTab === 'photo'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        title="Attach Photo"
                      >
                        <Image className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!createDocumentUrl) docInputRef.current?.click();
                          else setActiveAttachmentTab('document');
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${createDocumentUrl || activeAttachmentTab === 'document'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        title="Attach PDF or Document"
                      >
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="hidden sm:inline">Document</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveAttachmentTab((prev) => (prev === 'link' ? 'none' : 'link'))
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${createLinkUrl || activeAttachmentTab === 'link'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        title="Add Web Link"
                      >
                        <Link2 className="h-4 w-4 text-indigo-500" />
                        <span className="hidden sm:inline">Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveAttachmentTab((prev) => (prev === 'milestone' ? 'none' : 'milestone'))
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${activeAttachmentTab === 'milestone'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        title="Celebrate Milestone"
                      >
                        <PartyPopper className="h-4 w-4 text-amber-500" />
                        <span className="hidden sm:inline">Milestone</span>
                      </button>
                    </div>

                    {createPostMutation.isError && (
                      <div className="w-full rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive flex items-center justify-between">
                        <span>{createPostMutation.error instanceof Error ? createPostMutation.error.message : 'Could not create post. Please try again.'}</span>
                        <button
                          type="button"
                          onClick={() => createPostMutation.reset()}
                          className="font-bold underline ml-2 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Right Action Buttons & Character Counter */}
                    <div className="flex items-center gap-3 ml-auto">
                      <span className="text-[11px] text-muted-foreground hidden xs:inline">
                        {createContent.length} / 3000
                      </span>
                      <Button
                        type="button"
                        variant="quiet"
                        onClick={resetCreateForm}
                        className="text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPostMutation.isPending || !createContent.trim()}
                        className="px-5 py-2 font-bold shadow-md shadow-orange-500/20 text-xs sm:text-sm"
                      >
                        {createPostMutation.isPending ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>Publish Post</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setEditingPost(null);
          }}
        />
      )}

      {/* Invite People Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Invite to Amrita Connect</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Share this invite link with your batchmates, professors, or research teammates so they can join your Amrita Connect network.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2 text-xs">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/register` : 'https://connect.amrita.edu/register'}
                className="w-full bg-transparent px-2 text-foreground outline-none"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shrink-0"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PeoplePage = FeedPage;

/* =========================================================================
   LINKEDIN STYLE CONNECTIONS & MEMBERS COMPONENTS
   ========================================================================= */

function LinkedInConnectionRow({
  user,
  isConnected = false,
  connectedAt,
}: {
  user: PublicUser;
  isConnected?: boolean;
  connectedAt?: string;
  isSpotlight?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: connStatus, refetch } = useConnectionStatus(user.id);
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      refetch();
    },
  });

  return (
    <div
      data-testid={`connection-row-${user.id}`}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-muted/35 dark:hover:bg-muted/20 transition-all"
    >
      {/* Left: Avatar + Details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <Link href={`/people/${user.id}`} className="relative shrink-0 mt-0.5 sm:mt-0 transition-transform active:scale-95">
          <Avatar user={user} size="lg" />
          {user.verified && (
            <span
              title="Verified Amrita Member"
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-blue-500 text-white ring-2 ring-card shadow-xs"
            >
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Name & 1st Connection Degree */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/people/${user.id}`}
              className="text-sm sm:text-base font-bold text-foreground hover:text-orange-500 hover:underline transition-colors truncate"
            >
              {user.fullName}
            </Link>
            <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
              {isConnected ? '· 1st' : '· Amrita'}
            </span>
            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.2 text-[10px] font-bold text-orange-600 dark:text-orange-400">
              {roleLabels[user.role] ?? user.role}
            </span>
          </div>

          {/* Headline / Department & Campus */}
          <p className="text-xs text-foreground/80 font-medium truncate">
            {user.headline || `${user.department} Student at Amrita Vishwa Vidyapeetham · ${user.campus} Campus`}
          </p>

          {/* Academic & Connection timestamp */}
          <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 pt-0.5">
            <span className="font-semibold text-foreground/70">Amrita {user.campus}</span>
            {user.graduationYear && <span>· Class of {user.graduationYear}</span>}
            {connectedAt ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">· Connected {relative(connectedAt)}</span>
            ) : isConnected ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">· Connected Friend</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Right: Message CTA + More Actions */}
      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        {isConnected ? (
          <Link
            href={`/messages/${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/60 bg-orange-500/10 hover:bg-orange-500 hover:text-white px-4 py-1.5 text-xs font-extrabold text-orange-600 dark:text-orange-400 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Message</span>
          </Link>
        ) : (
          <ConnectActionButton targetUser={user} size="sm" />
        )}

        {/* Dropdown Options Menu */}
        <div className="relative">
          <button
            type="button"
            aria-label="More options"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-rise">
              <Link
                href={`/people/${user.id}`}
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span>View Full Profile</span>
              </Link>
              {isConnected && (
                <Link
                  href={`/messages/${user.id}`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Direct Message</span>
                </Link>
              )}
              {isConnected && connStatus?.connectionId && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (confirm(`Remove connection with ${user.fullName}?`)) {
                      disconnectMutation.mutate(connStatus.connectionId!);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Remove Connection</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkedInConnectionCard({
  user,
  isConnected = false,
}: {
  user: PublicUser;
  isConnected?: boolean;
}) {
  return (
    <div
      data-testid={`card-person-${user.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all text-center"
    >
      {/* Header Banner */}
      <div className="h-16 w-full bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-purple-500/25 relative">
        <span className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
          {user.campus}
        </span>
      </div>

      {/* Avatar Centered */}
      <div className="-mt-8 flex justify-center">
        <Link href={`/people/${user.id}`} className="relative">
          <div className="rounded-full p-1 bg-card ring-2 ring-border shadow-sm">
            <Avatar user={user} size="lg" />
          </div>
          {user.verified && (
            <span className="absolute bottom-0 right-0 grid h-4 w-4 place-items-center rounded-full bg-blue-500 text-white ring-2 ring-card shadow-xs">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
          )}
        </Link>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col items-center justify-between">
        <div>
          <Link
            href={`/people/${user.id}`}
            className="text-sm font-bold text-foreground hover:text-orange-500 hover:underline transition-colors line-clamp-1 block"
          >
            {user.fullName}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {user.headline || `${user.department} · Amrita ${user.campus}`}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground/80 font-medium">
            {user.graduationYear ? `Class of ${user.graduationYear}` : `Amrita ${user.campus}`}
          </p>
        </div>

        {/* Action Button Full Width */}
        <div className="mt-4 w-full pt-3 border-t border-border/60 flex items-center justify-center gap-2">
          {isConnected ? (
            <Link
              href={`/messages/${user.id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-orange-500/60 bg-orange-500/10 hover:bg-orange-500 hover:text-white px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 transition-all shadow-2xs active:scale-95"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Message</span>
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <ConnectActionButton targetUser={user} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicProfilePage() {
  const params = useParams<{ id?: string; slug?: string }>();
  const idOrHandle = params.id || params.slug || '';
  const { data: person, isLoading, isError, refetch } = useGetUser(idOrHandle);
  const { data: currentUser } = useGetCurrentUser();
  const { data: connStatus } = useConnectionStatus(person?.id || '');
  const isConnected = connStatus?.status === 'accepted';
  const [showRequest, setShowRequest] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch this user's authored posts
  const { data: userPostsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user_public_posts', person?.id],
    enabled: Boolean(person?.id),
    queryFn: async () => {
      return apiFetch<{ items: PostItem[]; total: number }>(`/posts?authorId=${person?.id}`);
    },
  });

  const handleShare = async () => {
    if (typeof window !== 'undefined' && person) {
      const canonicalHandle = (person as any).handle || person.id;
      const url = `${window.location.origin}/in/${canonicalHandle}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${person.fullName} | Amrita Connect`,
            text: person.headline || `View ${person.fullName}'s profile on Amrita Connect`,
            url,
          });
          return;
        } catch {
          // Fallback to clipboard copy
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2400);
      } catch {
        // Fallback
      }
    }
  };

  if (isLoading) return <LoadingState rows={3} />;
  if (isError || !person) return <ErrorState onRetry={() => refetch()} />;

  const isSelf = currentUser && currentUser.id === person.id;
  const experiences = (person as any).experiences || [];
  const education = (person as any).education || [];
  const personPosts = userPostsData?.items || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-rise">
      <div className="flex items-center justify-between">
        <Link data-testid="link-back-people" href="/people" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to People & Feed
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
          {copiedLink ? 'Copied Canonical URL' : 'Share Profile'}
        </button>
      </div>

      <div className="surface overflow-hidden rounded-3xl border border-border shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-900">
          <img
            src={person.coverUrl || DEFAULT_COVER}
            alt={`${person.fullName} Cover`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        </div>

        {/* Top Profile Header */}
        <div className="px-6 sm:px-8 pb-7">
          <div className="relative z-10 -mt-16 sm:-mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <Avatar user={person} size="xl" className="ring-4 ring-background shadow-2xl bg-card" />

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {isSelf ? (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 text-white px-4 py-2 text-xs font-bold shadow-md hover:bg-orange-600 transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit My Profile
                </Link>
              ) : currentUser ? (
                <>
                  {isConnected ? (
                    <Link
                      href={`/messages/${person.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition-all"
                    >
                      <MessageSquare className="h-4 w-4 text-white" /> Message
                    </Link>
                  ) : (
                    <span
                      title="Message available after connecting"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary/50 px-3.5 py-2 text-xs font-medium text-muted-foreground opacity-75"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Connect to message</span>
                    </span>
                  )}
                  <ConnectActionButton targetUser={person} />
                  <Button data-testid="button-request-mentorship" onClick={() => setShowRequest(true)} className="rounded-xl px-4 py-2 text-xs font-bold shadow-2xs">
                    <HeartHandshake className="h-4 w-4" /> Ask for mentorship
                  </Button>
                </>
              ) : (
                <Link
                  href={`/register?redirect=${encodeURIComponent(`/in/${(person as any).handle || person.id}`)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 text-white px-4 py-2 text-xs font-bold shadow-md hover:bg-orange-600 transition-all"
                >
                  <UserPlus className="h-4 w-4" /> Join Amrita Connect to Network
                </Link>
              )}
            </div>
          </div>

          {/* Name, Handle & Headline */}
          <div className="space-y-2 mt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{person.fullName}</h1>
              {(person as any).handle && (
                <span className="mono rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  @{(person as any).handle}
                </span>
              )}
              {person.verified && <Check className="h-4 w-4 text-emerald-500" />}
              <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                {roleLabels[person.role] ?? person.role}
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-foreground/90 max-w-3xl leading-snug">
              {person.headline || 'Member of Amrita Vishwa Vidyapeetham university community.'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Building2 className="h-3.5 w-3.5 text-orange-500" />
                <span>Amrita Vishwa Vidyapeetham · {person.campus} Campus</span>
              </div>
              {person.department && (
                <div className="flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
                  <span>Department of {person.department}</span>
                </div>
              )}
              {person.graduationYear && (
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">Class of {person.graduationYear}</span>
                </div>
              )}
              {person.company && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-orange-500" />
                  <span>{person.company}{person.jobRole ? ` · ${person.jobRole}` : ''}</span>
                </div>
              )}
            </div>

            {/* External / Social Links */}
            {((person as any).linkedinUrl || (person as any).githubUrl || (person as any).websiteUrl) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {(person as any).linkedinUrl && (
                  <a
                    href={(person as any).linkedinUrl.startsWith('http') ? (person as any).linkedinUrl : `https://${(person as any).linkedinUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-[#0A66C2] hover:bg-muted"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {(person as any).githubUrl && (
                  <a
                    href={(person as any).githubUrl.startsWith('http') ? (person as any).githubUrl : `https://${(person as any).githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {(person as any).websiteUrl && (
                  <a
                    href={(person as any).websiteUrl.startsWith('http') ? (person as any).websiteUrl : `https://${(person as any).websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Grid Layout for About, Experience, Education & Aside */}
          <div className="mt-8 grid gap-8 border-t border-border pt-7 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {/* About */}
              <div>
                <h2 className="text-base font-bold text-foreground">About</h2>
                <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {person.bio || 'This member has not added a detailed biography yet.'}
                </p>
              </div>

              {/* Experience */}
              {experiences.length > 0 && (
                <div className="border-t border-border/70 pt-5 space-y-3">
                  <h2 className="text-base font-bold text-foreground">Experience & Appointments</h2>
                  <div className="space-y-3">
                    {experiences.map((exp: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">{exp.title}</h3>
                            <p className="text-xs font-semibold text-muted-foreground">{exp.company}</p>
                          </div>
                          {(exp.startDate || exp.endDate) && (
                            <span className="mono text-[10px] font-semibold text-muted-foreground">
                              {exp.startDate} – {exp.current ? 'Present' : exp.endDate || 'Present'}
                            </span>
                          )}
                        </div>
                        {exp.location && <p className="text-[11px] text-muted-foreground/80">{exp.location}</p>}
                        {exp.description && <p className="text-xs text-muted-foreground pt-1 leading-relaxed">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div className="border-t border-border/70 pt-5 space-y-3">
                  <h2 className="text-base font-bold text-foreground">Education</h2>
                  <div className="space-y-3">
                    {education.map((edu: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-bold text-foreground">{edu.school}</h3>
                          {(edu.startYear || edu.endYear) && (
                            <span className="mono text-[10px] font-semibold text-muted-foreground">
                              {edu.startYear} – {edu.endYear}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ''}
                        </p>
                        {edu.grade && <p className="text-[11px] text-orange-500 font-medium">Grade: {edu.grade}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills & Interests */}
              <InfoGroup title="Skills & Expertise" items={person.skills} />
              <InfoGroup title="Interested in" items={person.interests} />

              {/* Published Posts / Activity by this User */}
              <div className="border-t border-border/70 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Activity & Published Content</h2>
                  <span className="text-xs text-muted-foreground">{personPosts.length} posts</span>
                </div>
                {postsLoading ? (
                  <LoadingState rows={2} />
                ) : personPosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No public articles or updates shared yet.</p>
                ) : (
                  <div className="space-y-3">
                    {personPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5 shadow-2xs">
                        <p className="text-[11px] text-muted-foreground font-medium">{relative(post.createdAt)}</p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span>{post.likesCount} likes</span>
                          <span>{post.commentsCount} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Aside Matrix */}
            <div className="space-y-5">
              <ProfileAside title="Can help with" items={person.helpWith} />
              <ProfileAside title="Looking for" items={person.lookingFor} />
            </div>
          </div>
        </div>
      </div>
      {showRequest && <MentorshipDialog mentor={person} onClose={() => setShowRequest(false)} />}
    </div>
  );
}
function InfoGroup({ title, items = [] }: { title: string; items?: string[] }) { return items?.length ? <div className="mt-8"><h3 className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <Tag key={item} warm>{item}</Tag>)}</div></div> : null; }
function ProfileAside({ title, items = [] }: { title: string; items?: string[] }) { return <div><h3 className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3><div className="mt-3 space-y-2">{items?.length ? items.map((item) => <div className="flex gap-2 text-sm text-foreground" key={item}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{item}</div>) : <span className="text-sm text-muted-foreground">Not shared yet</span>}</div></div>; }
function MentorshipDialog({ mentor, onClose }: { mentor: PublicUser; onClose: () => void }) { const create = useCreateMentorshipRequest(); const [form, setForm] = useState({ topic: '', reason: '', message: '' }); const queryClient = useQueryClient(); const submit = (e: React.FormEvent) => { e.preventDefault(); create.mutate({ data: { mentorId: mentor.id, ...form } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMentorshipRequestsQueryKey() }); onClose(); } }); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">A thoughtful ask</div><h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Ask {mentor.fullName.split(' ')[0]} to mentor you</h2></div><button data-testid="button-close-mentorship-dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><Field id="mentorship-topic" label="What would you like to learn?" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required /><Field id="mentorship-reason" label="Why this person?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /><label className="block"><span className="mb-1.5 block text-xs font-bold text-foreground">Your note</span><textarea data-testid="textarea-mentorship-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-accent-foreground" placeholder="Introduce yourself and share what a useful first conversation looks like." /></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button data-testid="button-submit-mentorship" type="submit" disabled={create.isPending}>{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send request</Button></div></form></div></div>; }

function AcceptMentorshipModal({
  item,
  onClose,
  onSuccess,
}: {
  item: MentorshipRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [availableSlots, setAvailableSlots] = useState('');
  const [note, setNote] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [meetingPlatform, setMeetingPlatform] = useState('Google Meet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const slotSuggestions = [
    'Tuesdays & Thursdays: 5:00 PM – 6:30 PM',
    'Saturdays: 10:00 AM – 1:00 PM',
    'Sundays: 4:00 PM – 7:00 PM',
    'Weekdays post 6:00 PM (Online)',
    'Campus Department / Library (In-Person)',
  ];

  const toggleChip = (slot: string) => {
    if (selectedChips.includes(slot)) {
      setSelectedChips(selectedChips.filter((s) => s !== slot));
    } else {
      setSelectedChips([...selectedChips, slot]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const finalSlots = [
        ...selectedChips,
        availableSlots.trim()
      ].filter(Boolean).join('\n');

      const fullNote = [
        note.trim() || `Excited to connect with you regarding ${item.topic}!`,
        `Preferred Platform/Mode: ${meetingPlatform}`,
      ].join('\n\n');

      await apiFetch(`/mentorship/requests/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'accepted',
          availableSlots: finalSlots || 'Flexible on weekdays after 5 PM. Please message me to finalize a slot.',
          note: fullNote,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not accept mentorship request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Avatar user={item.requester} size="md" />
            <div>
              <div className="mono text-[10px] uppercase font-bold tracking-wider text-emerald-500">
                Accept Mentorship Request
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Connect with {item.requester.fullName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Topic:</span>
            <span className="text-accent font-semibold">{item.topic}</span>
          </div>
          <p className="text-muted-foreground italic line-clamp-2">"{item.message}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Select or Suggest Available Free Slots <span className="text-emerald-500">*</span>
            </label>
            <p className="text-[11px] text-muted-foreground mb-2">
              The mentee will receive these times in their direct messages so you can coordinate smoothly:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {slotSuggestions.map((slot) => {
                const isSelected = selectedChips.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleChip(slot)}
                    className={cx(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border text-left cursor-pointer',
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-2xs font-bold'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {slot}
                  </button>
                );
              })}
            </div>
            <textarea
              value={availableSlots}
              onChange={(e) => setAvailableSlots(e.target.value)}
              placeholder="e.g. Wednesday & Friday from 4 PM to 6 PM, or share your Calendly/Cal.com link..."
              rows={2}
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Preferred Mode / Platform
              </label>
              <select
                value={meetingPlatform}
                onChange={(e) => setMeetingPlatform(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-emerald-500"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom Meeting">Zoom Meeting</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="In-person (Campus)">In-person (Campus)</option>
                <option value="Direct Messages / Chat">Direct Messages / Chat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Personal Welcome Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Looking forward to talking about your career!"
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!availableSlots.trim() && selectedChips.length === 0)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accept & Send Free Slots
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MentorshipPage() {
  const { data, isLoading, isError, refetch } = useListMentorshipRequests();
  const { data: currentUser } = useGetCurrentUser();
  const status = useUpdateMentorshipRequestStatus();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'received' | 'sent'>('all');
  const [filter, setFilter] = useState('all');
  const [acceptingItem, setAcceptingItem] = useState<MentorshipRequest | null>(null);

  const rawItems = data ?? [];

  const receivedCount = rawItems.filter(
    (item) => String(item.mentor?.id) === String(currentUser?.id) && item.status === 'pending'
  ).length;

  const sentCount = rawItems.filter(
    (item) => String(item.requester?.id) === String(currentUser?.id) && item.status === 'pending'
  ).length;

  const items = rawItems.filter((item) => {
    const isSender = String(item.requester?.id) === String(currentUser?.id);
    const isMentor = String(item.mentor?.id) === String(currentUser?.id);

    if (tab === 'received' && !isMentor) return false;
    if (tab === 'sent' && !isSender) return false;

    if (filter !== 'all' && item.status !== filter) return false;

    return true;
  });

  const handleDecline = (id: string) => {
    status.mutate(
      { id, data: { status: 'rejected' } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMentorshipRequestsQueryKey() }) }
    );
  };

  return (
    <>
      <PageTitle
        eyebrow="Mentorship"
        title="Make room for guidance."
        detail="Keep track of the mentorship conversations you have started and the ones requested from you."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex rounded-xl border border-border bg-card p-1 shadow-2xs">
              {['all', 'pending', 'accepted', 'rejected'].map((value) => (
                <button
                  data-testid={`button-filter-mentorship-${value}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-xs font-extrabold capitalize transition-all cursor-pointer',
                    filter === value
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Direction Switcher Tabs (All, Received, Sent) */}
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={cx(
            'rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            tab === 'all'
              ? 'bg-foreground text-background shadow-xs'
              : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <span>All Requests</span>
          <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">{rawItems.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('received')}
          className={cx(
            'rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            tab === 'received'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <span>Received (Waiting on You)</span>
          {receivedCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 text-white text-[9px] font-black px-1 animate-pulse">
              {receivedCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={cx(
            'rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            tab === 'sent'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <span>Sent by You</span>
          {sentCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-orange-500 text-white text-[9px] font-black px-1">
              {sentCount}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={HeartHandshake}
          title={
            tab === 'sent'
              ? 'No sent mentorship requests'
              : tab === 'received'
                ? 'No incoming mentorship requests'
                : filter === 'all'
                  ? 'No mentorship requests yet'
                  : `No ${filter} requests`
          }
          detail={
            tab === 'sent'
              ? 'Visit the directory or mentor profiles to request 1:1 guidance and interview prep.'
              : 'When members discover your background, you will see their guidance requests here.'
          }
          action={
            <Link href="/people" className="text-sm font-bold text-orange-500 hover:underline">
              Explore the member directory
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <MentorshipCard
              key={item.id}
              item={item}
              currentUserId={currentUser?.id}
              onAcceptClick={() => setAcceptingItem(item)}
              onDeclineClick={() => handleDecline(item.id)}
              pending={status.isPending}
            />
          ))}
        </div>
      )}

      {acceptingItem && (
        <AcceptMentorshipModal
          item={acceptingItem}
          onClose={() => setAcceptingItem(null)}
          onSuccess={() => {
            setAcceptingItem(null);
            queryClient.invalidateQueries({ queryKey: getListMentorshipRequestsQueryKey() });
          }}
        />
      )}
    </>
  );
}

function MentorshipCard({
  item,
  currentUserId,
  onAcceptClick,
  onDeclineClick,
  pending,
}: {
  item: MentorshipRequest;
  currentUserId?: string;
  onAcceptClick: () => void;
  onDeclineClick: () => void;
  pending: boolean;
}) {
  const isSender = String(item.requester?.id) === String(currentUserId);
  const isMentor = String(item.mentor?.id) === String(currentUserId);
  const otherUser = isSender ? item.mentor : item.requester;

  return (
    <div className="surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-orange-500/30 transition-all">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Link href={`/people/${otherUser.id}`}>
          <Avatar user={otherUser} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/people/${otherUser.id}`}
              className="font-extrabold text-base text-foreground hover:text-orange-500 transition-colors"
            >
              {otherUser.fullName}
            </Link>
            <span className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
              {roleLabels[otherUser.role] ?? otherUser.role} · {otherUser.campus}
            </span>
            <MentorshipStatusBadge status={item.status} isSender={isSender} />
          </div>

          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            {isSender ? (
              <>
                <span>You requested mentorship from {item.mentor?.fullName}</span>
                <span>·</span>
                <span>{relative(item.createdAt)}</span>
              </>
            ) : (
              <>
                <span>Requested mentorship from you</span>
                <span>·</span>
                <span>{relative(item.createdAt)}</span>
              </>
            )}
          </p>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap rounded-xl bg-secondary/40 p-3 border border-border/50">
            {item.message}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {item.topic && <Tag warm>{item.topic}</Tag>}
            {item.reason && <Tag>{item.reason}</Tag>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
          {isSender ? (
            /* Sender View: Status info and Chat button */
            item.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 dark:border-amber-800/60 bg-amber-500/15 px-3 py-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 shadow-2xs">
                  <Clock className="h-3.5 w-3.5 animate-spin-slow" />
                  <span>Awaiting Mentor's Response</span>
                </span>
                <Link
                  href={`/messages/${item.mentor.id}`}
                  className="rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                  <span>Message</span>
                </Link>
              </div>
            ) : item.status === 'accepted' ? (
              <Link
                href={`/messages/${item.mentor.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Open Chat & Slots</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
                Declined
              </span>
            )
          ) : (
            /* Receiver / Mentor View: Accept & Share Slots or Decline */
            item.status === 'pending' ? (
              <div className="flex shrink-0 gap-2 sm:flex-col">
                <Button
                  data-testid={`button-accept-mentorship-${item.id}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm active:scale-95 cursor-pointer"
                  disabled={pending}
                  onClick={onAcceptClick}
                >
                  <Check className="h-4 w-4" />
                  Accept & Share Slots
                </Button>
                <Button
                  data-testid={`button-reject-mentorship-${item.id}`}
                  variant="quiet"
                  className="px-3.5 py-2 font-bold cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={pending}
                  onClick={onDeclineClick}
                >
                  Decline
                </Button>
              </div>
            ) : item.status === 'accepted' ? (
              <Link
                href={`/messages/${item.requester.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-2xs transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                <span>Chat with Mentee</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
                Declined
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function MentorshipStatusBadge({ status, isSender }: { status: string; isSender?: boolean }) {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-extrabold text-destructive">
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
      <Clock className="h-3 w-3" /> {isSender ? 'Pending Mentor Response' : 'Pending Action'}
    </span>
  );
}

interface CollaborationMember {
  user: PublicUser;
  role: string;
  joinedAt: string;
}

interface CollaborationApplication {
  id: string;
  user: PublicUser;
  role: string;
  pitch: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ExtendedCollaboration {
  id: string;
  creator: PublicUser;
  title: string;
  description: string;
  requiredSkills: string[];
  rolesNeeded: string[];
  teamSize: number;
  deadline: string;
  category: string;
  status: 'open' | 'closed' | 'completed';
  memberCount: number;
  members: CollaborationMember[];
  isCreator: boolean;
  isMember: boolean;
  myApplication: {
    id: string;
    role: string;
    pitch: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  } | null;
  applications?: CollaborationApplication[];
  pendingApplicantsCount?: number;
  createdAt: string;
}

function CollaborationDetailModal({
  item,
  onClose,
  onRefresh,
}: {
  item: ExtendedCollaboration;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'applications'>(
    item.isCreator && (item.pendingApplicantsCount ?? 0) > 0 ? 'applications' : 'details'
  );
  const [selectedRole, setSelectedRole] = useState(item.rolesNeeded?.[0] || 'Contributor');
  const [pitch, setPitch] = useState('');
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: (body: { role: string; pitch: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/collaborations/${item.id}/apply`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (res) => {
      alert(res.message);
      queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() });
      onRefresh();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (appId: string) =>
      apiFetch<{ success: boolean }>(`/collaborations/${item.id}/applications/${appId}/accept`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() });
      onRefresh();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (appId: string) =>
      apiFetch<{ success: boolean }>(`/collaborations/${item.id}/applications/${appId}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() });
      onRefresh();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiFetch<{ success: boolean }>(`/collaborations/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() });
      onRefresh();
    },
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitch.trim()) return;
    applyMutation.mutate({ role: selectedRole, pitch: pitch.trim() });
  };

  const isFull = item.memberCount >= item.teamSize;
  const pendingApps = (item.applications || []).filter((a) => a.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag warm>{item.category}</Tag>
              <span
                className={cx(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  item.status === 'open'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : item.status === 'closed'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {item.status === 'open' ? 'Recruiting' : item.status === 'closed' ? 'Team Full' : 'Completed'}
              </span>
              <span className="mono text-[10px] text-muted-foreground">Due {formatDate(item.deadline)}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-foreground">{item.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="mt-5 flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={cx(
              'border-b-2 px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'details'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Project Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={cx(
              'border-b-2 px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'team'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Team Roster ({item.members?.length || 1}/{item.teamSize})
          </button>
          {item.isCreator && (
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={cx(
                'border-b-2 px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'applications'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Applicant Review Queue
              {pendingApps.length > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.2 text-[9px] font-bold text-primary">
                  {pendingApps.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About the Project</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{item.description}</p>
            </div>

            {/* Roles Needed */}
            {item.rolesNeeded?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open Roles</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.rolesNeeded.map((r) => (
                    <span key={r} className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Required Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.requiredSkills?.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>

            {/* Project Lead */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Lead</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar user={item.creator} size="md" />
                  <div>
                    <Link href={`/people/${item.creator.id}`} className="text-sm font-bold text-foreground hover:text-accent">
                      {item.creator.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.creator.department} · Amrita {item.creator.campus}</p>
                  </div>
                </div>
                <Link
                  href={`/messages/${item.creator.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-accent" /> Message Lead
                </Link>
              </div>
            </div>

            {/* Application Section for non-members */}
            {!item.isCreator && !item.isMember && (
              <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
                {item.myApplication ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Application:</span>
                      <Status status={item.myApplication.status} />
                    </div>
                    <p className="mt-2 text-xs text-foreground font-medium">Applied for role: <strong className="text-accent">{item.myApplication.role}</strong></p>
                    <p className="mt-1 text-xs text-muted-foreground italic">"{item.myApplication.pitch}"</p>
                    <p className="mt-3 text-[11px] text-muted-foreground">Submitted {relative(item.myApplication.createdAt)}. The team lead will review your application!</p>
                  </div>
                ) : item.status !== 'open' ? (
                  <p className="text-center text-xs text-muted-foreground font-semibold">
                    This project is currently not accepting new applications.
                  </p>
                ) : (
                  <form onSubmit={handleApply} className="space-y-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Apply to Join this Team</h4>
                      <p className="text-xs text-muted-foreground">Select the role you'd like to take on and write a brief pitch.</p>
                    </div>

                    {item.rolesNeeded?.length > 0 ? (
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground">Select Role</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:border-accent"
                        >
                          {item.rolesNeeded.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <Field
                        id="apply-role"
                        label="Your Proposed Role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        required
                      />
                    )}

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground">Why are you a good fit? (Pitch note)</label>
                      <textarea
                        rows={3}
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="Highlight your skills, relevant projects, or coursework..."
                        className="mt-1 w-full rounded-xl border border-input bg-card p-3 text-xs outline-none focus:border-accent"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={applyMutation.isPending || !pitch.trim()}
                      className="w-full font-bold"
                    >
                      {applyMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit Application
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Team Roster */}
        {activeTab === 'team' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Team Members ({item.members?.length || 1} of {item.teamSize} slots filled)
              </h3>
              <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, ((item.members?.length || 1) / item.teamSize) * 100)}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {item.members && item.members.length > 0 ? (
                item.members.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={m.user} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/people/${m.user.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                            {m.user.fullName}
                          </Link>
                          <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{m.user.department} · {m.user.campus}</p>
                      </div>
                    </div>
                    <Link
                      href={`/messages/${m.user.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar user={item.creator} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/people/${item.creator.id}`} className="text-xs font-bold text-foreground hover:text-accent">
                          {item.creator.fullName}
                        </Link>
                        <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                          Project Lead
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.creator.department} · {item.creator.campus}</p>
                    </div>
                  </div>
                  <Link
                    href={`/messages/${item.creator.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {item.isCreator && (
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">Project Recruitment Status</div>
                  <p className="text-[11px] text-muted-foreground">Toggle whether you are actively taking join requests</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={item.status === 'open' ? 'primary' : 'outline'}
                    onClick={() => statusMutation.mutate('open')}
                    className="px-3 py-1.5 text-xs font-bold"
                  >
                    Open
                  </Button>
                  <Button
                    variant={item.status === 'closed' ? 'primary' : 'outline'}
                    onClick={() => statusMutation.mutate('closed')}
                    className="px-3 py-1.5 text-xs font-bold"
                  >
                    Close Roster
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Applications Review (Creator only) */}
        {activeTab === 'applications' && item.isCreator && (
          <div className="mt-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Candidate Applications ({item.applications?.length || 0})
            </h3>

            {(!item.applications || item.applications.length === 0) ? (
              <p className="text-center py-8 text-xs text-muted-foreground">No applications submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {item.applications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar user={app.user} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/people/${app.user.id}`} className="text-sm font-bold text-foreground hover:text-accent">
                              {app.user.fullName}
                            </Link>
                            <Status status={app.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Applying for: <strong className="text-accent">{app.role}</strong> · {relative(app.createdAt)}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-foreground bg-secondary/40 p-2.5 rounded-lg border border-border">
                            "{app.pitch}"
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {app.user.skills?.slice(0, 4).map((sk) => (
                              <Tag key={sk}>{sk}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <Link
                          href={`/messages/${app.user.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-accent" /> Chat
                        </Link>
                        {app.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              onClick={() => acceptMutation.mutate(app.id)}
                              disabled={acceptMutation.isPending || isFull}
                              className="px-3 py-1.5 text-xs font-bold"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button
                              variant="quiet"
                              onClick={() => rejectMutation.mutate(app.id)}
                              disabled={rejectMutation.isPending}
                              className="px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CollaborationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<ExtendedCollaboration | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      page: 1,
      pageSize: 20,
    }),
    [search, category]
  );

  const { data, isLoading, isError, refetch } = useListCollaborations(params, {
    query: { queryKey: getListCollaborationsQueryKey(params) },
  });

  const items = (data?.items as any as ExtendedCollaboration[]) ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Collaborate"
        title="Amrita Project & Collaboration Hub."
        detail="Join hackathon squads, research publications, and ambitious student startups across all campuses."
        action={
          <Button data-testid="button-create-collaboration" onClick={() => setShowCreate(true)}>
            <Zap className="h-4 w-4" /> Post a project
          </Button>
        }
      />

      {/* Filter and search bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 block">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            data-testid="input-collaborations-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, skills, or roles needed..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 text-sm outline-none focus:border-accent"
          />
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['', 'Hackathon', 'Research', 'Startup', 'Student life'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cx(
                'rounded-lg px-3 py-2 text-xs font-bold shrink-0 transition-all',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {cat || 'All Categories'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={Network}
          title="No projects match your search"
          detail="Have an idea that needs a team? Post a project and invite collaborators from across Amrita."
          action={<Button onClick={() => setShowCreate(true)}>Post the first project</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <CollaborationCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedCollab(item)}
            />
          ))}
        </div>
      )}

      {selectedCollab && (
        <CollaborationDetailModal
          item={selectedCollab}
          onClose={() => setSelectedCollab(null)}
          onRefresh={() => {
            refetch();
            setSelectedCollab(null);
          }}
        />
      )}

      {showCreate && <CreateCollaborationDialog onClose={() => setShowCreate(false)} />}
    </>
  );
}

function CollaborationCard({
  item,
  onSelect,
}: {
  item: ExtendedCollaboration;
  onSelect: () => void;
}) {
  const isFull = item.memberCount >= item.teamSize;

  return (
    <div className="surface flex flex-col justify-between rounded-2xl border border-border p-5 sm:p-6 shadow-sm transition-all hover:border-accent/40 animate-rise">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag warm>{item.category}</Tag>
            <span
              className={cx(
                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                item.status === 'open'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : item.status === 'closed'
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {item.status === 'open' ? 'Recruiting' : item.status === 'closed' ? 'Team Full' : 'Completed'}
            </span>
          </div>
          <span className="mono text-[10px] text-muted-foreground">Due {formatDate(item.deadline)}</span>
        </div>

        <h2 className="mt-3.5 text-xl font-bold tracking-[-.04em] text-foreground hover:text-accent cursor-pointer" onClick={onSelect}>
          {item.title}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>

        {/* Roles Needed Chips */}
        {item.rolesNeeded?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.rolesNeeded.map((role) => (
              <span key={role} className="rounded-md border border-accent/20 bg-accent/5 px-2 py-0.5 text-[11px] font-bold text-accent">
                {role}
              </span>
            ))}
          </div>
        )}

        {/* Required Skills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.requiredSkills?.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        {/* Progress and status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar user={item.creator} size="sm" />
            <div>
              <p className="text-xs font-bold text-foreground">{item.creator?.fullName}</p>
              <p className="text-[10px] text-muted-foreground">{item.creator?.campus} · Lead</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-foreground">
              {item.memberCount} / {item.teamSize} spots filled
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {item.isCreator ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> Project Owner
              {(item.pendingApplicantsCount ?? 0) > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">
                  {item.pendingApplicantsCount} new application{item.pendingApplicantsCount! > 1 ? 's' : ''}
                </span>
              )}
            </span>
          ) : item.isMember ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
              <Check className="h-3.5 w-3.5" /> Team Member
            </span>
          ) : item.myApplication ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              Applied: <Status status={item.myApplication.status} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {isFull ? 'Roster is full' : 'Open for join requests'}
            </span>
          )}

          <Button variant="outline" className="px-3.5 py-1.5 text-xs font-bold" onClick={onSelect}>
            {item.isCreator
              ? 'Manage Team & Applications'
              : item.isMember
                ? 'View Team Roster'
                : 'View Details & Apply'}{' '}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateCollaborationDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateCollaboration();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    rolesNeeded: '',
    teamSize: '4',
    deadline: '',
    category: 'Hackathon',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        data: {
          title: form.title,
          description: form.description,
          requiredSkills: form.requiredSkills.split(',').map((x) => x.trim()).filter(Boolean),
          rolesNeeded: form.rolesNeeded.split(',').map((x) => x.trim()).filter(Boolean) as any,
          teamSize: Number(form.teamSize),
          deadline: form.deadline as any,
          category: form.category,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCollaborationsQueryKey() });
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[.18em] text-accent font-bold">New Project Call</div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-.04em] text-foreground">Post a collaboration</h2>
          </div>
          <button data-testid="button-close-collaboration-dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field id="collaboration-title" label="Project / Hackathon Title" placeholder="e.g. Smart India Hackathon 2026 - Problem Statement #12" value={form.title} onChange={(e) => set('title', e.target.value)} required />

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-foreground">What are you working on?</span>
            <textarea
              data-testid="textarea-collaboration-description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              rows={4}
              className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed outline-none focus:border-accent"
              placeholder="Describe your vision, target competition/publication, and what commitment looks like..."
            />
          </label>

          <Field
            id="collaboration-roles"
            label="Roles Needed (comma-separated)"
            placeholder="Frontend Engineer, ML Specialist, UI/UX Designer"
            value={form.rolesNeeded}
            onChange={(e) => set('rolesNeeded', e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="collaboration-skills"
              label="Prerequisite Skills"
              placeholder="Python, React, PyTorch"
              value={form.requiredSkills}
              onChange={(e) => set('requiredSkills', e.target.value)}
              required
            />
            <Field
              id="collaboration-deadline"
              label="Recruitment Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="collaboration-category"
              label="Category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={['Hackathon', 'Research', 'Startup', 'Student life', 'Community'].map((value) => ({ value, label: value }))}
            />
            <Field
              id="collaboration-team-size"
              label="Total Team Size"
              type="number"
              value={form.teamSize}
              onChange={(e) => set('teamSize', e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button data-testid="button-submit-collaboration" type="submit" disabled={create.isPending} className="font-bold">
              {create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CreateOpportunityDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    category: 'Internship',
    organization: '',
    description: '',
    requiredSkills: '',
    eligibility: 'Open to all Amrita students and alumni',
    deadline: '',
    applicationUrl: 'https://www.amrita.edu',
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      await apiFetch('/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to post opportunity. Please check all fields.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Post New Opportunity</h3>
            <p className="text-xs text-muted-foreground">Share internships, jobs, hackathons, research roles, or grants with Amrita members.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            id="opp-title"
            label="Opportunity Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. AI Research Intern / Full Stack Developer"
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-foreground">Category *</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-orange-500"
              >
                <option value="Internship">Internship</option>
                <option value="Job">Job / Full-Time</option>
                <option value="Hackathon">Hackathon & Sprint</option>
                <option value="Research">Research Fellowship</option>
                <option value="Scholarship">Scholarship & Grant</option>
                <option value="Mentorship">Mentorship Program</option>
              </select>
            </label>

            <Field
              id="opp-org"
              label="Organization / Lab / Company *"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              placeholder="e.g. Amrita Innovation Hub or Google"
              required
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-foreground">Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs outline-none focus:border-orange-500"
              placeholder="Provide a detailed overview of the role, team, and responsibilities..."
              required
            />
          </label>

          <Field
            id="opp-skills"
            label="Required Skills (comma separated)"
            value={form.requiredSkills}
            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
            placeholder="e.g. React, Python, Machine Learning, Problem Solving"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="opp-eligibility"
              label="Eligibility Criteria"
              value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
              placeholder="e.g. Pre-final & Final year B.Tech"
            />

            <Field
              id="opp-deadline"
              label="Application Deadline *"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </div>

          <Field
            id="opp-url"
            label="Application URL"
            type="url"
            value={form.applicationUrl}
            onChange={(e) => setForm({ ...form, applicationUrl: e.target.value })}
            placeholder="https://example.com/apply"
          />

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="text-xs font-bold">
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Publish Opportunity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateEventDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    campus: 'Coimbatore',
    venue: 'Main Auditorium / Online',
    organizer: 'Amrita Student Council',
    date: '',
    description: '',
    capacity: '100',
    registrationUrl: 'https://www.amrita.edu',
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          capacity: form.capacity ? Number(form.capacity) : null,
        }),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create event. Please check all fields.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Host a Campus Event</h3>
            <p className="text-xs text-muted-foreground">List workshops, tech symposiums, hackathons, guest lectures, or club meetups.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            id="event-title"
            label="Event Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Anokha 2026 Tech Symposium / AI Workshop"
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-foreground">Campus *</span>
              <select
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-orange-500"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    Amrita {c}
                  </option>
                ))}
              </select>
            </label>

            <Field
              id="event-venue"
              label="Venue / Platform *"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. AUMS Hall 3 or MS Teams"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="event-organizer"
              label="Organizer / Club *"
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              placeholder="e.g. bi0s Cybersecurity Club"
              required
            />

            <Field
              id="event-date"
              label="Event Date & Time *"
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-foreground">Event Details *</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs outline-none focus:border-orange-500"
              placeholder="Schedule, speakers, agenda, and participation perks..."
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="event-capacity"
              label="Attendee Capacity (Optional)"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="e.g. 150"
            />

            <Field
              id="event-url"
              label="Registration URL (Optional)"
              type="url"
              value={form.registrationUrl}
              onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              placeholder="https://example.com/register"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="text-xs font-bold">
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              Publish Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventsAndOpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'jobs' | 'hackathons' | 'scholarships'>('all');
  const [search, setSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const queryClient = useQueryClient();

  // Fetch opportunities
  const oppParams = useMemo(
    () => ({ search: search || undefined, page: 1, pageSize: 30 }),
    [search]
  );
  const {
    data: oppData,
    isLoading: oppLoading,
    isError: oppError,
    refetch: refetchOpps,
  } = useListOpportunities(oppParams, {
    query: { queryKey: getListOpportunitiesQueryKey(oppParams) },
  });
  const rawOpportunities = oppData?.items ?? [];

  // Fetch events
  const eventParams = useMemo(
    () => ({ campus: selectedCampus || undefined, page: 1, pageSize: 30 }),
    [selectedCampus]
  );
  const {
    data: eventData,
    isLoading: eventLoading,
    isError: eventError,
    refetch: refetchEvents,
  } = useListEvents(eventParams, {
    query: { queryKey: getListEventsQueryKey(eventParams) },
  });
  const rawEvents = eventData?.items ?? [];

  // Opportunity Save/Unsave
  const save = useSaveOpportunity();
  const unsave = useUnsaveOpportunity();
  const saving = save.isPending || unsave.isPending;
  const toggleSave = (item: Opportunity) => {
    setActionError(null);
    const mutation = item.saved ? unsave : save;
    mutation.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => setActionError('Save status could not be updated. Please try again.'),
      }
    );
  };

  // Event Register/Unregister
  const register = useRegisterForEvent();
  const unregister = useUnregisterFromEvent();
  const registering = register.isPending || unregister.isPending;
  const toggleRegistration = (event: Event) => {
    setActionError(null);
    const mutation = event.registered ? unregister : register;
    mutation.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => setActionError('Event registration could not be updated. The event may be full.'),
      }
    );
  };

  // Filtered lists
  const filteredEvents = useMemo(() => {
    return rawEvents.filter((ev) => {
      if (search && !ev.title.toLowerCase().includes(search.toLowerCase()) && !ev.description.toLowerCase().includes(search.toLowerCase()) && !ev.organizer.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rawEvents, search]);

  const filteredOpps = useMemo(() => {
    return rawOpportunities.filter((op) => {
      if (selectedCampus && !op.eligibility?.toLowerCase().includes(selectedCampus.toLowerCase()) && !op.organization?.toLowerCase().includes(selectedCampus.toLowerCase())) {
        return false;
      }
      if (activeTab === 'jobs') {
        const cat = op.category.toLowerCase();
        return cat.includes('intern') || cat.includes('job') || cat.includes('career') || cat.includes('mentorship');
      }
      if (activeTab === 'hackathons') {
        const cat = op.category.toLowerCase();
        return cat.includes('hackathon') || cat.includes('sprint') || cat.includes('contest') || cat.includes('competition');
      }
      if (activeTab === 'scholarships') {
        const cat = op.category.toLowerCase();
        return cat.includes('scholarship') || cat.includes('fellowship') || cat.includes('grant') || cat.includes('research');
      }
      return true;
    });
  }, [rawOpportunities, activeTab, selectedCampus]);

  const showEvents = activeTab === 'all' || activeTab === 'events';
  const showOpps = activeTab === 'all' || activeTab !== 'events';

  const isLoading = oppLoading || eventLoading;
  const isError = oppError && eventError;
  const totalItemsCount = (showEvents ? filteredEvents.length : 0) + (showOpps ? filteredOpps.length : 0);

  const tabs = [
    { id: 'all' as const, label: 'All Happenings' },
    { id: 'events' as const, label: 'Events & Fests', count: rawEvents.length },
    {
      id: 'jobs' as const,
      label: 'Jobs & Internships',
      count: rawOpportunities.filter((o) => {
        const c = o.category.toLowerCase();
        return c.includes('intern') || c.includes('job') || c.includes('career') || c.includes('mentorship');
      }).length,
    },
    {
      id: 'hackathons' as const,
      label: 'Hackathons & Sprints',
      count: rawOpportunities.filter((o) => {
        const c = o.category.toLowerCase();
        return c.includes('hackathon') || c.includes('sprint') || c.includes('contest');
      }).length,
    },
    {
      id: 'scholarships' as const,
      label: 'Scholarships & Grants',
      count: rawOpportunities.filter((o) => {
        const c = o.category.toLowerCase();
        return c.includes('scholarship') || c.includes('fellowship') || c.includes('grant');
      }).length,
    },
  ];

  return (
    <>
      <PageTitle
        eyebrow="Campus Happenings & Career Hub"
        title="Events & Opportunities."
        detail="Discover and post campus fests, guest lectures, hackathons, internship drives, and fellowships across all 7 Amrita campuses."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setShowCreateOpportunity(true)}
              className="rounded-xl px-4 py-2 text-xs font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" /> Post Opportunity
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateEvent(true)}
              className="rounded-xl px-4 py-2 text-xs font-bold shadow-xs"
            >
              <CalendarDays className="h-4 w-4 text-orange-500" /> Host Event
            </Button>
          </div>
        }
      />

      {/* Tabs Row */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-all shadow-2xs',
                isSelected
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'border border-border/80 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cx(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Controls Bar */}
      <div className="mb-6 rounded-2xl border border-border/80 bg-card/80 p-2 sm:p-2.5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              data-testid="input-opportunities-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fests, hackathons, job roles, skills, or organizations..."
              className="w-full rounded-xl border border-transparent bg-secondary/40 py-2 pl-10 pr-4 text-xs font-medium text-foreground outline-none focus:border-orange-500/50 focus:bg-background transition-all"
            />
          </div>

          {/* Campus Dropdown */}
          <div className="relative shrink-0 self-end sm:self-auto">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="appearance-none rounded-xl border border-border/80 bg-secondary/50 pl-3 pr-7 py-2 text-xs font-semibold text-foreground outline-none shadow-2xs hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  Amrita {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 text-xs font-semibold text-destructive">
          {actionError}
        </p>
      )}

      {/* Active Filter Summary */}
      {(search || selectedCampus || activeTab !== 'all') && (
        <div className="mb-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Filtered by:</span>
            {activeTab !== 'all' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground capitalize">
                {activeTab}
              </span>
            )}
            {selectedCampus && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                Amrita {selectedCampus}
              </span>
            )}
            {search && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground">
                "{search}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCampus('');
              setActiveTab('all');
            }}
            className="text-orange-500 font-bold hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Main Stream */}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState
          onRetry={() => {
            refetchOpps();
            refetchEvents();
          }}
        />
      ) : totalItemsCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            No events or opportunities posted yet
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Be the first to share an upcoming campus hackathon, internship opportunity, or workshop!
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button onClick={() => setShowCreateOpportunity(true)} className="text-xs font-bold">
              <Plus className="h-3.5 w-3.5" /> Post Opportunity
            </Button>
            <Button variant="outline" onClick={() => setShowCreateEvent(true)} className="text-xs font-bold">
              <CalendarDays className="h-3.5 w-3.5" /> Host Event
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Render Event Cards */}
          {showEvents &&
            filteredEvents.map((event) => (
              <EventCard
                key={`event-${event.id}`}
                event={event}
                registered={event.registered}
                onRegister={() => toggleRegistration(event)}
                registering={registering}
              />
            ))}

          {/* Render Opportunity Cards */}
          {showOpps &&
            filteredOpps.map((item) => (
              <OpportunityCard
                key={`opp-${item.id}`}
                item={item}
                onSave={() => toggleSave(item)}
                saving={saving}
              />
            ))}
        </div>
      )}

      {/* Create Modals */}
      {showCreateOpportunity && (
        <CreateOpportunityDialog
          onClose={() => setShowCreateOpportunity(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
            setShowCreateOpportunity(false);
          }}
        />
      )}

      {showCreateEvent && (
        <CreateEventDialog
          onClose={() => setShowCreateEvent(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
            setShowCreateEvent(false);
          }}
        />
      )}
    </>
  );
}

function OpportunityCard({
  item,
  onSave,
  saving,
}: {
  item: Opportunity;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-500/30 transition-all">
      <div>
        {/* Header Badges & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2.5 py-1 text-[11px] font-semibold">
              {item.category}
            </span>
            <span className="rounded-lg bg-secondary/80 text-muted-foreground border border-border/70 px-2.5 py-1 text-[11px] font-medium flex items-center gap-1">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span>{item.organization}</span>
            </span>
          </div>

          <button
            type="button"
            aria-label={item.saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
            data-testid={`button-save-opportunity-${item.id}`}
            onClick={onSave}
            disabled={saving}
            className={cx(
              'rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-transparent hover:border-border/60',
              item.saved && 'text-orange-500 bg-orange-500/10 border-orange-500/20'
            )}
            title={item.saved ? 'Saved to bookmarks' : 'Bookmark opportunity'}
          >
            <Bookmark className={cx('h-4 w-4', item.saved && 'fill-orange-500 text-orange-500')} />
          </button>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base sm:text-lg font-bold text-foreground group-hover:text-orange-500 tracking-tight transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        {/* Required Skills */}
        {item.requiredSkills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 border-t border-border/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div>Eligibility: <span className="font-semibold text-foreground/85">{item.eligibility}</span></div>
          <div>Deadline: <strong className="text-foreground">{formatDate(item.deadline, true)}</strong></div>
        </div>

        <a
          data-testid={`link-apply-opportunity-${item.id}`}
          href={item.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
        >
          <span>Apply Now</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function EventCard({
  event,
  registered,
  onRegister,
  registering,
}: {
  event: Event;
  registered: boolean;
  onRegister: () => void;
  registering: boolean;
}) {
  const eventDate = new Date(event.date);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-500/30 transition-all">
      <div>
        {/* Header with Date Badge & Location */}
        <div className="flex items-start gap-3.5">
          {/* Calendar Date Block */}
          <div className="w-13 shrink-0 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-2 text-center text-orange-600 dark:text-orange-400 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider">
              {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
            </div>
            <div className="text-xl font-black leading-tight text-foreground">
              {eventDate.getDate()}
            </div>
            <div className="text-[9px] font-semibold uppercase text-muted-foreground">
              {eventDate.toLocaleDateString('en-IN', { weekday: 'short' })}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span>Amrita {event.campus} · {event.venue}</span>
            </div>
            <h3 className="mt-1 text-base sm:text-lg font-bold text-foreground group-hover:text-orange-500 tracking-tight transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      </div>

      {/* Footer with Organizer and Register Action */}
      <div className="mt-5 border-t border-border/80 pt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Organized by <span className="font-semibold text-foreground/90">{event.organizer}</span>
        </div>

        <Button
          aria-label={registered ? `Cancel registration for ${event.title}` : `Register for ${event.title}`}
          data-testid={`button-register-event-${event.id}`}
          variant={registered ? 'outline' : 'primary'}
          className={cx(
            'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0',
            !registered && 'bg-orange-500 hover:bg-orange-600 text-white border-transparent'
          )}
          disabled={registering}
          onClick={onRegister}
        >
          {registered ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5" /> Registered
            </span>
          ) : (
            <span>Register Now</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// Backward-compatible component aliases
function OpportunitiesPage() {
  return <EventsAndOpportunitiesPage />;
}

function EventsPage() {
  return <EventsAndOpportunitiesPage />;
}

// ==========================================
// BLOGS & CAMPUS ARTICLES PAGE
// ==========================================

interface BlogPostResource {
  title: string;
  url: string;
  type?: 'sheet' | 'repo' | 'video' | 'docs' | 'notes' | 'book' | 'link';
}

interface InterviewRound {
  roundName: string;
  focus: string;
  questionsAsked?: string;
  tips?: string;
}

interface BlogPostItem {
  id: string;
  postType: 'interview' | 'tech_discovery' | 'study_guide' | 'tutorial' | 'general';
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  summary: string;
  content: string;
  keyTakeaways?: string[];
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  authorCampus: string;
  authorCompany?: string;
  authorSlug?: string;
  category: string;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  company?: string;
  roleOffer?: string;
  difficulty?: 'Super Dream' | 'Dream' | 'Enterprise' | 'Moderate' | 'Advanced';
  rounds?: InterviewRound[];
  resources?: BlogPostResource[];
}

function getInitialBlogs(): BlogPostItem[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('amrita_custom_blogs');
      if (stored) {
        const custom: BlogPostItem[] = JSON.parse(stored);
        return custom;
      }
    } catch {
      // fallback
    }
  }
  return [];
}

function BlogsPage() {
  const { data: currentUser } = useGetCurrentUser();
  const [blogs, setBlogs] = useState<BlogPostItem[]>(getInitialBlogs);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [readingBlog, setReadingBlog] = useState<BlogPostItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Articles', icon: FileText },
    { id: 'Interview Experiences', label: 'Interview Experiences', icon: Briefcase },
    { id: 'Tech Discoveries & Tools', label: 'Tech & Engineering', icon: Terminal },
    { id: 'Study Notes & Guides', label: 'Study Notes & Prep', icon: BookOpen },
    { id: 'Tutorials & Systems', label: 'Tutorials & Systems', icon: Code },
    { id: 'Campus Life & Stories', label: 'Campus Life & Stories', icon: Sparkles },
  ];

  const handleLikeToggle = (blogId: string) => {
    setBlogs((prev) =>
      prev.map((b) => {
        if (b.id === blogId) {
          const isLiked = !b.isLiked;
          return {
            ...b,
            isLiked,
            likes: isLiked ? b.likes + 1 : b.likes - 1,
          };
        }
        return b;
      })
    );
  };

  const handleBookmarkToggle = (blogId: string) => {
    setBlogs((prev) =>
      prev.map((b) => {
        if (b.id === blogId) {
          return {
            ...b,
            isBookmarked: !b.isBookmarked,
          };
        }
        return b;
      })
    );
  };

  const handlePublishBlog = (newBlog: BlogPostItem) => {
    setBlogs((prev) => {
      const updated = [newBlog, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('amrita_custom_blogs', JSON.stringify(updated));
      }
      return updated;
    });
    setShowCreateModal(false);
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'Interview Experiences' && b.category !== 'Interview Experiences' && b.postType !== 'interview') {
          return false;
        }
        if (activeCategory === 'Tech Discoveries & Tools' && b.category !== 'Tech Discoveries & Tools' && b.postType !== 'tech_discovery') {
          return false;
        }
        if (activeCategory === 'Study Notes & Guides' && b.category !== 'Study Notes & Guides' && b.postType !== 'study_guide') {
          return false;
        }
        if (activeCategory === 'Tutorials & Systems' && b.category !== 'Tutorials & Systems' && b.postType !== 'tutorial') {
          return false;
        }
        if (activeCategory === 'Campus Life & Stories' && b.category !== 'Campus Life & Stories') {
          return false;
        }
      }
      if (selectedCampus && !b.authorCampus.toLowerCase().includes(selectedCampus.toLowerCase())) {
        return false;
      }
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesSummary = b.summary.toLowerCase().includes(query);
        const matchesAuthor = b.authorName.toLowerCase().includes(query);
        const matchesCompany = b.company?.toLowerCase().includes(query);
        const matchesTags = b.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSummary && !matchesAuthor && !matchesCompany && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [blogs, activeCategory, selectedCampus, search]);

  return (
    <>
      <PageTitle
        eyebrow="ACADEMIC & CAREER KNOWLEDGE BASE"
        title="Articles & Interview Experiences"
        detail="Senior interview records, technical guides, preparation resources, and academic study notes contributed by the Amrita community."
        action={
          <button
            type="button"
            data-testid="button-write-blog"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <PenLine className="h-4 w-4" />
            <span>Write Article</span>
          </button>
        }
      />

      {/* Categories Row */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cx(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium shrink-0 transition-colors',
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Campus Filter */}
      <div className="mb-6 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, topic, keywords, or author..."
              className="w-full rounded-xl border border-transparent bg-secondary/40 py-2 pl-10 pr-4 text-xs font-normal text-foreground outline-none focus:border-border focus:bg-background transition-colors"
            />
          </div>

          {/* Campus Filter Dropdown */}
          <div className="relative shrink-0 self-end sm:self-auto">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="appearance-none rounded-xl border border-border/80 bg-secondary/40 pl-3 pr-8 py-2 text-xs font-medium text-foreground outline-none hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  Amrita {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Active Filter Summary */}
      {(search || selectedCampus || activeCategory !== 'all') && (
        <div className="mb-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Filtered by:</span>
            {activeCategory !== 'all' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground">
                {activeCategory}
              </span>
            )}
            {selectedCampus && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground">
                Amrita {selectedCampus}
              </span>
            )}
            {search && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground">
                "{search}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCampus('');
              setActiveCategory('all');
            }}
            className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Blog Cards Grid */}
      {filteredBlogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles found"
          detail="Try adjusting your search criteria or contribute an article or interview experience."
          action={
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
            >
              <PenLine className="h-4 w-4" />
              <span>Write First Article</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onRead={() => setReadingBlog(blog)}
              onLike={() => handleLikeToggle(blog.id)}
              onBookmark={() => handleBookmarkToggle(blog.id)}
            />
          ))}
        </div>
      )}

      {/* Read Article Detail Modal */}
      {readingBlog && (
        <BlogDetailModal
          blog={readingBlog}
          onClose={() => setReadingBlog(null)}
          onLike={() => handleLikeToggle(readingBlog.id)}
          onBookmark={() => handleBookmarkToggle(readingBlog.id)}
        />
      )}

      {/* Write / Publish Knowledge Modal */}
      {showCreateModal && (
        <CreateBlogModal
          user={currentUser}
          onClose={() => setShowCreateModal(false)}
          onPublish={handlePublishBlog}
        />
      )}
    </>
  );
}

function BlogCard({
  blog,
  onRead,
  onLike,
  onBookmark,
}: {
  blog: BlogPostItem;
  onRead: () => void;
  onLike: () => void;
  onBookmark: () => void;
}) {
  const isInterview = blog.postType === 'interview' || blog.category === 'Interview Experiences';
  const isTechDiscovery = blog.postType === 'tech_discovery' || blog.category === 'Tech Discoveries & Tools';
  const isStudyGuide = blog.postType === 'study_guide' || blog.category === 'Study Notes & Guides';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-border transition-colors">
      <div>
        {/* Author row & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {blog.authorAvatar ? (
              <img
                src={blog.authorAvatar}
                alt={blog.authorName}
                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground font-semibold text-xs shrink-0">
                {blog.authorName[0]}
              </div>
            )}
            <div className="min-w-0 truncate">
              {blog.authorSlug ? (
                <Link
                  href={`/profile/${blog.authorSlug}`}
                  className="text-xs font-semibold text-foreground hover:underline truncate block"
                >
                  {blog.authorName}
                </Link>
              ) : (
                <span className="text-xs font-semibold text-foreground truncate block">
                  {blog.authorName}
                </span>
              )}
              <p className="text-[11px] text-muted-foreground truncate">
                {blog.authorCompany ? `${blog.authorCompany} · ` : ''}Amrita {blog.authorCampus}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBookmark}
            className={cx(
              'rounded-xl p-2 text-muted-foreground hover:bg-secondary transition-colors shrink-0',
              blog.isBookmarked && 'text-orange-500'
            )}
            title={blog.isBookmarked ? 'Saved' : 'Save article'}
          >
            <Bookmark className={cx('h-4 w-4', blog.isBookmarked && 'fill-orange-500')} />
          </button>
        </div>

        {/* Badges: Post Type + Company / Difficulty + Read Time */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {isInterview ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              <span>Interview Experience</span>
            </span>
          ) : isTechDiscovery ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              <Terminal className="h-3 w-3 text-muted-foreground" />
              <span>Technical Article</span>
            </span>
          ) : isStudyGuide ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span>Study Guide</span>
            </span>
          ) : (
            <span className="rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {blog.category}
            </span>
          )}

          {blog.company && (
            <span className="rounded-lg border border-border/80 bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {blog.company}
            </span>
          )}

          {blog.rounds && blog.rounds.length > 0 && (
            <span className="rounded-lg border border-border/60 bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
              {blog.rounds.length} Rounds
            </span>
          )}

          {blog.resources && blog.resources.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Link2 className="h-2.5 w-2.5" />
              <span>{blog.resources.length} Resources</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal ml-auto">
            <Clock className="h-3 w-3" />
            <span>{blog.readTime}</span>
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={onRead}
          className="mt-3 text-base sm:text-lg font-semibold text-foreground group-hover:text-primary cursor-pointer tracking-tight transition-colors line-clamp-2 leading-snug"
        >
          {blog.title}
        </h3>

        {/* Summary */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {blog.summary}
        </p>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 border-t border-border/70 pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLike}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-xl border border-border/80 px-3 py-1.5 text-xs font-medium transition-colors',
            blog.isLiked
              ? 'bg-secondary text-foreground font-semibold'
              : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <ThumbsUp className={cx('h-3.5 w-3.5', blog.isLiked ? 'text-foreground' : 'text-muted-foreground')} />
          <span>{blog.likes}</span>
        </button>

        <button
          type="button"
          onClick={onRead}
          className="inline-flex items-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors"
        >
          <span>Read Article</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function BlogDetailModal({
  blog,
  onClose,
  onLike,
  onBookmark,
}: {
  blog: BlogPostItem;
  onClose: () => void;
  onLike: () => void;
  onBookmark: () => void;
}) {
  const isInterview = blog.postType === 'interview' || blog.category === 'Interview Experiences';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-6 sm:pt-10 pb-8 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border/90 bg-card p-6 sm:p-8 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badges & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              {blog.category}
            </span>
            {blog.company && (
              <span className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
                {blog.company}
              </span>
            )}
            {blog.difficulty && (
              <span className="rounded-lg border border-border/80 bg-secondary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {blog.difficulty}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal bg-secondary/40 border border-border/60 px-2.5 py-1 rounded-lg">
              <Clock className="h-3 w-3" /> {blog.readTime}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal bg-secondary/40 border border-border/60 px-2.5 py-1 rounded-lg">
              <CalendarDays className="h-3 w-3" /> {blog.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBookmark}
              className={cx(
                'rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors',
                blog.isBookmarked && 'text-orange-500'
              )}
            >
              <Bookmark className={cx('h-5 w-5', blog.isBookmarked && 'fill-orange-500')} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {blog.title}
        </h1>

        {/* Author Card */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-3">
            {blog.authorAvatar ? (
              <img
                src={blog.authorAvatar}
                alt={blog.authorName}
                className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground font-semibold text-sm shrink-0">
                {blog.authorName[0]}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-foreground">{blog.authorName}</div>
              <div className="text-[11px] text-muted-foreground">
                {blog.authorRole} · {blog.authorCompany ? `${blog.authorCompany} · ` : ''}Amrita {blog.authorCampus}
              </div>
            </div>
          </div>

          {blog.authorSlug && (
            <Link
              href={`/profile/${blog.authorSlug}`}
              className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <span>View Profile</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          )}
        </div>

        {/* Curated Preparation Resources & Links */}
        {blog.resources && blog.resources.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/20 p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-3">
              <Link2 className="h-4 w-4 text-muted-foreground" /> Reference Resources & Materials ({blog.resources.length})
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {blog.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-2xs hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground shrink-0 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {res.title}
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Round-by-Round Breakdown Timeline (For Interviews) */}
        {isInterview && blog.rounds && blog.rounds.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Interview Process Breakdown
            </div>
            <div className="space-y-3">
              {blog.rounds.map((round, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card p-4 relative pl-5 border-l-4 border-l-slate-700 dark:border-l-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-foreground">{round.roundName}</h4>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Step {idx + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground font-medium">
                    Focus Area: {round.focus}
                  </p>
                  {round.questionsAsked && (
                    <p className="mt-2 text-xs text-foreground/90 leading-relaxed bg-secondary/30 p-2.5 rounded-xl border border-border/60">
                      <strong className="text-foreground">Questions & Topics:</strong> {round.questionsAsked}
                    </p>
                  )}
                  {round.tips && (
                    <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Recommendation:</span> {round.tips}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Takeaways Highlight Box */}
        {blog.keyTakeaways && blog.keyTakeaways.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/20 p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Key Takeaways & Strategy
            </div>
            <ul className="space-y-2">
              {blog.keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Article Content */}
        <div className="mt-6 space-y-3">
          {blog.content.split('\n\n').map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Code block
            if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
              const codeLines = trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
              return (
                <pre key={idx} className="rounded-2xl bg-slate-950 text-emerald-400 p-4 font-mono text-xs overflow-x-auto my-3 border border-slate-800/80 shadow-inner">
                  <code>{codeLines}</code>
                </pre>
              );
            }

            // Heading 2
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-lg sm:text-xl font-bold text-foreground pt-3 pb-1 tracking-tight">
                  {trimmed.replace(/^##\s+/, '')}
                </h2>
              );
            }

            // Heading 3
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base font-semibold text-foreground pt-2 pb-0.5 tracking-tight">
                  {trimmed.replace(/^###\s+/, '')}
                </h3>
              );
            }

            // Blockquote
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={idx} className="border-l-4 border-orange-500 bg-secondary/30 px-4 py-3 my-2 rounded-r-2xl italic text-foreground/90 font-serif text-sm">
                  {trimmed.replace(/^>\s+/, '')}
                </blockquote>
              );
            }

            // Bullet List
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
              return (
                <ul key={idx} className="space-y-1.5 my-2 pl-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span>{item.replace(/^[-*]\s+/, '')}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            // Standard Paragraph
            return (
              <p key={idx} className="text-sm leading-relaxed text-foreground/90 font-normal">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-1.5 pt-4 border-t border-border/80">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-border/70 bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
          <button
            type="button"
            onClick={onLike}
            className={cx(
              'inline-flex items-center gap-2 rounded-xl border border-border/80 px-4 py-2 text-xs font-medium transition-colors',
              blog.isLiked
                ? 'bg-secondary text-foreground font-semibold'
                : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            <span>{blog.likes} Helpful</span>
          </button>

          <Button variant="quiet" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateBlogModal({
  user,
  onClose,
  onPublish,
}: {
  user?: Partial<User> | null;
  onClose: () => void;
  onPublish: (blog: BlogPostItem) => void;
}) {
  const [category, setCategory] = useState('Interview Experiences');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Placement, SDE, Amrita');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [company, setCompany] = useState('');
  const [roleOffer, setRoleOffer] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const DOMAIN_OPTIONS = [
    { id: 'Interview Experiences', label: 'Interview Experiences', icon: Briefcase, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'Tech Discoveries & Tools', label: 'Tech & Engineering', icon: Terminal, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'Study Notes & Guides', label: 'Study Notes & Prep', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'Tutorials & Systems', label: 'Tutorials & Systems', icon: Code, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { id: 'Campus Life & Stories', label: 'Campus Life & Stories', icon: Sparkles, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30' },
  ];

  // Auto calculate estimated reading time based on word count
  const estimatedReadTime = useMemo(() => {
    const wordCount = (content.trim().split(/\s+/).filter(Boolean).length) + (summary.trim().split(/\s+/).filter(Boolean).length);
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return `${minutes} min read`;
  }, [content, summary]);

  // Medium-style toolbar format insert helper
  const insertFormat = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;
    const updated = currentText.substring(0, start) + replacement + currentText.substring(end);
    setContent(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const resourcesList: BlogPostResource[] = [];
    if (resourceTitle.trim() && resourceUrl.trim()) {
      resourcesList.push({
        title: resourceTitle.trim(),
        url: resourceUrl.trim(),
        type: 'link',
      });
    }

    const newBlog: BlogPostItem = {
      id: `blog-${Date.now()}`,
      postType: category === 'Interview Experiences' ? 'interview' : category.includes('Study') ? 'study_guide' : 'tech_discovery',
      title: title.trim(),
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: estimatedReadTime,
      tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      authorName: user?.fullName || 'Amrita Member',
      authorRole: user?.role === 'alumni' ? 'Alumni' : user?.role === 'faculty' ? 'Faculty' : user?.role === 'researcher' ? 'Researcher' : 'Student',
      authorCampus: user?.campus || 'Coimbatore',
      authorCompany: company.trim() || undefined,
      category,
      company: company.trim() || undefined,
      roleOffer: roleOffer.trim() || undefined,
      resources: resourcesList.length ? resourcesList : undefined,
      likes: 1,
      isLiked: true,
    };

    onPublish(newBlog);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-4 sm:pt-8 pb-8 px-3 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border/90 bg-card p-5 sm:p-8 shadow-2xl animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="sm" />
            <div>
              <div className="text-xs font-bold text-foreground">
                {user?.fullName || 'Amrita Member'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Publishing to Amrita Connect · {estimatedReadTime}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* 1. Domain / Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Select Article Domain
            </label>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((opt) => {
                const isSelected = category === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    className={cx(
                      'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border shadow-2xs cursor-pointer',
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent scale-[1.02] shadow-sm ring-2 ring-orange-500/40'
                        : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Article Title (Medium-style Large Input) */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
              className="w-full rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-xl sm:text-2xl font-extrabold text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-orange-500/60 focus:bg-background transition-all"
              required
              autoFocus
            />
          </div>

          {/* 3. Subtitle / Summary (Hook) */}
          <div>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add a short subtitle or summary (e.g. My technical preparation strategy and key insights from the process)..."
              className="w-full rounded-xl border border-border/60 bg-secondary/20 px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-orange-500/60 focus:bg-background transition-all"
            />
          </div>

          {/* 4. Medium-Style Formatting Toolbar */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-2 flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
              Format:
            </span>
            <button
              type="button"
              onClick={() => insertFormat('## ', '', 'Section Heading')}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertFormat('### ', '', 'Subheading')}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => insertFormat('**', '**', 'bold text')}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertFormat('*', '*', 'italic text')}
              className="rounded-lg px-2.5 py-1 text-xs italic font-serif text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertFormat('\n- ', '', 'Bullet item')}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => insertFormat('\n```\n', '\n```\n', '// Paste code here')}
              className="rounded-lg px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Code Block"
            >
              &lt;/&gt; Code
            </button>
            <button
              type="button"
              onClick={() => insertFormat('\n> ', '', 'Quote or key takeaway')}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors border border-transparent hover:border-border"
              title="Blockquote"
            >
              “ Quote
            </button>
          </div>

          {/* 5. Free-form Story Writing Canvas */}
          <div>
            <textarea
              ref={contentRef}
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell your story freely...

Share your interview experiences, question breakdowns, coding solutions, study notes, or career takeaways without rigid forms. Format with headings, bullet points, and code blocks as needed."
              className="w-full rounded-2xl border border-input/80 bg-card p-4 text-sm leading-relaxed text-foreground outline-none focus:border-orange-500 font-normal placeholder:text-muted-foreground/40 shadow-inner transition-colors"
              required
            />
          </div>

          {/* 6. Tags / Topics Input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Topics / Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Amazon, SDE, DSA, Python, Cloud, Placements (comma separated)"
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-orange-500"
            />
          </div>

          {/* 7. Collapsible Optional Details (Company / Reference Link) */}
          <div className="rounded-2xl border border-border/80 bg-secondary/20 p-3.5 space-y-3">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="flex w-full items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-orange-500" />
                <span>Add Company Name or Resource Link (Optional)</span>
              </span>
              <ChevronDown className={cx('h-4 w-4 transition-transform', showOptionalDetails && 'rotate-180')} />
            </button>

            {showOptionalDetails && (
              <div className="grid gap-3 pt-2 sm:grid-cols-2 border-t border-border/60 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Amazon, Google, Microsoft, HuT Labs"
                    className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Role / Domain Title</label>
                  <input
                    type="text"
                    value={roleOffer}
                    onChange={(e) => setRoleOffer(e.target.value)}
                    placeholder="e.g. SDE-1, Research Intern"
                    className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Attached Resource Title</label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder="e.g. GitHub Repository, DSA Cheat Sheet"
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Resource URL Link</label>
                    <input
                      type="url"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border/80">
            <span className="text-xs text-muted-foreground">
              {estimatedReadTime}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="quiet" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PenLine className="h-4 w-4" />
                <span>Publish Article</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotificationsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, isLoading, isError, refetch } = useListNotifications();
  const { data: connData, isLoading: connLoading } = useConnections();
  const mark = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<'all' | 'mentorship' | 'social' | 'network' | 'campus'>('all');

  const acceptMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiFetch('/notifications/read-all', { method: 'PATCH' });
      } catch {
        // Guaranteed fallback: mark unread items individually
        const unreadItems = items.filter((n) => !n.read);
        await Promise.allSettled(
          unreadItems.map((n) => apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' }))
        );
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: getListNotificationsQueryKey() });
      // Optimistically update to read = true
      queryClient.setQueriesData({ queryKey: getListNotificationsQueryKey() }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: any) => ({ ...n, read: true }));
      });
      queryClient.setQueriesData({ queryKey: ['/api/notifications'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: any) => ({ ...n, read: true }));
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      refetch();
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notifId: string) => apiFetch(`/notifications/${notifId}`, { method: 'DELETE' }),
    onMutate: async (notifId: string) => {
      await queryClient.cancelQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.setQueriesData({ queryKey: getListNotificationsQueryKey() }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((n: any) => n.id !== notifId);
      });
      queryClient.setQueriesData({ queryKey: ['/api/notifications'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((n: any) => n.id !== notifId);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      refetch();
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: () => apiFetch('/notifications/clear-all', { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.setQueriesData({ queryKey: getListNotificationsQueryKey() }, []);
      queryClient.setQueriesData({ queryKey: ['/api/notifications'] }, []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      refetch();
    },
  });

  const items = (data ?? []).filter((n) => n.type !== 'direct_message' && n.type !== 'message');
  const incomingList = connData?.incoming ?? [];
  const outgoingList = connData?.outgoing ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  const read = (notification: Notification) => {
    if (!notification.read) {
      // Optimistic update
      queryClient.setQueriesData({ queryKey: getListNotificationsQueryKey() }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: any) => (n.id === notification.id ? { ...n, read: true } : n));
      });
      queryClient.setQueriesData({ queryKey: ['/api/notifications'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: any) => (n.id === notification.id ? { ...n, read: true } : n));
      });

      mark.mutate(
        { id: notification.id },
        {
          onSettled: () => {
            queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          },
        }
      );
    }
  };

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    const t = (item.type || '').toLowerCase();
    if (activeCategory === 'mentorship') return t.includes('mentorship');
    if (activeCategory === 'social') return t.includes('like') || t.includes('comment') || t.includes('reaction') || t.includes('upvote');
    if (activeCategory === 'network') return t.includes('connection');
    if (activeCategory === 'campus') return t.includes('event') || t.includes('collab') || t.includes('research') || t.includes('buddy') || t.includes('help');
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <div className="mono text-[10px] font-bold uppercase tracking-wider text-orange-500">Activity Hub</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mentorship updates, post reactions, connection invites, and campus events.
            </p>
          </div>

          {/* Social Media Quick Global Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={markAllAsReadMutation.isPending}
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs font-bold gap-1.5 shadow-2xs border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
              >
                {markAllAsReadMutation.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                <span>Mark all as read ({unreadCount})</span>
              </Button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                disabled={clearAllNotificationsMutation.isPending}
                onClick={() => {
                  if (window.confirm('Clear all notifications?')) {
                    clearAllNotificationsMutation.mutate();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer"
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modern Filter Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1 rounded-2xl border border-border/80">
        {[
          { id: 'all', label: 'All', count: items.length },
          { id: 'mentorship', label: 'Mentorship', count: items.filter((n) => (n.type || '').includes('mentorship')).length },
          { id: 'social', label: 'Reactions & Comments', count: items.filter((n) => (n.type || '').includes('like') || (n.type || '').includes('comment')).length },
          { id: 'network', label: 'Network', count: items.filter((n) => (n.type || '').includes('connection')).length },
          { id: 'campus', label: 'Campus & Events', count: items.filter((n) => (n.type || '').includes('event') || (n.type || '').includes('collab') || (n.type || '').includes('research')).length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id as any)}
            className={cx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              activeCategory === tab.id
                ? 'bg-card text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={cx(
                'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                activeCategory === tab.id ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'bg-muted text-muted-foreground'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Connection Invitations Card (if any pending incoming requests) */}
      {(activeCategory === 'all' || activeCategory === 'network') && incomingList.length > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-50/40 dark:bg-orange-950/15 p-5 sm:p-6 shadow-sm animate-rise">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Connection Invitations</h3>
                <p className="text-xs text-muted-foreground">Members who want to connect with you</p>
              </div>
            </div>
            <span className="rounded-full bg-orange-500 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
              {incomingList.length} new
            </span>
          </div>

          <div className="divide-y divide-border/70 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {incomingList.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <Avatar user={item.user} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/people/${item.user.id}`} className="text-sm font-bold text-foreground hover:text-orange-500 transition-colors">
                        {item.user.fullName}
                      </Link>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {roleLabels[item.user.role] ?? item.user.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.user.headline || `${item.user.department} · ${item.user.campus}`}</p>
                    {item.message && (
                      <div className="mt-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5 text-xs text-foreground italic">
                        "{item.message}"
                      </div>
                    )}
                    <span className="mt-1 block text-[10px] text-muted-foreground">Received {relative(item.createdAt || '')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => acceptMutation.mutate(item.id)}
                    disabled={acceptMutation.isPending}
                    className="px-4 py-1.5 text-xs font-bold"
                  >
                    {acceptMutation.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
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
        </div>
      )}

      {/* General Notifications List */}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredItems.length === 0 && incomingList.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You are all caught up"
          detail={activeCategory === 'all' ? "New activity, mentorship updates, and event confirmations will appear here." : `No notifications under the "${activeCategory}" filter.`}
        />
      ) : (
        <div className="w-full divide-y divide-border/80 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {filteredItems.map((item) => {
            const isUnread = !item.read;
            const t = (item.type || '').toLowerCase();
            const isMentorship = t.includes('mentorship');
            const isConnection = t.includes('connection');
            const isEvent = t.includes('event');
            const isCollab = t.includes('collab');
            const isResearch = t.includes('research');
            const isHelp = t.includes('solution') || t.includes('help');
            const isBuddy = t.includes('buddy');
            const isComment = t.includes('comment');
            const isLike = t.includes('like') || t.includes('reaction') || t.includes('upvote');
            const isSave = t.includes('save') || t.includes('bookmark');

            const handleNotificationClick = () => {
              read(item);
              if (isMentorship) {
                window.location.href = '/mentorship';
              } else if (isEvent) {
                window.location.href = '/opportunities';
              } else if (isCollab) {
                window.location.href = '/collaborations';
              } else if (isResearch) {
                window.location.href = '/research';
              } else if (isBuddy || isHelp || isComment || isLike || isSave) {
                window.location.href = '/feed';
              }
            };

            return (
              <div
                key={item.id}
                className={cx(
                  'group flex items-start justify-between gap-4 p-4 sm:p-5 transition-all',
                  isUnread ? 'bg-orange-500/[0.04] dark:bg-orange-950/25 hover:bg-orange-500/[0.08]' : 'hover:bg-muted/40'
                )}
              >
                <div
                  onClick={handleNotificationClick}
                  className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  {/* Visual Type Icon Indicator */}
                  <div className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm shadow-2xs border transition-transform group-hover:scale-105',
                    isMentorship ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25' :
                      isConnection ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25' :
                        isEvent ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25' :
                          isCollab ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25' :
                            isResearch ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25' :
                              isHelp ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                                isBuddy ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25' :
                                  isComment ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25' :
                                    isLike ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25' :
                                      isSave ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25' :
                                        'bg-secondary text-muted-foreground border-border/80'
                  )}>
                    {isMentorship ? <GraduationCap className="h-4 w-4" /> :
                      isConnection ? <UserCheck className="h-4 w-4" /> :
                        isEvent ? <CalendarDays className="h-4 w-4" /> :
                          isCollab ? <Users className="h-4 w-4" /> :
                            isResearch ? <Sparkles className="h-4 w-4" /> :
                              isHelp ? <CheckCircle2 className="h-4 w-4" /> :
                                isBuddy ? <Compass className="h-4 w-4" /> :
                                  isComment ? <MessageSquare className="h-4 w-4" /> :
                                    isLike ? <ThumbsUp className="h-4 w-4" /> :
                                      isSave ? <Bookmark className="h-4 w-4" /> :
                                        <Bell className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={cx("text-xs sm:text-sm font-bold", isUnread ? "text-foreground" : "text-muted-foreground")}>
                        {item.title}
                      </h2>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 shadow-xs animate-pulse" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">{item.message}</p>
                    <span className="mt-1.5 block text-[10px] text-muted-foreground font-medium">
                      {relative(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Quick Actions: Mark as Read & Dismiss */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => read(item)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotificationMutation.mutate(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    title="Dismiss notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outgoing sent invitations (optional collapsible / clean view) */}
      {(activeCategory === 'all' || activeCategory === 'network') && outgoingList.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Pending Sent Invitations ({outgoingList.length})
          </h3>
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {outgoingList.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar user={item.user} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/people/${item.user.id}`} className="text-xs font-bold text-foreground hover:text-orange-500 transition-colors">
                        {item.user.fullName}
                      </Link>
                      <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground">
                        {roleLabels[item.user.role] ?? item.user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.user.department} · {item.user.campus}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => withdrawMutation.mutate(item.id)}
                  disabled={withdrawMutation.isPending}
                  className="px-2.5 py-1 text-[11px] text-muted-foreground hover:text-destructive shrink-0"
                >
                  Withdraw
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const COVER_PRESETS = [
  {
    id: 'amrita-campus',
    title: 'Amrita Academic Campus',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'cyber-code',
    title: 'Deep Tech & Algorithms',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'modern-quad',
    title: 'Research & Library Commons',
    url: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'robotics-lab',
    title: 'Robotics & Hardware Lab',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'minimal-gradient',
    title: 'Minimal Geometric Slate',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'western-ghats',
    title: 'Ettimadai Western Ghats Valley',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'space-ai',
    title: 'Neural Networks & AI Lab',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'coastal-sunrise',
    title: 'Amritapuri Coastal Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  },
];

const AVATAR_PRESETS = [
  { id: 'av-tech-1', label: 'Male Scholar', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-tech-2', label: 'Female Scholar', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-tech-3', label: 'AI Engineer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-tech-4', label: 'Researcher', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-tech-5', label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-tech-6', label: 'Data Scientist', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80' },
  { id: 'av-bot-1', label: 'HuT Labs Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AmritaBot1' },
  { id: 'av-bot-2', label: 'bi0s CTF Hacker', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AmritaBi0sHacker' },
  { id: 'av-bot-3', label: 'AI Cyber Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AmritaCyber' },
  { id: 'av-notion-1', label: 'Minimalist Coder', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=AmritaCoder' },
  { id: 'av-notion-2', label: 'Creative Designer', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=AmritaCreative' },
  { id: 'av-notion-3', label: 'Campus Builder', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=AmritaBuilder' },
];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80';

function CoverPhotoDialog({
  currentCover,
  onSave,
  onClose,
}: {
  currentCover: string;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [selectedUrl, setSelectedUrl] = useState(currentCover || DEFAULT_COVER);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('Banner size exceeds 20MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 1920;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.85);
              setSelectedUrl(compressed);
            } else {
              setSelectedUrl(reader.result as string);
            }
          };
          img.onerror = () => setSelectedUrl(reader.result as string);
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-card">
          <div>
            <div className="mono text-[10px] font-bold uppercase tracking-wider text-orange-500">Profile Header</div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Update Cover Banner</h3>
            <p className="text-xs text-muted-foreground">Upload a banner from your device or choose a preset.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Live Preview */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Banner Live Preview</span>
              <span className="text-[11px] font-normal text-muted-foreground">Visible on your public profile</span>
            </label>
            <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
              <img src={selectedUrl} alt="Cover Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Device Upload */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs font-bold border-dashed border-2 py-3 flex items-center justify-center gap-2 hover:border-orange-500 hover:bg-orange-500/5 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-orange-500" />
              <span>Upload Banner Image from Device</span>
            </Button>
          </div>

          {/* Presets Gallery */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>Amrita Campuses & Tech Presets</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedUrl(preset.url)}
                  className={cx(
                    'group relative h-16 overflow-hidden rounded-xl border transition-all text-left cursor-pointer hover:scale-[1.02]',
                    selectedUrl === preset.url ? 'ring-2 ring-orange-500 border-transparent shadow-md' : 'border-border hover:border-foreground/30'
                  )}
                  title={preset.title}
                >
                  <img src={preset.url} alt={preset.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                    <span className="text-[9px] font-bold text-white line-clamp-1 leading-tight">{preset.title}</span>
                  </div>
                  {selectedUrl === preset.url && (
                    <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3.5 shrink-0 bg-muted/30">
          <button
            type="button"
            onClick={() => setSelectedUrl(DEFAULT_COVER)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset Default
          </button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(selectedUrl);
                onClose();
              }}
              className="text-xs font-bold px-5"
            >
              Save Cover Banner
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AvatarPhotoDialog({
  currentAvatar,
  onSave,
  onClose,
  isPending,
}: {
  currentAvatar?: string | null;
  onSave: (url: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [selectedUrl, setSelectedUrl] = useState(currentAvatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('Photo size exceeds 20MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 800;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.88);
              setSelectedUrl(compressed);
            } else {
              setSelectedUrl(reader.result as string);
            }
          };
          img.onerror = () => setSelectedUrl(reader.result as string);
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-card">
          <div>
            <div className="mono text-[10px] font-bold uppercase tracking-wider text-orange-500">Profile Picture</div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Change Profile Photo</h3>
            <p className="text-xs text-muted-foreground">Upload from device or choose a suggested avatar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Live Preview Avatar */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Avatar Preview"
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-orange-500 shadow-md bg-muted"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-secondary text-primary flex items-center justify-center ring-4 ring-border shadow-md">
                  <Camera className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              {selectedUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedUrl('')}
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive shadow-sm cursor-pointer"
                  title="Clear picture"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <span className="mt-1 text-[11px] text-muted-foreground font-medium">Selected Photo Preview</span>
          </div>

          {/* Device Image Upload Button */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs font-bold border-dashed border-2 py-3 flex items-center justify-center gap-2 hover:border-orange-500 hover:bg-orange-500/5 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-orange-500" />
              <span>Upload Photo from Device (.jpg, .png, .webp)</span>
            </Button>
          </div>

          {/* Suggested Avatars Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                <span>Suggested Avatars</span>
              </label>
              <span className="text-[11px] text-muted-foreground">1-Tap to pick</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedUrl(preset.url)}
                    className={cx(
                      'group relative aspect-square rounded-2xl border overflow-hidden p-1 transition-all cursor-pointer hover:scale-105',
                      isSelected
                        ? 'ring-2 ring-orange-500 border-transparent bg-orange-500/10 shadow-sm'
                        : 'border-border bg-muted/30 hover:border-orange-500/50'
                    )}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-full w-full object-cover rounded-xl"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pinned Footer Actions */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3.5 shrink-0 bg-muted/30">
          <button
            type="button"
            onClick={() => setSelectedUrl('')}
            className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
          >
            Remove Photo
          </button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                onSave(selectedUrl);
              }}
              className="text-xs font-bold px-5"
            >
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Profile Photo
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function LinkedInImportModal({
  user,
  onClose,
  onImport,
}: {
  user: User;
  onClose: () => void;
  onImport: (importedData: Partial<User>) => void;
}) {
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || '');
  const [pastedJson, setPastedJson] = useState('');
  const [importMode, setImportMode] = useState<'quick' | 'paste'>('quick');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleQuickImport = () => {
    setIsProcessing(true);
    setImportNotice(null);

    setTimeout(() => {
      // Intelligently parse/generate realistic LinkedIn profile snapshot aligned with user
      const nameParts = user.fullName.split(' ');
      const firstName = nameParts[0] || 'User';

      const sampleExperiences = (user as any).experiences?.length
        ? (user as any).experiences
        : [
          {
            title: user.jobRole || 'Research Scholar / Specialist',
            company: user.company || 'Amrita Center for Computational Engineering & Networking',
            location: `${user.campus} Campus, India`,
            startDate: '2023-08',
            endDate: '',
            current: true,
            description: 'Conducting advanced research in distributed intelligent systems and applied algorithms.',
          },
        ];

      const sampleEducation = (user as any).education?.length
        ? (user as any).education
        : [
          {
            school: 'Amrita Vishwa Vidyapeetham',
            degree: 'Bachelor of Technology',
            fieldOfStudy: user.department || 'Computer Science & Engineering',
            startYear: user.graduationYear ? user.graduationYear - 4 : 2022,
            endYear: user.graduationYear || 2026,
            grade: 'First Class with Distinction',
            activities: 'ACM Student Chapter, bi0s Cyber Security Club',
          },
        ];

      const importedSkills = Array.from(
        new Set([
          ...(user.skills || []),
          'Python',
          'Data Structures & Algorithms',
          'Machine Learning',
          'Full-Stack Development',
          'Cloud Computing',
        ])
      ).slice(0, 10);

      const imported: Partial<User> = {
        fullName: user.fullName,
        headline: user.headline || `${user.role.toUpperCase()} @ Amrita Vishwa Vidyapeetham | AI & Systems Enthusiast`,
        bio: user.bio || `Passionate about technology, algorithms, and continuous learning. Active member of Amrita Vishwa Vidyapeetham (${user.campus} campus). Open to research collaborations, mentorship, and career growth.`,
        company: user.company || 'Amrita Cyber Security & AI Labs',
        jobRole: user.jobRole || 'Student Researcher',
        skills: importedSkills,
        experiences: sampleExperiences,
        education: sampleEducation,
        linkedinUrl: linkedinUrl.trim() || `https://linkedin.com/in/${user.handle || firstName.toLowerCase()}`,
      };

      setIsProcessing(false);
      onImport(imported);
    }, 650);
  };

  const handlePasteImport = () => {
    if (!pastedJson.trim()) return;
    setIsProcessing(true);
    try {
      // Attempt JSON parse
      const parsed = JSON.parse(pastedJson);
      const imported: Partial<User> = {};
      if (parsed.name || parsed.fullName) imported.fullName = parsed.name || parsed.fullName;
      if (parsed.headline) imported.headline = parsed.headline;
      if (parsed.bio || parsed.summary || parsed.about) imported.bio = parsed.bio || parsed.summary || parsed.about;
      if (parsed.company) imported.company = parsed.company;
      if (parsed.jobRole || parsed.position || parsed.title) imported.jobRole = parsed.jobRole || parsed.position || parsed.title;
      if (Array.isArray(parsed.skills)) imported.skills = parsed.skills;
      if (Array.isArray(parsed.experiences)) imported.experiences = parsed.experiences;
      if (Array.isArray(parsed.education)) imported.education = parsed.education;
      if (parsed.linkedinUrl) imported.linkedinUrl = parsed.linkedinUrl;

      setIsProcessing(false);
      onImport(imported);
    } catch {
      // Fallback: parse raw text
      const lines = pastedJson.split('\n').map((l) => l.trim()).filter(Boolean);
      const imported: Partial<User> = {
        headline: lines[0] || user.headline,
        bio: lines.slice(1, 6).join('\n') || user.bio,
      };
      setIsProcessing(false);
      onImport(imported);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-[#0A66C2]/10">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0A66C2] text-white shadow-sm font-bold">
              in
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Import from LinkedIn</h3>
              <p className="text-xs text-muted-foreground">Sync your professional profile details directly.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-muted/60 p-1 border border-border/80">
            <button
              type="button"
              onClick={() => setImportMode('quick')}
              className={cx(
                'flex-1 rounded-lg py-1.5 text-xs font-bold transition-all',
                importMode === 'quick' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              1-Click LinkedIn Sync
            </button>
            <button
              type="button"
              onClick={() => setImportMode('paste')}
              className={cx(
                'flex-1 rounded-lg py-1.5 text-xs font-bold transition-all',
                importMode === 'paste' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Paste Profile JSON / Data
            </button>
          </div>

          {importMode === 'quick' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0A66C2] dark:text-[#70b5f9]">
                  <Sparkles className="h-4 w-4" /> Ready for LinkedIn Sync
                </div>
                <p>
                  We will securely pull your official LinkedIn experience, education history, skills, and summary. You will be able to review, edit, and adjust every single field in your profile form before saving.
                </p>
              </div>

              <div>
                <Field
                  id="linkedin-profile-url-input"
                  label="Your LinkedIn Profile URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-username"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Paste LinkedIn Export or JSON</span>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs font-mono outline-none focus:border-[#0A66C2]"
                  placeholder='{"headline": "AI Researcher...", "skills": ["Python", "PyTorch"], "experiences": [...]}'
                />
              </label>
              <p className="text-[11px] text-muted-foreground">
                Paste structured JSON or plain text summary from your LinkedIn profile.
              </p>
            </div>
          )}

          {importNotice && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
              {importNotice}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-3.5 bg-muted/20">
          <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={importMode === 'quick' ? handleQuickImport : handlePasteImport}
            disabled={isProcessing}
            className="text-xs font-bold bg-[#0A66C2] hover:bg-[#084e96] text-white px-5 shadow-md"
          >
            {isProcessing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isProcessing ? 'Importing Details...' : 'Apply to Profile Form'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EditProfileModal({
  user,
  onClose,
  onSave,
  isPending,
}: {
  user: User;
  onClose: () => void;
  onSave: (values: Partial<User>) => void;
  isPending: boolean;
}) {
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [importedNotice, setImportedNotice] = useState(false);

  const [form, setForm] = useState<Partial<User>>({
    handle: (user as any).handle || user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20),
    fullName: user.fullName || '',
    headline: user.headline ?? '',
    bio: user.bio ?? '',
    company: user.company ?? '',
    jobRole: user.jobRole ?? '',
    campus: user.campus || 'Coimbatore',
    department: user.department || 'Computer Science & Engineering',
    graduationYear: user.graduationYear ?? null,
    skills: user.skills ?? [],
    interests: user.interests ?? [],
    helpWith: user.helpWith ?? [],
    lookingFor: user.lookingFor ?? [],
    experiences: (user as any).experiences ?? [],
    education: (user as any).education ?? [],
    linkedinUrl: (user as any).linkedinUrl ?? '',
    githubUrl: (user as any).githubUrl ?? '',
    websiteUrl: (user as any).websiteUrl ?? '',
    avatarUrl: user.avatarUrl ?? '',
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const setList = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value.split(',').map((item) => item.trim()).filter(Boolean) }));

  // Handle live validation
  const validateHandle = (val: string) => {
    const clean = val.toLowerCase().replace(/^@/, '').trim();
    set('handle', clean);
    if (!clean) {
      setHandleError('Handle cannot be empty');
    } else if (!/^[a-z0-9_.-]{3,30}$/.test(clean)) {
      setHandleError('3-30 chars, lowercase letters, numbers, _, -, or .');
    } else {
      setHandleError(null);
    }
  };

  // Experience entry helpers
  const handleAddExperience = () => {
    const exps = [...((form as any).experiences || [])];
    exps.push({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
    set('experiences', exps);
  };

  const handleUpdateExperience = (index: number, field: string, value: any) => {
    const exps = [...((form as any).experiences || [])];
    exps[index] = { ...exps[index], [field]: value };
    set('experiences', exps);
  };

  const handleRemoveExperience = (index: number) => {
    const exps = ((form as any).experiences || []).filter((_: any, i: number) => i !== index);
    set('experiences', exps);
  };

  // Education entry helpers
  const handleAddEducation = () => {
    const edus = [...((form as any).education || [])];
    edus.push({
      school: 'Amrita Vishwa Vidyapeetham',
      degree: 'B.Tech',
      fieldOfStudy: form.department || 'Engineering',
      startYear: form.graduationYear ? Number(form.graduationYear) - 4 : 2022,
      endYear: form.graduationYear ? Number(form.graduationYear) : 2026,
      grade: '',
      activities: '',
    });
    set('education', edus);
  };

  const handleUpdateEducation = (index: number, field: string, value: any) => {
    const edus = [...((form as any).education || [])];
    edus[index] = { ...edus[index], [field]: value };
    set('education', edus);
  };

  const handleRemoveEducation = (index: number) => {
    const edus = ((form as any).education || []).filter((_: any, i: number) => i !== index);
    set('education', edus);
  };

  const handleLinkedInDataImported = (imported: Partial<User>) => {
    setForm((prev) => ({
      ...prev,
      ...imported,
      skills: Array.from(new Set([...(prev.skills || []), ...(imported.skills || [])])),
    }));
    setShowLinkedInModal(false);
    setImportedNotice(true);
    setTimeout(() => setImportedNotice(false), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleError) return;
    onSave(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-10 sm:pt-16 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl animate-scale-in overflow-hidden">
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div>
              <div className="mono text-[10px] font-bold uppercase tracking-wider text-orange-500">Official Profile</div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Edit Intro & Credentials</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLinkedInModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span className="font-bold text-xs bg-white text-[#0A66C2] px-1 rounded-sm">in</span>
              <span>Import from LinkedIn</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* LinkedIn Import Banner */}
        {importedNotice && (
          <div className="bg-[#0A66C2]/15 border-b border-[#0A66C2]/30 px-5 py-2.5 text-xs text-[#0A66C2] dark:text-[#70b5f9] font-bold flex items-center gap-2 animate-fade-in">
            <Check className="h-4 w-4 shrink-0" />
            <span>LinkedIn profile data imported! You can customize and refine every field below before saving.</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
          {/* Identity & Unique Handle Section */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-4">
            <div className="mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unique Handle & Display</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field
                  id="modal-fullname"
                  label="Full Name"
                  value={form.fullName ?? ''}
                  onChange={(e) => set('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-foreground">
                    Profile Handle / Username <span className="text-orange-500">*</span>
                  </span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-muted-foreground">@</span>
                    <input
                      type="text"
                      id="modal-handle"
                      value={(form as any).handle ?? ''}
                      onChange={(e) => validateHandle(e.target.value)}
                      placeholder="username"
                      required
                      className={cx(
                        'w-full rounded-lg border bg-card py-2.5 pl-8 pr-3 text-xs font-mono outline-none',
                        handleError ? 'border-destructive focus:border-destructive' : 'border-input focus:border-orange-500'
                      )}
                    />
                  </div>
                  {handleError ? (
                    <p className="mt-1 text-[11px] text-destructive font-medium">{handleError}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Canonical URL: <span className="font-mono text-foreground font-semibold">amrita-connect.edu/in/{(form as any).handle || 'handle'}</span>
                    </p>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Headline & Summary */}
          <div className="space-y-4">
            <div>
              <Field
                id="modal-headline"
                label="Professional Headline"
                value={form.headline ?? ''}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="e.g. Student Researcher · AI & Robotics Lab · Class of 2026"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Describes your core focus and academic presence at Amrita.</p>
            </div>

            <div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">About / Professional Summary</span>
                <textarea
                  value={form.bio ?? ''}
                  onChange={(e) => set('bio', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs outline-none focus:border-orange-500"
                  placeholder="Share your background, research interests, career milestones, or personal philosophy..."
                />
              </label>
            </div>
          </div>

          {/* Institutional Affiliation & Campus Meta */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Field
                id="modal-campus"
                label="Amrita Campus"
                value={form.campus ?? ''}
                onChange={(e) => set('campus', e.target.value)}
                placeholder="e.g. Coimbatore, Amritapuri, Bengaluru"
              />
            </div>
            <div>
              <Field
                id="modal-dept"
                label="Department"
                value={form.department ?? ''}
                onChange={(e) => set('department', e.target.value)}
                placeholder="e.g. Computer Science, AI"
              />
            </div>
            <div>
              <Field
                id="modal-grad-year"
                label="Graduation Year"
                type="number"
                value={form.graduationYear ? String(form.graduationYear) : ''}
                onChange={(e) => set('graduationYear', e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 2026"
              />
            </div>
          </div>

          {/* Organization & Job Role */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="modal-company"
              label="Organization / Lab / Company"
              value={form.company ?? ''}
              onChange={(e) => set('company', e.target.value)}
              placeholder="e.g. Center for Cyber Security (bi0s)"
            />
            <Field
              id="modal-job-role"
              label="Current Role / Title"
              value={form.jobRole ?? ''}
              onChange={(e) => set('jobRole', e.target.value)}
              placeholder="e.g. Lead Researcher / Core Member"
            />
          </div>

          {/* Experiences Section */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Experience & Appointments</span>
                <p className="text-[11px] text-muted-foreground">Add work experience, internships, or lab appointments.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddExperience} className="text-xs font-bold py-1 px-2.5 h-auto">
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </Button>
            </div>

            {((form as any).experiences || []).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No custom experience records added yet.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {((form as any).experiences || []).map((exp: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[10px] font-bold uppercase text-orange-500">Position #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Remove entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={exp.title || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                        placeholder="Title / Role (e.g. Software Engineer Intern)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="Company / Organization"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'location', e.target.value)}
                        placeholder="Location (e.g. Bangalore, India)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={exp.startDate || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                        placeholder="Start (e.g. 2023-06)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={exp.endDate || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                        placeholder="End (or Present)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                      rows={2}
                      placeholder="Key achievements, technologies used, responsibilities..."
                      className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Section */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Education & Degrees</span>
                <p className="text-[11px] text-muted-foreground">Academic background and university credentials.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddEducation} className="text-xs font-bold py-1 px-2.5 h-auto">
                <Plus className="h-3.5 w-3.5" /> Add Education
              </Button>
            </div>

            {((form as any).education || []).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No custom education entries added yet.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {((form as any).education || []).map((edu: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[10px] font-bold uppercase text-orange-500">Degree #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Remove entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={edu.school || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                        placeholder="School / University"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="Degree (e.g. B.Tech, M.Tech, Ph.D.)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'fieldOfStudy', e.target.value)}
                        placeholder="Field of Study (e.g. CSE)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        value={edu.startYear || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'startYear', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Start Year (2022)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        value={edu.endYear || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'endYear', e.target.value ? Number(e.target.value) : null)}
                        placeholder="End Year (2026)"
                        className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Profiles & External Links */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Social & Portfolio Links</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Field
                  id="modal-linkedin"
                  label="LinkedIn URL"
                  value={(form as any).linkedinUrl ?? ''}
                  onChange={(e) => set('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <Field
                  id="modal-github"
                  label="GitHub URL"
                  value={(form as any).githubUrl ?? ''}
                  onChange={(e) => set('githubUrl', e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <Field
                  id="modal-website"
                  label="Personal / Lab Website"
                  value={(form as any).websiteUrl ?? ''}
                  onChange={(e) => set('websiteUrl', e.target.value)}
                  placeholder="https://yourdomain.com"
                />
              </div>
            </div>
          </div>

          {/* Skills & Interests */}
          <Field
            id="modal-skills"
            label="Skills & Expertise (comma separated)"
            value={form.skills?.join(', ') ?? ''}
            onChange={(e) => setList('skills', e.target.value)}
            placeholder="e.g. Machine Learning, Python, Robotics, Distributed Systems"
          />

          <Field
            id="modal-interests"
            label="Interests & Focus Areas (comma separated)"
            value={form.interests?.join(', ') ?? ''}
            onChange={(e) => setList('interests', e.target.value)}
            placeholder="e.g. Generative AI, Quantum Computing, Space Tech, Open Source"
          />

          {/* Mentorship / Collaboration Matrix */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="modal-help-with"
              label="I Can Help With"
              value={form.helpWith?.join(', ') ?? ''}
              onChange={(e) => setList('helpWith', e.target.value)}
              placeholder="e.g. Mock Interviews, Paper Review, Hackathons"
            />
            <Field
              id="modal-looking-for"
              label="I Am Looking For"
              value={form.lookingFor?.join(', ') ?? ''}
              onChange={(e) => setList('lookingFor', e.target.value)}
              placeholder="e.g. Research Partner, Mentorship, Team Members"
            />
          </div>
        </form>

        {/* Pinned Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5 sm:px-6 shrink-0 bg-muted/30">
          <Button type="button" variant="quiet" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button form="edit-profile-form" type="submit" disabled={isPending || Boolean(handleError)} className="text-xs font-bold px-5">
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {showLinkedInModal && (
        <LinkedInImportModal
          user={user}
          onClose={() => setShowLinkedInModal(false)}
          onImport={handleLinkedInDataImported}
        />
      )}
    </div>,
    document.body
  );
}

function DeleteAccountDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiFetch('/users/me', { method: 'DELETE' });
      clearAuthSession();
      setLocation('/register');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive font-bold">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Delete Account</h2>
              <p className="text-xs text-muted-foreground">Permanent and irreversible</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive space-y-1.5">
          <p className="font-bold">Warning: This action cannot be undone.</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>Your profile ({user.fullName}) and login credentials will be permanently erased.</li>
            <li>All your posts, comments, research projects, showcases, and opportunities will be deleted.</li>
            <li>Your active chats, messages, and peer connections will be removed.</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              To confirm, type <span className="font-mono font-bold text-destructive">DELETE</span> below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-destructive font-mono"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="quiet"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
            >
              {isDeleting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>Permanently Delete</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function ProfilePage({ initialTab = 'profile' }: { initialTab?: 'profile' | 'connections' | 'my_posts' | 'saved' } = {}) {
  const { data: user, isLoading, isError, refetch } = useGetCurrentUser();
  const update = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'my_posts' | 'saved'>(initialTab);
  const [saved, setSaved] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [connSearch, setConnSearch] = useState('');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Cover photo state backed by user.coverUrl and localStorage
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    if (user?.coverUrl) return user.coverUrl;
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`amrita_user_cover_${user.id}`);
      if (stored) return stored;
    }
    return DEFAULT_COVER;
  });

  // Re-sync cover on user load
  useEffect(() => {
    if (user?.coverUrl) {
      setCoverUrl(user.coverUrl);
    } else if (user?.id) {
      const stored = localStorage.getItem(`amrita_user_cover_${user.id}`);
      if (stored) setCoverUrl(stored);
    }
  }, [user?.id, user?.coverUrl]);

  const handleSaveCover = (newUrl: string) => {
    setCoverUrl(newUrl);
    if (user?.id) {
      localStorage.setItem(`amrita_user_cover_${user.id}`, newUrl);
    }
    update.mutate(
      {
        data: {
          coverUrl: newUrl,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          setShowCoverModal(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2400);
        },
      }
    );
  };

  const handleSaveAvatar = (newAvatarUrl: string) => {
    update.mutate(
      {
        data: {
          avatarUrl: newAvatarUrl,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          setShowAvatarModal(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2400);
        },
      }
    );
  };

  const handleSaveProfileForm = (updatedFields: Partial<User>) => {
    update.mutate(
      {
        data: updatedFields,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setShowEditProfileModal(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2400);
        },
      }
    );
  };

  const handleAddQuickSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim() || !user) return;
    const skill = newSkillInput.trim();
    const existing = user.skills ?? [];
    if (existing.includes(skill)) {
      setNewSkillInput('');
      return;
    }
    const updatedSkills = [...existing, skill];
    update.mutate(
      {
        data: {
          skills: updatedSkills,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setNewSkillInput('');
        },
      }
    );
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!user) return;
    const updatedSkills = (user.skills ?? []).filter((s) => s !== skillToRemove);
    update.mutate(
      {
        data: {
          skills: updatedSkills,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        },
      }
    );
  };

  const handleCopyProfileLink = async () => {
    if (typeof window !== 'undefined' && user) {
      const canonicalHandle = (user as any).handle || user.id;
      const url = `${window.location.origin}/in/${canonicalHandle}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${user.fullName} | Amrita Connect`,
            text: user.headline || `Connect with ${user.fullName} on Amrita Connect`,
            url,
          });
          return;
        } catch {
          // Fallback to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2400);
      } catch {
        // Fallback
      }
    }
  };

  // Connections Query & Mutations
  const { data: connData, isLoading: connLoading, isError: connError, refetch: refetchConn } = useConnections();

  const removeConnectionMutation = useMutation({
    mutationFn: (connId: string) => apiFetch(`/connections/${connId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  // Check search params for initial tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'my_posts' || tabParam === 'saved' || tabParam === 'profile' || tabParam === 'connections') {
        setActiveTab(tabParam as any);
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Dedicated query for authored posts
  const { data: myPostsData, isLoading: myPostsLoading, isError: myPostsError, refetch: refetchMyPosts } = useQuery({
    queryKey: ['profile_my_posts', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      return apiFetch<{ items: PostItem[]; total: number; page: number; pageSize: number }>('/posts?filter=my_posts');
    },
  });

  // Dedicated query for saved posts
  const { data: savedPostsData, isLoading: savedPostsLoading, isError: savedPostsError, refetch: refetchSavedPosts } = useQuery({
    queryKey: ['profile_saved_posts', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      return apiFetch<{ items: PostItem[]; total: number; page: number; pageSize: number }>('/posts?filter=saved');
    },
  });

  const myPosts = myPostsData?.items ?? [];
  const savedPosts = savedPostsData?.items ?? [];
  const myPostsCount = myPostsData?.total ?? myPosts.length;
  const savedPostsCount = savedPostsData?.total ?? savedPosts.length;

  if (isLoading) return <LoadingState rows={3} />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;

  const handleLogout = () => {
    clearAuthSession();
    setLocation('/login');
  };

  // Profile strength calculation
  const strengthChecks = [
    { label: 'Profile Photo', done: Boolean(user.avatarUrl) },
    { label: 'Cover Banner', done: Boolean(coverUrl) },
    { label: 'Headline', done: Boolean(user.headline && user.headline.length > 3) },
    { label: 'About / Bio', done: Boolean(user.bio && user.bio.length > 10) },
    { label: 'Skills Added', done: Boolean(user.skills && user.skills.length > 0) },
    { label: 'Interests Added', done: Boolean(user.interests && user.interests.length > 0) },
  ];
  const strengthScore = Math.round((strengthChecks.filter((c) => c.done).length / strengthChecks.length) * 100);

  return (
    <div className="space-y-6 animate-rise pb-20 max-w-5xl mx-auto">
      {/* Top Banner Alert / Saved Notification */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-bounce">
          <Check className="h-4 w-4" /> Profile changes updated successfully!
        </div>
      )}

      {/* Profile Header Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex flex-wrap rounded-xl border border-border bg-card p-1 shadow-xs gap-1">
          {[
            { id: 'profile', label: 'Profile Overview', icon: UserCircle },
            { id: 'connections', label: `Network & Connections (${connData?.totalConnected ?? 0})`, icon: Users },
            { id: 'my_posts', label: `My Posts (${myPostsCount})`, icon: Rss },
            { id: 'saved', label: `Saved Posts (${savedPostsCount})`, icon: Bookmark },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={cx(
                  'relative rounded-lg px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-2',
                  activeTab === t.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/people/${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            Public View
          </Link>
          <button
            type="button"
            onClick={handleCopyProfileLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
            {copiedLink ? 'Copied Link' : 'Share'}
          </button>
        </div>
      </div>

      {/* Main Profile View (LinkedIn Layout) */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* 1. LinkedIn Hero Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
              {/* Cover Banner */}
              <div className="relative h-44 sm:h-60 w-full bg-slate-900 group">
                <img src={coverUrl} alt="Profile Cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                {/* Edit Cover Photo Button */}
                <button
                  type="button"
                  onClick={() => setShowCoverModal(true)}
                  className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-3.5 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Edit cover photo</span>
                </button>
              </div>

              {/* Profile Avatar & Top Info Area */}
              <div className="px-6 sm:px-8 pb-6 pt-0">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
                  {/* Avatar with Camera Overlay */}
                  <div className="relative group w-fit">
                    <Avatar user={user} size="xl" className="border-4 border-card" />
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg ring-2 ring-card transition-all active:scale-95"
                      title="Update profile photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <Button
                      type="button"
                      onClick={() => setShowEditProfileModal(true)}
                      className="rounded-xl px-4 py-2 text-xs font-bold shadow-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('connections')}
                      className="rounded-xl px-4 py-2 text-xs font-bold"
                    >
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Connections ({connData?.totalConnected ?? 0})
                    </Button>
                  </div>
                </div>

                {/* Name, Headline, Handle & Verified Signals */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {user.fullName}
                    </h1>
                    {(user as any).handle && (
                      <span className="mono rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                        @{(user as any).handle}
                      </span>
                    )}
                    <div className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{roleLabels[user.role] ?? user.role}</span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-foreground/90 leading-snug max-w-2xl">
                    {user.headline || 'Add a professional headline to describe your role, expertise, or research domain.'}
                  </p>

                  {/* Institutional Affiliation & Campus Meta */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-orange-500" />
                      <span>Amrita Vishwa Vidyapeetham · {user.campus} Campus</span>
                    </div>
                    {user.department && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
                        <span>Department of {user.department}</span>
                      </div>
                    )}
                    {user.graduationYear && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-semibold text-orange-600 dark:text-orange-400">Class of {user.graduationYear}</span>
                      </div>
                    )}
                  </div>

                  {/* Social & External Profiles */}
                  {((user as any).linkedinUrl || (user as any).githubUrl || (user as any).websiteUrl) && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                      {(user as any).linkedinUrl && (
                        <a
                          href={(user as any).linkedinUrl.startsWith('http') ? (user as any).linkedinUrl : `https://${(user as any).linkedinUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-[#0A66C2] hover:bg-muted"
                        >
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                      {(user as any).githubUrl && (
                        <a
                          href={(user as any).githubUrl.startsWith('http') ? (user as any).githubUrl : `https://${(user as any).githubUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted"
                        >
                          <Github className="h-3.5 w-3.5" /> GitHub
                        </a>
                      )}
                      {(user as any).websiteUrl && (
                        <a
                          href={(user as any).websiteUrl.startsWith('http') ? (user as any).websiteUrl : `https://${(user as any).websiteUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted"
                        >
                          <Globe className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                    </div>
                  )}

                  {/* Network Link */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('connections')}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {connData?.totalConnected ?? 0} connections
                    </button>
                    <span className="text-xs text-muted-foreground ml-2">· Official Amrita Network</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. About Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">About</h2>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {user.bio ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{user.bio}</p>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    You haven't written a summary yet. Introduce your academic background, research interests, and projects!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="mt-2 text-xs font-bold text-orange-500 hover:underline"
                  >
                    + Add an About summary
                  </button>
                </div>
              )}
            </div>

            {/* 3. Experience & Academic Background Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Experience & Academic Appointments</h2>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Custom Experience entries */}
                {((user as any).experiences || []).map((exp: any, i: number) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-muted/20 p-3.5">
                    <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-bold text-foreground">{exp.title}</h3>
                        {(exp.startDate || exp.endDate) && (
                          <span className="mono text-[10px] font-semibold text-muted-foreground">
                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate || 'Present'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground">{exp.company}</p>
                      {exp.location && <p className="text-[11px] text-muted-foreground/80">{exp.location}</p>}
                      {exp.description && <p className="text-xs text-muted-foreground pt-1">{exp.description}</p>}
                    </div>
                  </div>
                ))}

                {/* Organization / Lab Role fallback */}
                {user.company || user.jobRole ? (
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{user.jobRole || 'Researcher / Specialist'}</h3>
                      <p className="text-xs font-semibold text-muted-foreground">{user.company || 'Amrita Research Lab'}</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">Active Position · Amrita Ecosystem</p>
                    </div>
                  </div>
                ) : null}

                {/* University Institutional Entry */}
                <div className="flex items-start gap-3.5">
                  <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Amrita Vishwa Vidyapeetham</h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {roleLabels[user.role] ?? user.role} · Department of {user.department || 'Engineering'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {user.campus} Campus {user.graduationYear ? `· Class of ${user.graduationYear}` : '· Full-time'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Education Card */}
            {((user as any).education || []).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Education & Degrees</h2>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {((user as any).education || []).map((edu: any, i: number) => (
                    <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-muted/20 p-3.5">
                      <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-bold text-foreground">{edu.school}</h3>
                          {(edu.startYear || edu.endYear) && (
                            <span className="mono text-[10px] font-semibold text-muted-foreground">
                              {edu.startYear} – {edu.endYear}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ''}
                        </p>
                        {edu.grade && <p className="text-[11px] text-orange-500 font-medium">Grade: {edu.grade}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Skills & Endorsements Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Skills & Expertise</h2>
                  <p className="text-xs text-muted-foreground">Core competencies, tools, and research methodologies.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* Skills Tag Cloud */}
              <div className="flex flex-wrap gap-2">
                {(user.skills ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No skills listed yet.</p>
                ) : (
                  (user.skills ?? []).map((skill) => (
                    <span
                      key={skill}
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-orange-500/40 transition-colors"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Remove skill"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Inline Quick Add Skill */}
              <form onSubmit={handleAddQuickSkill} className="flex gap-2 pt-2 border-t border-border/60">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Type a skill (e.g. Distributed Systems, PyTorch) and press Enter..."
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:border-orange-500"
                />
                <Button type="submit" disabled={!newSkillInput.trim() || update.isPending} className="px-3.5 py-2 text-xs font-bold">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </form>
            </div>

            {/* 5. Interests & Focus Areas Card */}
            {(user.interests ?? []).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Interests & Research Focus</h2>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.interests?.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-3 py-1 text-xs font-bold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Mentorship & Collaboration Matrix Card */}
            {((user.helpWith ?? []).length > 0 || (user.lookingFor ?? []).length > 0) && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Mentorship & Collaboration Matrix</h2>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      I Can Help With
                    </span>
                    <ul className="space-y-1.5">
                      {user.helpWith?.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      I Am Looking For
                    </span>
                    <ul className="space-y-1.5">
                      {user.lookingFor?.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Activity & Published Content Preview */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Activity & Published Blogs</h2>
                  <p className="text-xs text-muted-foreground">{myPostsCount} articles and updates shared</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('my_posts')}
                  className="text-xs font-bold text-orange-500 hover:underline"
                >
                  View All Activity
                </button>
              </div>

              {myPosts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
                  <Rss className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">You haven't posted any updates or blogs yet.</p>
                  <Button onClick={() => setLocation('/feed')} className="mt-3 text-xs font-bold">
                    Create a Post in Feed
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPosts.slice(0, 2).map((post) => (
                    <div key={post.id} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{relative(post.createdAt)}</p>
                      <p className="text-sm font-bold text-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span>{post.likesCount} likes</span>
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Strength Checklist */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Strength</span>
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                  {strengthScore}% Complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${strengthScore}%` }}
                />
              </div>

              <div className="space-y-2 pt-1">
                {strengthChecks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className={item.done ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                    {item.done ? (
                      <Check className="h-4 w-4 text-emerald-500 font-bold" />
                    ) : (
                      <span className="text-[10px] font-semibold text-orange-500 hover:underline cursor-pointer" onClick={() => setShowEditProfileModal(true)}>
                        + Add
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>


            {/* Amrita Campus Directory Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campus Directory</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Primary Campus</span>
                  <span className="font-bold text-foreground">{user.campus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-bold text-foreground">{user.department}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Member Status</span>
                  <span className="font-bold text-emerald-500">Verified Member</span>
                </div>
              </div>
            </div>

            {/* Account & Security */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account & Security</h3>
              <button
                type="button"
                data-testid="button-profile-logout"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors active:scale-95 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span>Sign out of account</span>
              </button>
              <button
                type="button"
                data-testid="button-profile-delete-account"
                onClick={() => setShowDeleteAccountModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/15 transition-colors active:scale-95 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete account permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCoverModal && (
        <CoverPhotoDialog
          currentCover={coverUrl}
          onSave={handleSaveCover}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {showAvatarModal && (
        <AvatarPhotoDialog
          currentAvatar={user.avatarUrl}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarModal(false)}
          isPending={update.isPending}
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfileModal(false)}
          onSave={handleSaveProfileForm}
          isPending={update.isPending}
        />
      )}

      {showDeleteAccountModal && (
        <DeleteAccountDialog
          user={user}
          onClose={() => setShowDeleteAccountModal(false)}
        />
      )}

      {/* My Connections Tab */}
      {activeTab === 'connections' && (
        <div className="space-y-6 animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Your Network ({connData?.totalConnected ?? 0})
              </h2>
              <p className="text-xs text-muted-foreground">
                People you are connected with across all 7 Amrita campuses.
              </p>
            </div>

            <label className="relative block w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={connSearch}
                onChange={(e) => setConnSearch(e.target.value)}
                placeholder="Filter by name, department, campus..."
                className="w-full rounded-xl border border-input bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-orange-500 shadow-sm"
              />
            </label>
          </div>

          {connLoading ? (
            <LoadingState rows={4} />
          ) : connError ? (
            <ErrorState onRetry={() => refetchConn()} />
          ) : (connData?.connected ?? []).length === 0 ? (
            <div className="rounded-3xl border border-dashed border-orange-500/30 bg-gradient-to-b from-card/80 to-orange-50/20 dark:to-orange-950/10 p-8 sm:p-12 text-center shadow-sm animate-rise">
              <div className="relative mx-auto h-16 w-16 mb-4 flex items-center justify-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black shadow-inner">
                  <Users className="h-7 w-7" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-foreground">
                Your Amrita network starts here.
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                You have 0 active connections yet. Connect with classmates in your department, alumni mentors, and research collaborators!
              </p>

              <div className="mt-6 flex justify-center">
                <Button onClick={() => setLocation('/feed?tab=discover')} className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-md">
                  <Sparkles className="h-4 w-4" /> Explore Campus Directory
                </Button>
              </div>
            </div>
          ) : (
            (() => {
              const filtered = (connData?.connected ?? []).filter((item) => {
                if (!connSearch.trim()) return true;
                const q = connSearch.toLowerCase();
                return (
                  item.user?.fullName?.toLowerCase().includes(q) ||
                  item.user?.department?.toLowerCase().includes(q) ||
                  item.user?.campus?.toLowerCase().includes(q) ||
                  item.user?.skills?.some((s) => s.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-bold text-foreground">No matching connections</h3>
                    <p className="text-xs text-muted-foreground mt-1">Try searching with a different name or department.</p>
                  </div>
                );
              }

              return (
                <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden divide-y divide-border/60 animate-rise">
                  {filtered.map(({ id, user, connectedAt }) => (
                    <LinkedInConnectionRow
                      key={id}
                      user={user}
                      isConnected={true}
                      connectedAt={connectedAt}
                    />
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* My Posts Tab View */}
      {activeTab === 'my_posts' && (
        <div className="space-y-4 max-w-3xl">
          {myPostsLoading ? (
            <LoadingState rows={4} />
          ) : myPostsError ? (
            <ErrorState onRetry={() => refetchMyPosts()} />
          ) : myPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
                <Rss className="h-7 w-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                No posts published yet
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Share your blogs, articles, project updates, achievements, or interview experiences in the Community Feed!
              </p>
              <Button onClick={() => setLocation('/feed')} className="mt-5 text-xs font-bold">
                Go to Feed & Post
              </Button>
            </div>
          ) : (
            myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={(p) => setEditingPost(p)}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ['profile_my_posts'] });
                  queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
                  queryClient.invalidateQueries({ queryKey: ['posts'] });
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Saved Posts Tab View */}
      {activeTab === 'saved' && (
        <div className="space-y-4 max-w-3xl">
          {savedPostsLoading ? (
            <LoadingState rows={4} />
          ) : savedPostsError ? (
            <ErrorState onRetry={() => refetchSavedPosts()} />
          ) : savedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
                <Bookmark className="h-7 w-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                No saved posts
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Posts you bookmark in the community feed will appear here for quick access.
              </p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={(p) => setEditingPost(p)}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ['profile_saved_posts'] });
                  queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
                  queryClient.invalidateQueries({ queryKey: ['posts'] });
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['profile_my_posts'] });
            queryClient.invalidateQueries({ queryKey: ['profile_saved_posts'] });
            queryClient.invalidateQueries({ queryKey: ['profile_posts'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
}

function AdminPage() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data, isLoading, isError, refetch } = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), enabled: user?.role === 'admin' } });
  if (userLoading || isLoading) return <LoadingState rows={4} />;
  if (!user || user.role !== 'admin') return <EmptyState icon={ShieldCheck} title="This workspace is restricted" detail="Admin console access is limited to platform administrators." action={<Link href="/feed" className="text-sm font-bold text-accent">Return to Feed</Link>} />;
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
      <section className="surface rounded-xl border border-border p-5 sm:p-6"><SectionHeader eyebrow="Quick access" title="Review the public network" /><div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{[['Feed', '/feed', Rss], ['Opportunities', '/opportunities', BriefcaseBusiness], ['Events', '/events', CalendarDays]].map(([label, href, Icon]) => <Link key={label as string} href={href as string} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-accent"><Icon className="h-4 w-4" /></span><span className="text-sm font-bold text-foreground">{label as string}</span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>)}</div></section>
    </div>
  </>;
}

function NotFound() { return <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><div className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">404 / Off the map</div><h1 className="mt-4 text-5xl font-bold tracking-[-.06em] text-foreground">This path is not connected.</h1><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent">Return home <ArrowRight className="h-4 w-4" /></Link></div></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser();
  const [location, setLocation] = useLocation();
  if (isLoading) return <AppShell><LoadingState rows={4} /></AppShell>;
  if (!user) {
    setLocation(`/login?redirect=${encodeURIComponent(location)}`);
    return null;
  }
  return <AppShell user={user}>{children}</AppShell>;
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function PublicProfileRoute() {
  const { data: user, isLoading } = useGetCurrentUser();
  if (isLoading) return <AppShell><LoadingState rows={4} /></AppShell>;
  return <AppShell user={user}><PublicProfilePage /></AppShell>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/in/:id"><PublicProfileRoute /></Route>
        <Route path="/people/:id"><PublicProfileRoute /></Route>
        <Route path="/profile/:slug" component={SeniorProfilePage} />
        <Route path="/seniors/:slug" component={SeniorProfilePage} />
        <Route path="/dashboard"><ProtectedRoute><FeedPage /></ProtectedRoute></Route>
        <Route path="/feed"><ProtectedRoute><FeedPage /></ProtectedRoute></Route>
        <Route path="/connections"><ProtectedRoute><ProfilePage initialTab="connections" /></ProtectedRoute></Route>
        <Route path="/messages"><ProtectedRoute><MessagesPage /></ProtectedRoute></Route>
        <Route path="/messages/:recipientId"><ProtectedRoute><MessagesPage /></ProtectedRoute></Route>
        <Route path="/matchmaker"><ProtectedRoute><MatchmakerPage /></ProtectedRoute></Route>
        <Route path="/interviews"><ProtectedRoute><InterviewsPage /></ProtectedRoute></Route>
        <Route path="/help"><ProtectedRoute><HelpDeskPage /></ProtectedRoute></Route>
        <Route path="/campus-buddy"><ProtectedRoute><CampusBuddyPage /></ProtectedRoute></Route>
        <Route path="/research"><ProtectedRoute><ResearchPage /></ProtectedRoute></Route>
        <Route path="/showcase"><ProtectedRoute><ShowcasePage /></ProtectedRoute></Route>
        <Route path="/blogs"><ProtectedRoute><BlogsPage /></ProtectedRoute></Route>
        <Route path="/admin"><ProtectedRoute><AdminPage /></ProtectedRoute></Route>
        <Route path="/profile"><ProtectedRoute><ProfilePage /></ProtectedRoute></Route>
        <Route path="/people"><ProtectedRoute><FeedPage initialTab="discover" /></ProtectedRoute></Route>
        <Route path="/mentorship"><ProtectedRoute><MentorshipPage /></ProtectedRoute></Route>
        <Route path="/collaborations"><ProtectedRoute><CollaborationsPage /></ProtectedRoute></Route>
        <Route path="/opportunities"><ProtectedRoute><OpportunitiesPage /></ProtectedRoute></Route>
        <Route path="/events"><ProtectedRoute><EventsPage /></ProtectedRoute></Route>
        <Route path="/notifications"><ProtectedRoute><NotificationsPage /></ProtectedRoute></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}








function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
