import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Award, BookOpen, BriefcaseBusiness, Building2, CalendarDays, Check,
  CheckCircle2, ChevronRight, Clock, Copy, ExternalLink, Flame, GraduationCap,
  Heart, HeartHandshake, Layers, Lightbulb, Link2, MapPin, MessageSquare,
  MoreHorizontal, Send, Share2, ShieldCheck, Sparkles, Star, ThumbsUp,
  UserCheck, UserPlus, Users, X, Zap
} from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { ALL_PROFILES_BY_SLUG, PLACED_SENIORS, PLACED_ALUMNI_DATA, type ArticleGuide, type SeniorProfile } from '../data/seniorsData';

export function SeniorProfilePage() {
  const params = useParams<{ slug?: string }>();
  const [_, setLocation] = useLocation();
  const slug = (params.slug || 'nitesh').toLowerCase();

  // Find profile by slug, or fallback to first senior
  const profile: SeniorProfile = ALL_PROFILES_BY_SLUG[slug] || PLACED_SENIORS[0];

  // Interactive States
  const [activeTab, setActiveTab] = useState<'overview' | 'blogs' | 'posts' | 'mentorship'>('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionPending, setConnectionPending] = useState(false);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(profile.mentorshipSessions[0]?.title || '1:1 Career Guidance');
  const [mentorshipNote, setMentorshipNote] = useState('');
  const [selectedDate, setSelectedDate] = useState('Tomorrow, 6:00 PM IST');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('overview');
    setIsConnected(false);
    setConnectionPending(false);
    setSelectedTopic(profile.mentorshipSessions[0]?.title || '1:1 Career Guidance');
  }, [slug]);

  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Blog Reader Modal State
  const [readingBlog, setReadingBlog] = useState<ArticleGuide | null>(null);

  // Post Likes State
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [postLikes, setPostLikes] = useState<Record<string, number>>(() =>
    profile.posts.reduce((acc, p) => ({ ...acc, [p.id]: p.likes }), {})
  );

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleConnect = () => {
    if (isConnected) {
      setIsConnected(false);
      setConnectionPending(false);
      showToast(`Removed connection with ${profile.name}`);
    } else if (connectionPending) {
      setConnectionPending(false);
      showToast(`Cancelled connection request to ${profile.name}`);
    } else {
      setConnectionPending(true);
      showToast(`Connection request sent to ${profile.name}!`);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied to clipboard!');
    } else {
      showToast('Profile URL ready to share!');
    }
  };

  const handleBookMentorship = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowMentorshipModal(false);
      setMentorshipNote('');
      showToast(`Mentorship request sent to ${profile.name}! They will confirm via email.`);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setMessageText('');
      showToast(`Message delivered to ${profile.name}!`);
    }, 1000);
  };

  const togglePostLike = (postId: string) => {
    const isLiked = !!likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isLiked }));
    setPostLikes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1),
    }));
  };

  const getCompanyBadge = (company: string) => {
    const c = company.toLowerCase();
    if (c.includes('amazon')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <span className="font-extrabold text-[11px] text-[#ff9900]">aws</span> Amazon
        </span>
      );
    }
    if (c.includes('infosys')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
          <span className="font-extrabold text-[11px] text-blue-600">INFY</span> Infosys
        </span>
      );
    }
    if (c.includes('math') || c.includes('mathco')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
          <span className="font-extrabold text-[11px] text-purple-600">∑</span> The Math Company
        </span>
      );
    }
    if (c.includes('lam')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
          <span className="font-extrabold text-[11px] text-cyan-600">LAM</span> Lam Research
        </span>
      );
    }
    if (c.includes('servicenow')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <span className="font-extrabold text-[11px] text-emerald-600">now</span> ServiceNow
        </span>
      );
    }
    if (c.includes('tcs')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
          <span className="font-extrabold text-[11px] text-rose-600">TCS</span> Tata Consultancy Services
        </span>
      );
    }
    if (c.includes('google')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
          <span className="font-bold text-[11px] text-blue-500">G</span> Google
        </span>
      );
    }
    if (c.includes('microsoft')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
          <span className="font-bold text-[11px] text-sky-500">MS</span> Microsoft
        </span>
      );
    }
    if (c.includes('nvidia')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <span className="font-bold text-[11px] text-[#76b900]">n</span> NVIDIA
        </span>
      );
    }
    if (c.includes('cisco')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
          <span className="font-extrabold text-[11px] text-[#00bceb]">cisco</span> Cisco Talos
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-1 text-xs font-bold text-foreground">
        <Building2 className="h-3.5 w-3.5 text-accent" /> {company}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="h-4 w-4 text-accent animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>/</span>
              <Link href="/#alumni" className="hover:text-foreground">Seniors & Alumni</Link>
              <span>/</span>
              <span className="font-semibold text-foreground">{profile.name}</span>
            </div>
          </div>

          {/* Quick Action Top Bar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              title="Share profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => setShowMentorshipModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Ask for Mentorship</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        {/* Profile Hero Header Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl backdrop-blur-md">
          {/* Stylized Gradient Cover Banner */}
          <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="absolute right-6 top-6 hidden sm:flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <GraduationCap className="h-4 w-4 text-orange-400" />
              <span>Amrita Vishwa Vidyapeetham · {profile.campus}</span>
            </div>
          </div>

          {/* Profile Details Bar */}
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              {/* Avatar & Badges */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="relative">
                  <div className={`h-32 w-32 sm:h-36 sm:w-36 rounded-full p-1.5 ring-4 shadow-2xl bg-card ${profile.ringClass}`}>
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  {profile.verified && (
                    <div
                      className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-card"
                      title="Verified Amrita Student/Alumnus"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                      {profile.name}
                    </h1>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${profile.badgeClass}`}>
                      <Sparkles className="h-3 w-3" />
                      {profile.type === 'senior' ? `Verified Senior (${profile.graduationYear})` : 'Distinguished Alumni'}
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base font-bold ${profile.roleColor}`}>
                    {profile.role}
                  </p>

                  <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" /> {profile.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/80" /> {profile.batch}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground/80" /> {profile.department}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm active:scale-95"
                >
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span>Message</span>
                </button>

                <button
                  onClick={toggleConnect}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                    isConnected
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : connectionPending
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-border/80 bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <UserCheck className="h-4 w-4" /> Connected
                    </>
                  ) : connectionPending ? (
                    <>
                      <Clock className="h-4 w-4" /> Request Pending
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 text-accent" /> Connect
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowMentorshipModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  <HeartHandshake className="h-4 w-4" />
                  <span>Ask for Mentorship</span>
                </button>
              </div>
            </div>

            {/* Placed Companies Highlights */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-5 border-t border-border/60">
              <span className="mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
                Placed / Offers Received:
              </span>
              {profile.companies.map((company) => (
                <div key={company}>{getCompanyBadge(company)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="mt-8 flex items-center gap-2 border-b border-border/80 pb-px overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Journey', icon: Sparkles },
            { id: 'blogs', label: `Placement Guides & Blogs (${profile.blogs.length})`, icon: BookOpen },
            { id: 'posts', label: `Posts & Updates (${profile.posts.length})`, icon: MessageSquare },
            { id: 'mentorship', label: `1:1 Mentorship Sessions (${profile.mentorshipSessions.length})`, icon: HeartHandshake },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & JOURNEY */}
        {activeTab === 'overview' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Bio, Offers, Areas of Help */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" /> About & Journey
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {profile.bio}
                </p>

                {/* Skills Badges */}
                <div className="mt-6 pt-5 border-t border-border/60">
                  <h3 className="mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Technical Core & Frameworks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-xl border border-border/80 bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="mt-5">
                  <h3 className="mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Tools & Environments
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-lg bg-muted/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Placement Offers */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" /> Verified Campus Placements & Offers
                </h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.offers.map((offer, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/80 bg-background/80 p-4.5 flex flex-col justify-between hover:border-border transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                            {offer.category}
                          </span>
                          <h3 className="mt-2 text-base font-bold text-foreground">{offer.company}</h3>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{offer.role}</p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground font-bold shadow-2xs">
                          <Building2 className="h-5 w-5 text-accent" />
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> CIR Verified
                        </span>
                        <span className="font-semibold">{offer.year} Batch</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What I can help juniors with */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-accent" /> How I Can Guide Amrita Juniors
                </h2>
                <div className="mt-4 space-y-3">
                  {profile.helpWith.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-foreground">
                      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Stats, Mentorship Quick Card, Campus Details */}
            <div className="space-y-6">
              {/* Quick Mentorship Callout */}
              <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                  <HeartHandshake className="h-4 w-4" /> 1:1 Peer Mentorship
                </div>
                <h3 className="mt-2 text-lg font-bold text-foreground">
                  Get personalized guidance from {profile.name.split(' ')[0]}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Book a direct 30–45 min mock interview, resume audit, or strategy session tailored for tier-1 campus drives.
                </p>
                <button
                  onClick={() => setShowMentorshipModal(true)}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Book a Mentorship Slot</span>
                </button>
              </div>

              {/* Academic & University Details */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
                <h3 className="mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Academic Credentials
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Campus:</span>
                    <span className="font-bold text-foreground">{profile.campus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Department:</span>
                    <span className="font-bold text-foreground">{profile.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Batch / Class:</span>
                    <span className="font-bold text-accent">{profile.batch}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Placed Senior & Campus Mentor
                    </span>
                  </div>
                </div>
              </div>

              {/* Other Seniors Carousel / Quick Links */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Other Placed Seniors (2024)
                </h3>
                <div className="space-y-3">
                  {PLACED_SENIORS.filter((s) => s.slug !== profile.slug).map((senior) => (
                    <Link
                      key={senior.slug}
                      href={`/profile/${senior.slug}`}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/70 transition-all group"
                    >
                      <img
                        src={senior.avatar}
                        alt={senior.name}
                        className={`h-10 w-10 rounded-full object-cover ring-2 ${senior.ringClass}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground group-hover:text-accent truncate">
                          {senior.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {senior.companyDisplay}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLACEMENT GUIDES & BLOGS */}
        {activeTab === 'blogs' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Articles, Roadmaps & Placement Guides
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  In-depth interview breakdowns, coding patterns, and strategies written by {profile.name}.
                </p>
              </div>
              <span className="mono text-xs font-semibold text-muted-foreground">
                {profile.blogs.length} articles published
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between hover:border-border hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {blog.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {blog.readTime}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground hover:text-accent transition-colors leading-snug">
                      {blog.title}
                    </h3>

                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {blog.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-secondary/80 px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                    <button
                      onClick={() => setReadingBlog(blog)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                    >
                      Read Full Guide <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="text-muted-foreground hover:text-foreground"
                      title="Share article"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: POSTS & UPDATES */}
        {activeTab === 'posts' && (
          <div className="mt-8 max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Activity & Community Feed
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Recent updates, coding tips, and placement announcements from {profile.name}.
              </p>
            </div>

            <div className="space-y-4">
              {profile.posts.map((post) => {
                const isLiked = !!likedPosts[post.id];
                const currentLikes = postLikes[post.id] ?? post.likes;

                return (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className={`h-10 w-10 rounded-full object-cover ring-2 ${profile.ringClass}`}
                        />
                        <div>
                          <p className="text-xs font-bold text-foreground">{profile.name}</p>
                          <p className="text-[11px] text-muted-foreground">{post.date}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                        {post.tag}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                      {post.content}
                    </p>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => togglePostLike(post.id)}
                          className={`inline-flex items-center gap-1.5 font-semibold transition-colors active:scale-95 ${
                            isLiked ? 'text-rose-500 font-bold' : 'hover:text-foreground'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{currentLikes} Likes</span>
                        </button>
                        <button
                          onClick={() => showToast('Comments section opened')}
                          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comments} Comments</span>
                        </button>
                      </div>

                      <button
                        onClick={handleShare}
                        className="hover:text-foreground"
                        title="Share post"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MENTORSHIP & 1:1 SESSIONS */}
        {activeTab === 'mentorship' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  1-on-1 Mentorship Sessions
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Book dedicated 1-on-1 office hours for mock interviews, resume audits, and placement strategy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.mentorshipSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-accent/50 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                        <Clock className="h-3.5 w-3.5" /> {session.duration}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Free for Amrita Students
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {session.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {session.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border/60">
                      <p className="mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Topics Covered:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-lg bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTopic(session.title);
                      setShowMentorshipModal(true);
                    }}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Request This Session</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: MENTORSHIP REQUEST DIALOG */}
      {showMentorshipModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowMentorshipModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <span className="mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Amrita Mentorship Connect
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Ask {profile.name.split(' ')[0]} to Mentor You
                </h2>
              </div>
            </div>

            <form onSubmit={handleBookMentorship} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Mentorship Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-primary"
                >
                  {profile.mentorshipSessions.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title} ({s.duration})
                    </option>
                  ))}
                  <option value="Resume Review & ATS Feedback">Resume Review & ATS Feedback</option>
                  <option value="Placement Roadmap & Motivation">Placement Roadmap & Motivation</option>
                  <option value="Other Technical / Project Doubts">Other Technical / Project Doubts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Preferred Time Slot
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-primary"
                >
                  <option value="Tomorrow, 6:00 PM IST">Tomorrow, 6:00 PM IST</option>
                  <option value="Tomorrow, 8:00 PM IST">Tomorrow, 8:00 PM IST</option>
                  <option value="Saturday, 11:00 AM IST">Saturday, 11:00 AM IST</option>
                  <option value="Sunday, 4:00 PM IST">Sunday, 4:00 PM IST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Your Note to {profile.name.split(' ')[0]}
                </label>
                <textarea
                  value={mentorshipNote}
                  onChange={(e) => setMentorshipNote(e.target.value)}
                  required
                  rows={4}
                  placeholder={`Hi ${profile.name.split(' ')[0]}, I am a junior at Amrita looking for guidance on campus placements. I would love your advice on preparing for ${profile.companies[0]}...`}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMentorshipModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSuccess}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  {bookingSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> Request Sent!
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Mentorship Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND MESSAGE DIALOG */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
            <button
              onClick={() => setShowMessageModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/40"
              />
              <div>
                <h2 className="text-base font-bold text-foreground">Message {profile.name}</h2>
                <p className="text-xs text-muted-foreground">{profile.role}</p>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="mt-5 space-y-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
                rows={4}
                placeholder="Type your message here..."
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={messageSent}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90"
                >
                  {messageSent ? (
                    <>
                      <Check className="h-4 w-4" /> Sent!
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL BLOG ARTICLE READER */}
      {readingBlog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-3xl my-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-2xl relative">
            <button
              onClick={() => setReadingBlog(null)}
              className="absolute right-5 top-5 rounded-full p-2.5 bg-muted text-foreground hover:bg-muted/80 shadow-sm"
              title="Close article"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {readingBlog.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {readingBlog.readTime}
              </span>
              <span>•</span>
              <span className="font-semibold text-accent">By {profile.name}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
              {readingBlog.title}
            </h1>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {readingBlog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Key Takeaways Box */}
            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h3 className="mono text-xs font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Key Takeaways
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-foreground">
                {readingBlog.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Full Article Content */}
            <div className="mt-6 text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-line space-y-4 border-t border-border/60 pt-6">
              {readingBlog.content}
            </div>

            {/* Bottom Footer Callout */}
            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-accent"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">{profile.name}</p>
                  <p className="text-[11px] text-muted-foreground">{profile.role}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReadingBlog(null);
                  setSelectedTopic(readingBlog.title);
                  setShowMentorshipModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90"
              >
                <HeartHandshake className="h-4 w-4" />
                <span>Discuss with {profile.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SeniorProfilePage;
