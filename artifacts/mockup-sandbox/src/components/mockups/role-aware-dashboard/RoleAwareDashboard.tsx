import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  FileText,
  Handshake,
  Home,
  Lightbulb,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

type NavKey = "Overview" | "Directory" | "Mentorship" | "Research" | "Opportunities" | "Events";

const navItems: Array<{ label: NavKey; icon: typeof Home; count?: string }> = [
  { label: "Overview", icon: Home },
  { label: "Directory", icon: Network },
  { label: "Mentorship", icon: Handshake, count: "3" },
  { label: "Research", icon: Lightbulb },
  { label: "Opportunities", icon: BriefcaseBusiness, count: "8" },
  { label: "Events", icon: CalendarDays },
];

const recommendations = [
  {
    id: "ananya",
    initials: "AS",
    accent: "bg-[#dfe9e2] text-[#265c4b]",
    name: "Ananya Srinivasan",
    role: "M.Tech · Computational Biology",
    campus: "Amrita Vishwa Vidyapeetham, Bengaluru",
    reason: "Works on the same cancer genomics methods you bookmarked",
    tag: "Research collaborator",
    signal: "3 shared interests",
  },
  {
    id: "ravi",
    initials: "RM",
    accent: "bg-[#f1e5d4] text-[#8a5427]",
    name: "Ravi Menon",
    role: "Class of 2017 · Product, Microsoft",
    campus: "Amrita alumnus · Seattle",
    reason: "Offers career conversations for students moving into health tech",
    tag: "Career mentor",
    signal: "2 shared pathways",
  },
  {
    id: "meera",
    initials: "MK",
    accent: "bg-[#e6e0ef] text-[#5b4b7a]",
    name: "Dr. Meera Krishnan",
    role: "Associate Professor · School of Engineering",
    campus: "Amritapuri · Research faculty",
    reason: "Recently published work in human-centred machine learning",
    tag: "Research guide",
    signal: "Matches your focus",
  },
];

const events = [
  {
    title: "Research to Industry: Health AI",
    type: "Panel discussion",
    date: "18",
    month: "MAR",
    time: "4:00 – 5:15 PM",
    place: "Bengaluru · Hybrid",
    color: "bg-[#efe3bd] text-[#866323]",
  },
  {
    title: "Alumni office hours: Product careers",
    type: "Mentorship",
    date: "21",
    month: "MAR",
    time: "6:30 – 7:30 PM",
    place: "Online · Small group",
    color: "bg-[#dce8e7] text-[#27605b]",
  },
  {
    title: "Open lab walk-through",
    type: "Campus gathering",
    date: "26",
    month: "MAR",
    time: "11:00 AM – 1:00 PM",
    place: "Amritapuri · AB3, Lab 204",
    color: "bg-[#e7deed] text-[#654d78]",
  },
];

const activityItems = [
  { title: "Mentorship request accepted", detail: "Ravi Menon can meet on Thursday", time: "2h", icon: Handshake, color: "text-[#9a6c17] bg-[#f5edda]" },
  { title: "Your profile was viewed", detail: "By a researcher from Coimbatore", time: "5h", icon: Users, color: "text-[#326b64] bg-[#e1eeeb]" },
  { title: "New opportunity match", detail: "Summer Research Fellowship · 87% fit", time: "Yesterday", icon: Target, color: "text-[#795985] bg-[#eee8f1]" },
];

function InitialsAvatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold tracking-[0.06em] ${className}`}>
      {initials}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.19em] text-[#9a6c17]">{eyebrow}</p>}
        <h2 className="font-['Fraunces'] text-[21px] font-semibold tracking-[-0.025em] text-[#1e3340]">{title}</h2>
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="group flex items-center gap-1 pb-0.5 text-[11px] font-semibold text-[#6b7476] transition-colors hover:text-[#1f5960]"
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

export default function RoleAwareDashboard() {
  const [activeNav, setActiveNav] = useState<NavKey>("Overview");
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<"People" | "Paths">("People");
  const [saved, setSaved] = useState<string[]>(["ravi"]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const visibleRecommendations = useMemo(
    () => recommendations.filter((person) => !dismissed.includes(person.id)),
    [dismissed],
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const selectNav = (label: NavKey) => {
    setActiveNav(label);
    setMobileNavOpen(false);
    if (label !== "Overview") showNotice(`${label} workspace selected`);
  };

  const toggleSaved = (id: string, name: string) => {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    showNotice(saved.includes(id) ? `${name} removed from saved` : `${name} saved to your shortlist`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f5f2eb] font-['DM_Sans'] text-[#1e3340]">
      <style>{`
        @keyframes rise-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes soft-in { from { opacity: 0; } to { opacity: 1; } }
        .ra-rise { animation: rise-in 560ms cubic-bezier(.22,.8,.24,1) both; }
        .ra-soft { animation: soft-in 420ms ease-out both; }
        .ra-delay-1 { animation-delay: 70ms; } .ra-delay-2 { animation-delay: 140ms; }
        .ra-delay-3 { animation-delay: 210ms; } .ra-delay-4 { animation-delay: 280ms; }
        .ra-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
        .ra-scroll::-webkit-scrollbar-thumb { background: #d4cdbd; border-radius: 20px; }
        .ra-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="flex min-h-[100dvh]">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[246px] shrink-0 flex-col border-r border-[#dfd9ca] bg-[#f9f7f2] px-5 py-5 transition-transform duration-300 lg:static lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-9 flex items-center justify-between">
            <button type="button" onClick={() => selectNav("Overview")} className="flex items-center gap-2.5 text-left" aria-label="Go to Amrita Connect overview">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#c69a3b] text-[18px] font-bold text-[#fffaf0] shadow-[0_4px_10px_rgba(159,117,35,0.18)]">A</span>
              <span>
                <span className="block font-['Fraunces'] text-[17px] font-semibold leading-none tracking-[-0.03em] text-[#1c3947]">Amrita</span>
                <span className="mt-1 block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#a07929]">Connect</span>
              </span>
            </button>
            <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-[#788083] hover:bg-[#eee9dd] lg:hidden" aria-label="Close navigation">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a9a90]">Your commons</div>
          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => selectNav(item.label)}
                  className={`group flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold transition-all ${isActive ? "bg-[#e9dfc7] text-[#264d55] shadow-[inset_3px_0_0_#bf922f]" : "text-[#6c7677] hover:bg-[#f0ece3] hover:text-[#2c555b]"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-[16px] w-[16px] ${isActive ? "text-[#ae7e20]" : "text-[#89908e] group-hover:text-[#477277]"}`} strokeWidth={isActive ? 2.3 : 1.8} />
                    {item.label}
                  </span>
                  {item.count && <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${isActive ? "bg-[#d5be85] text-[#664c17]" : "bg-[#e9e7e0] text-[#8a918e]"}`}>{item.count}</span>}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-[#e6e0d4] pt-6">
            <div className="mb-4 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a9a90]">Keep exploring</div>
            <button type="button" onClick={() => showNotice("Directory explorer opened")} className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold text-[#6c7677] transition-colors hover:bg-[#f0ece3] hover:text-[#2c555b]">
              <Compass className="h-[16px] w-[16px] text-[#89908e] group-hover:text-[#477277]" strokeWidth={1.8} />
              Cross-campus explorer
            </button>
            <button type="button" onClick={() => showNotice("Help centre opened")} className="group mt-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold text-[#6c7677] transition-colors hover:bg-[#f0ece3] hover:text-[#2c555b]">
              <CircleHelp className="h-[16px] w-[16px] text-[#89908e] group-hover:text-[#477277]" strokeWidth={1.8} />
              Help centre
            </button>
          </div>

          <div className="mt-auto rounded-[14px] border border-[#ddd5c4] bg-[#f0eadb] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#a6791e]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#866522]">Profile signal</span>
            </div>
            <p className="text-[11px] leading-[1.45] text-[#6f6b5e]">A clearer focus helps us find better people and paths for you.</p>
            <button type="button" onClick={() => showNotice("Profile editor opened")} className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#2b5d61] hover:text-[#1c4449]">
              Tune your profile <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        {mobileNavOpen && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-30 bg-[#233a3d]/25 lg:hidden" />}

        <main className="ra-scroll min-w-0 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 flex h-[69px] items-center justify-between border-b border-[#e4ded1]/90 bg-[#f5f2eb]/95 px-5 backdrop-blur-md sm:px-8 lg:px-11">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-[#5e6b6d] hover:bg-[#eae5da] lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative hidden w-[270px] sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba09b]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter" && search.trim()) showNotice(`Searching the commons for “${search.trim()}”`); }}
                  placeholder="Search people, paths, or research"
                  aria-label="Search the commons"
                  className="h-9 w-full rounded-[9px] border border-[#e0dacc] bg-[#f9f7f2] pl-9 pr-3 text-[11px] text-[#334c51] outline-none transition-all placeholder:text-[#a4a7a0] focus:border-[#b99a58] focus:ring-2 focus:ring-[#d8c391]/40"
                />
              </div>
              <span className="hidden rounded-full border border-[#ded5c2] bg-[#faf8f3] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.11em] text-[#87734a] md:inline-flex">Student view</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4">
              <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-full p-2 text-[#647376] transition-colors hover:bg-[#eae5da] hover:text-[#295b61]" aria-label="Open notifications">
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span className="absolute right-[5px] top-[4px] h-1.5 w-1.5 rounded-full bg-[#c18f29] ring-2 ring-[#f5f2eb]" />
              </button>
              <div className="hidden h-6 w-px bg-[#dfd9cc] sm:block" />
              <button type="button" onClick={() => showNotice("Profile menu opened")} className="flex items-center gap-2 rounded-full pl-1 transition-colors hover:bg-[#eae5da]">
                <InitialsAvatar initials="NR" className="bg-[#2d5c62] text-[#f7f1e3]" />
                <span className="hidden text-left sm:block">
                  <span className="block text-[11px] font-bold leading-none text-[#334c51]">Nandita Rao</span>
                  <span className="mt-1 block text-[9px] text-[#89908e]">B.Tech · Bengaluru</span>
                </span>
                <ChevronDown className="mr-1 hidden h-3.5 w-3.5 text-[#8a9491] sm:block" />
              </button>
            </div>
            {notificationsOpen && (
              <div className="ra-soft absolute right-5 top-[59px] w-[290px] rounded-[13px] border border-[#ded6c7] bg-[#fbfaf6] p-3.5 shadow-[0_15px_38px_rgba(43,57,53,0.14)] sm:right-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-['Fraunces'] text-[16px] font-semibold">Recent attention</h3>
                  <button type="button" onClick={() => setNotificationsOpen(false)} className="rounded p-1 text-[#909792] hover:bg-[#efebe3]" aria-label="Close notifications"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="border-b border-[#ebe5d8] pb-3 text-[11px] leading-relaxed text-[#707b79]">You have 3 new signals from your academic commons.</p>
                <button type="button" onClick={() => { setNotificationsOpen(false); showNotice("All attention marked as read"); }} className="mt-3 text-[10px] font-bold text-[#2c6366] hover:underline">Mark all as read</button>
              </div>
            )}
          </header>

          <div className="mx-auto max-w-[1450px] px-5 pb-12 pt-7 sm:px-8 lg:px-11 lg:pt-9">
            <div className="ra-rise mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#89908e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#be902b]" /> Tuesday, 18 March 2025 <span className="text-[#b3afa6]">/</span> Bengaluru campus
                </div>
                <h1 className="font-['Fraunces'] text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#1d3641] sm:text-[40px]">Good morning, Nandita.</h1>
                <p className="mt-2 max-w-[570px] text-[13px] leading-relaxed text-[#687677]">Here is what is moving around your academic commons today — people, ideas, and a few next steps worth your attention.</p>
              </div>
              <button type="button" onClick={() => showNotice("Profile editor opened")} className="group flex w-fit items-center gap-2 rounded-[9px] border border-[#d9d1bf] bg-[#faf8f3] px-3.5 py-2.5 text-[11px] font-bold text-[#526466] transition-all hover:-translate-y-0.5 hover:border-[#bda05f] hover:text-[#275c61]">
                <Settings className="h-3.5 w-3.5 text-[#9b792f]" strokeWidth={1.8} /> Personalise dashboard <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <section className="ra-rise ra-delay-1 relative mb-7 overflow-hidden rounded-[17px] border border-[#294d53] bg-[#254d54] p-5 text-[#f7f1e5] shadow-[0_8px_24px_rgba(37,77,84,0.13)] sm:p-6 lg:p-7">
              <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[34px] border-[#c69a3b]/15" />
              <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full border border-[#e2c77e]/15" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-[630px]">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d9bc73]/40 bg-[#d9bc73]/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#e4c77d]"><Sparkles className="h-3 w-3" /> Your momentum, this week</div>
                  <h2 className="max-w-[530px] font-['Fraunces'] text-[25px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[29px]">Small signals are pointing in a promising direction.</h2>
                  <p className="mt-2.5 max-w-[570px] text-[12px] leading-[1.6] text-[#c9d5d0]">You have explored health AI, saved two researchers, and added one mentor. We found three people who can help make that interest more concrete.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => showNotice("Showing your people matches")} className="flex items-center gap-2 rounded-[8px] bg-[#e3bd63] px-3.5 py-2.5 text-[11px] font-bold text-[#29494d] transition-transform hover:-translate-y-0.5">Meet your matches <ArrowUpRight className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => showNotice("Path explorer opened")} className="rounded-[8px] border border-[#91b0a9]/50 px-3.5 py-2.5 text-[11px] font-bold text-[#e7eeea] transition-colors hover:bg-[#3b6468]">Explore a path</button>
                  </div>
                </div>
                <div className="w-full max-w-[272px] rounded-[13px] border border-[#82a29d]/25 bg-[#173f47]/55 p-4 lg:mr-4">
                  <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-semibold text-[#d6e0db]">Profile clarity</span><span className="font-mono text-[12px] font-bold text-[#e4c77d]">72%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#6f9690]/25"><div className="h-full w-[72%] rounded-full bg-[#d4ac50]" /></div>
                  <p className="mt-3 text-[10px] leading-relaxed text-[#a9c1ba]">Add one line about the kind of work you want to learn next.</p>
                  <button type="button" onClick={() => showNotice("Profile editor opened")} className="mt-3 text-[10px] font-bold text-[#e3c477] hover:underline">Complete profile <ChevronRight className="inline h-3 w-3" /></button>
                </div>
              </div>
            </section>

            <div className="mb-8 grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.8fr)]">
              <section className="ra-rise ra-delay-2 min-w-0">
                <SectionHeading eyebrow="Curated for your focus" title="People worth knowing" action="Open directory" onAction={() => selectNav("Directory")} />
                <div className="mb-4 flex items-center gap-1 border-b border-[#e1dbce]">
                  {(["People", "Paths"] as const).map((tab) => (
                    <button type="button" key={tab} onClick={() => setActiveRecommendationTab(tab)} className={`relative px-3 pb-2.5 pt-1 text-[11px] font-bold transition-colors ${activeRecommendationTab === tab ? "text-[#285c61]" : "text-[#909794] hover:text-[#526466]"}`}>
                      {tab === "People" ? "People" : "Learning paths"} {tab === "People" && <span className="ml-1 rounded-full bg-[#e6d9b8] px-1.5 py-0.5 font-mono text-[8px] text-[#8a671e]">3</span>}
                      {activeRecommendationTab === tab && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#bd902d]" />}
                    </button>
                  ))}
                </div>
                {activeRecommendationTab === "People" ? (
                  <div className="space-y-2.5">
                    {visibleRecommendations.length ? visibleRecommendations.map((person) => (
                      <article key={person.id} className="group flex flex-col gap-4 rounded-[13px] border border-[#e1dbcf] bg-[#fbfaf6] p-4 transition-all hover:-translate-y-0.5 hover:border-[#cdb87e] hover:shadow-[0_8px_20px_rgba(58,63,51,0.07)] sm:flex-row sm:items-center">
                        <InitialsAvatar initials={person.initials} className={`h-11 w-11 text-[12px] ${person.accent}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[13px] font-bold text-[#29464d]">{person.name}</h3>
                            <span className="rounded-full bg-[#edf0eb] px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-[#647b74]">{person.tag}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#6e7b7a]">{person.role}</p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-[#919792]"><MapPin className="h-3 w-3" /> {person.campus}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[#eee9de] pt-3 sm:w-[190px] sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                          <div className="min-w-0">
                            <p className="text-[10px] leading-[1.35] text-[#6c7776]">{person.reason}</p>
                            <p className="mt-1 font-mono text-[9px] font-bold text-[#a17a2a]">{person.signal}</p>
                          </div>
                          <button type="button" onClick={() => toggleSaved(person.id, person.name)} className={`rounded-[7px] border p-2 transition-colors ${saved.includes(person.id) ? "border-[#ceb87c] bg-[#f5eddb] text-[#916c1e]" : "border-[#ded9ce] text-[#87918e] hover:border-[#bda15b] hover:text-[#9b7422]"}`} aria-label={saved.includes(person.id) ? `Remove ${person.name} from saved` : `Save ${person.name}`}>
                            {saved.includes(person.id) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </article>
                    )) : (
                      <div className="rounded-[13px] border border-dashed border-[#d8d1c3] bg-[#faf8f3] p-8 text-center">
                        <Users className="mx-auto h-6 w-6 text-[#b39b62]" />
                        <p className="mt-2 text-[12px] font-bold text-[#4c6466]">Your shortlist is clear</p>
                        <button type="button" onClick={() => setDismissed([])} className="mt-2 text-[11px] font-bold text-[#2f6669] hover:underline">Restore recommendations</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      ["Health AI in practice", "4 people · 3 resources", "A guided route from methods to applied projects"],
                      ["Build with a research lab", "6 people · 2 open calls", "Find a lab, a question, and a way in"],
                    ].map(([title, meta, desc]) => (
                      <button type="button" key={title} onClick={() => showNotice(`${title} path opened`)} className="rounded-[13px] border border-[#e1dbcf] bg-[#fbfaf6] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#cdb87e]">
                        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#e9dfc8] text-[#957125]"><Compass className="h-4 w-4" /></div>
                        <h3 className="text-[13px] font-bold text-[#29464d]">{title}</h3>
                        <p className="mt-1 text-[10px] font-semibold text-[#9c7625]">{meta}</p>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#737e7b]">{desc}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#2f6669]">View path <ArrowUpRight className="h-3 w-3" /></span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="ra-rise ra-delay-3 rounded-[15px] border border-[#e1dbcf] bg-[#fbfaf6] p-5 shadow-[0_4px_14px_rgba(60,68,57,0.025)]">
                <SectionHeading eyebrow="A good next conversation" title="Mentorship office hours" action="See all" onAction={() => selectNav("Mentorship")} />
                <div className="rounded-[11px] border border-[#e2d8c3] bg-[#f3ead8] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#9a711f]">Recommended match</span>
                      <h3 className="mt-2 text-[14px] font-bold text-[#31545a]">Ravi Menon</h3>
                      <p className="mt-1 text-[11px] text-[#746e61]">Product strategy · Health technology</p>
                    </div>
                    <InitialsAvatar initials="RM" className="bg-[#e2c993] text-[#805d1d]" />
                  </div>
                  <div className="my-4 h-px bg-[#dfcfaf]" />
                  <div className="flex items-center gap-2 text-[10px] text-[#716e64]"><CalendarDays className="h-3.5 w-3.5 text-[#a67b25]" /> Thu, 20 March · 7:00 PM IST</div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[#716e64]"><MessageCircle className="h-3.5 w-3.5 text-[#a67b25]" /> 30-minute career conversation</div>
                  <button type="button" onClick={() => showNotice("Opening Ravi's mentorship conversation")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#2f6265] py-2.5 text-[11px] font-bold text-[#f8f3e8] transition-colors hover:bg-[#224e52]">Open conversation <ArrowUpRight className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" onClick={() => selectNav("Mentorship")} className="mt-4 flex w-full items-center justify-between border-t border-[#eee8dc] pt-4 text-left">
                  <span><span className="block text-[11px] font-bold text-[#425b5e]">You have 2 more open requests</span><span className="mt-1 block text-[10px] text-[#929893]">Find the right guide for your next step</span></span>
                  <ChevronRight className="h-4 w-4 text-[#9b7529]" />
                </button>
              </section>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-7 lg:grid-cols-[1fr_1.06fr]">
              <section className="ra-rise ra-delay-2">
                <SectionHeading eyebrow="Build across Amrita" title="Cross-campus pulse" action="Explore campuses" onAction={() => showNotice("Cross-campus explorer opened")} />
                <div className="rounded-[15px] border border-[#e1dbcf] bg-[#fbfaf6] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-[#3c595d]">Where your interests are active</p>
                      <p className="mt-1 text-[10px] text-[#929893]">Based on your recent focus areas</p>
                    </div>
                    <span className="rounded-full bg-[#e9f0ec] px-2 py-1 font-mono text-[9px] font-bold text-[#4e7c6b]">Live signal</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["Bengaluru", "Health AI · Product", "34 people", "w-[84%]", "bg-[#4b7b75]"],
                      ["Amritapuri", "Computational biology", "21 people", "w-[62%]", "bg-[#c39737]"],
                      ["Coimbatore", "Human-centred systems", "14 people", "w-[43%]", "bg-[#806696]"],
                    ].map(([campus, focus, people, width, bar]) => (
                      <button type="button" key={campus} onClick={() => showNotice(`${campus} campus directory opened`)} className="group block w-full text-left">
                        <div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-bold text-[#4a6062]">{campus}</span><span className="font-mono text-[9px] text-[#9a9f98]">{people}</span></div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-[#ece8df]"><div className={`h-full rounded-full ${bar} transition-all duration-500 group-hover:brightness-110 ${width}`} /></div>
                        <p className="mt-1.5 text-[10px] text-[#8b928e]">{focus}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t border-[#eee8dc] pt-4 text-[10px] text-[#878f8b]"><Network className="h-3.5 w-3.5 text-[#a27a2b]" /> 4 campuses · 69 relevant connections <button type="button" onClick={() => showNotice("Viewing all campuses")} className="ml-auto font-bold text-[#2d6467] hover:underline">View network</button></div>
                </div>
              </section>

              <section className="ra-rise ra-delay-3">
                <SectionHeading eyebrow="Your trajectory" title="Research & career momentum" action="Open progress" onAction={() => showNotice("Momentum view opened")} />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-[15px] border border-[#e1dbcf] bg-[#fbfaf6] p-5">
                    <div className="flex items-start justify-between"><div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#e2eee8] text-[#397269]"><BookOpen className="h-4 w-4" /></div><button type="button" onClick={() => showNotice("Research bookmarks opened")} aria-label="Open research bookmarks" className="rounded p-1 text-[#939a96] hover:bg-[#eeebe4]"><MoreHorizontal className="h-4 w-4" /></button></div>
                    <p className="mt-5 font-['Fraunces'] text-[27px] font-semibold tracking-[-0.04em] text-[#294e54]">06</p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#506a6b]">research threads saved</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-[#818c88]"><span className="h-1.5 w-1.5 rounded-full bg-[#5f8c7e]" /> 2 active this week</div>
                  </div>
                  <div className="rounded-[15px] border border-[#e1dbcf] bg-[#fbfaf6] p-5">
                    <div className="flex items-start justify-between"><div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f2e8d1] text-[#9c7427]"><Target className="h-4 w-4" /></div><button type="button" onClick={() => showNotice("Opportunity matches opened")} aria-label="Open opportunity matches" className="rounded p-1 text-[#939a96] hover:bg-[#eeebe4]"><MoreHorizontal className="h-4 w-4" /></button></div>
                    <p className="mt-5 font-['Fraunces'] text-[27px] font-semibold tracking-[-0.04em] text-[#294e54]">08</p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#506a6b]">opportunities matched</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-[#818c88]"><span className="h-1.5 w-1.5 rounded-full bg-[#c39638]" /> 3 close this month</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="ra-rise ra-delay-3">
                <SectionHeading eyebrow="Make room in your calendar" title="Upcoming in your commons" action={showAllEvents ? "Show fewer" : "See all events"} onAction={() => setShowAllEvents((open) => !open)} />
                <div className="space-y-2.5">
                  {(showAllEvents ? events : events.slice(0, 2)).map((event) => {
                    const isJoined = joined.includes(event.title);
                    return (
                      <article key={event.title} className="group flex items-center gap-3 rounded-[13px] border border-[#e1dbcf] bg-[#fbfaf6] p-3.5 transition-all hover:border-[#cdb87e] sm:gap-4">
                        <div className={`grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[10px] ${event.color}`}><span className="font-['Fraunces'] text-[20px] font-semibold leading-none">{event.date}</span><span className="mt-0.5 font-mono text-[8px] font-bold tracking-[0.12em]">{event.month}</span></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-[#35555a]">{event.title}</p>
                          <p className="mt-1 text-[10px] text-[#8a928e]">{event.type} <span className="mx-1 text-[#c7c1b5]">·</span> {event.time} <span className="mx-1 hidden text-[#c7c1b5] sm:inline">·</span> <span className="hidden sm:inline">{event.place}</span></p>
                        </div>
                        <button type="button" onClick={() => { setJoined((current) => isJoined ? current.filter((item) => item !== event.title) : [...current, event.title]); showNotice(isJoined ? "Removed from calendar" : "Added to your calendar"); }} className={`shrink-0 rounded-[7px] border px-2.5 py-2 text-[10px] font-bold transition-colors ${isJoined ? "border-[#b8d0c4] bg-[#e8f0ea] text-[#477566]" : "border-[#ded9ce] text-[#6b7a78] hover:border-[#bda05b] hover:text-[#906d21]"}`}>{isJoined ? "Added" : "Save"}</button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="ra-rise ra-delay-4 rounded-[15px] border border-[#e1dbcf] bg-[#fbfaf6] p-5">
                <SectionHeading eyebrow="Since your last visit" title="Recent attention" action="Clear all" onAction={() => showNotice("Recent attention cleared")} />
                <div className="space-y-1">
                  {activityItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button type="button" key={item.title} onClick={() => showNotice(`${item.title} opened`)} className="group flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition-colors hover:bg-[#f2eee6]">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.color}`}><Icon className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-[#456064]">{item.title}</span><span className="mt-0.5 block truncate text-[10px] text-[#929995]">{item.detail}</span></span>
                        <span className="font-mono text-[9px] text-[#a1a69f]">{item.time}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-[10px] bg-[#f2eee5] p-3">
                  <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-[#a17825]" /><span className="text-[10px] font-bold text-[#5a6c6b]">One useful prompt</span></div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-[#818984]">What kind of project would you be proud to explain a year from now?</p>
                  <button type="button" onClick={() => showNotice("Prompt saved to your profile")} className="mt-2 text-[10px] font-bold text-[#2f6669] hover:underline">Add an answer <ChevronRight className="inline h-3 w-3" /></button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {notice && <div role="status" className="ra-soft fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#315f62] bg-[#244f55] px-4 py-2.5 text-[11px] font-semibold text-[#f5f0e4] shadow-[0_10px_28px_rgba(28,58,61,0.2)]"><Check className="h-3.5 w-3.5 text-[#d9b65e]" /> {notice}</div>}
    </div>
  );
}