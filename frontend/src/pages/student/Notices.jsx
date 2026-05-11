import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Megaphone, Search, Pin, ChevronDown, ChevronUp, Calendar, Tag, AlertTriangle, Info, Wrench, PartyPopper, GraduationCap, Bell } from "lucide-react";

const CATEGORIES = ["All", "General", "Maintenance", "Event", "Emergency", "Academic"];
const PRIORITY_CONFIG = {
  Low: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-l-emerald-500", dot: "bg-emerald-500" },
  Medium: { color: "text-blue-700", bg: "bg-blue-50", border: "border-l-blue-500", dot: "bg-blue-500" },
  High: { color: "text-amber-700", bg: "bg-amber-50", border: "border-l-amber-500", dot: "bg-amber-500" },
  Urgent: { color: "text-red-700", bg: "bg-red-50", border: "border-l-red-500", dot: "bg-red-500" }
};
const CATEGORY_ICONS = { General: Info, Maintenance: Wrench, Event: PartyPopper, Emergency: AlertTriangle, Academic: GraduationCap };
const CATEGORY_COLORS = {
  General: "text-slate-700 bg-slate-100", Maintenance: "text-orange-700 bg-orange-100",
  Event: "text-purple-700 bg-purple-100", Emergency: "text-red-700 bg-red-100", Academic: "text-indigo-700 bg-indigo-100"
};

const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      try { setNotices(await api.student.getNotices()); }
      catch (err) { console.error("Failed to fetch notices:", err); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const toggleExpand = (id) => setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = notices.filter((n) => {
    const matchCat = activeCategory === "All" || n.category === activeCategory;
    const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (isLoading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="animate-slide-in-down">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl shadow-lg shadow-primary-500/30">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tight">Notice Board</h1>
            <p className="text-slate-600 mt-1 text-lg">Stay updated with the latest hostel announcements</p>
          </div>
        </div>
      </div>

      {/* Search & Category */}
      <div className="animate-slide-in-up" style={{ animationDelay: "100ms" }}>
        <Card className="!p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search notices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all" id="notice-search" />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeCategory === cat ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20" : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70"}`}
                id={`filter-${cat.toLowerCase()}`}>{cat}</button>
            ))}
          </div>
        </Card>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-slate-500 animate-slide-in-up" style={{ animationDelay: "150ms" }}>
        <Bell className="w-4 h-4" /><span>{filtered.length} {filtered.length === 1 ? "notice" : "notices"}{activeCategory !== "All" && ` in ${activeCategory}`}</span>
      </div>

      {/* Notices */}
      {filtered.length === 0 ? (
        <div className="animate-slide-in-up" style={{ animationDelay: "200ms" }}>
          <Card className="text-center py-16">
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4"><Megaphone className="w-8 h-8 text-slate-400" /></div>
            <p className="text-slate-600 font-medium text-lg">No notices found</p>
            <p className="text-slate-400 text-sm mt-1">{searchQuery ? "Try a different search term" : "Check back later for updates"}</p>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((notice, index) => {
            const p = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Medium;
            const CatIcon = CATEGORY_ICONS[notice.category] || Info;
            const catColor = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.General;
            const isExpanded = expandedIds.has(notice.id);
            const isLong = notice.content.length > 150;
            return (
              <div key={notice.id} className="animate-slide-in-up" style={{ animationDelay: `${200 + index * 60}ms` }}>
                <Card className={`!p-0 border-l-4 ${p.border} cursor-pointer group`} onClick={() => toggleExpand(notice.id)}>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {notice.isPinned && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold"><Pin className="w-3 h-3" />Pinned</span>}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${catColor}`}><CatIcon className="w-3 h-3" />{notice.category}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${p.bg} ${p.color}`}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{notice.priority}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors mb-2">{notice.title}</h3>
                    <p className={`text-slate-600 text-sm leading-relaxed ${!isExpanded && isLong ? "line-clamp-2" : ""}`}>{notice.content}</p>
                    {isLong && (
                      <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors" onClick={(e) => { e.stopPropagation(); toggleExpand(notice.id); }}>
                        {isExpanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
                      </button>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/80">
                      <div className="flex items-center gap-2 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" /><span>{timeAgo(notice.createdAt)}</span></div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Tag className="w-3.5 h-3.5" /><span>by {notice.createdBy}</span></div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
