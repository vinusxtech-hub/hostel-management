import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Megaphone, Plus, Edit2, Trash2, Pin, PinOff, Search, AlertTriangle, Info, Wrench, PartyPopper, GraduationCap, Calendar, Clock } from "lucide-react";

const CATEGORIES = ["General", "Maintenance", "Event", "Emergency", "Academic"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const FILTER_CATS = ["All", ...CATEGORIES];

const PRIORITY_CONFIG = {
  Low: { color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  Medium: { color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  High: { color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  Urgent: { color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" }
};
const CATEGORY_ICONS = { General: Info, Maintenance: Wrench, Event: PartyPopper, Emergency: AlertTriangle, Academic: GraduationCap };
const CATEGORY_COLORS = {
  General: "text-slate-700 bg-slate-100", Maintenance: "text-orange-700 bg-orange-100",
  Event: "text-purple-700 bg-purple-100", Emergency: "text-red-700 bg-red-100", Academic: "text-indigo-700 bg-indigo-100"
};

const EMPTY_FORM = { title: "", content: "", category: "General", priority: "Medium", isPinned: false, expiresAt: "" };

export const WardenNotices = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { success, error } = useToast();

  const fetchNotices = async () => {
    try { setNotices(await api.warden.getNotices()); }
    catch (err) { console.error("Failed to fetch notices:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const openCreate = () => { setEditingNotice(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (n) => {
    setEditingNotice(n);
    setForm({ title: n.title, content: n.content, category: n.category, priority: n.priority, isPinned: n.isPinned, expiresAt: n.expiresAt ? new Date(n.expiresAt).toISOString().split("T")[0] : "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { error("Title and content are required"); return; }
    setIsSaving(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (editingNotice) {
        const updated = await api.warden.updateNotice(editingNotice.id, payload);
        setNotices((prev) => prev.map((n) => (n.id === editingNotice.id ? updated : n)));
        success("Notice updated successfully");
      } else {
        const created = await api.warden.createNotice(payload);
        setNotices((prev) => [created, ...prev]);
        success("Notice created successfully");
      }
      setShowModal(false);
    } catch (err) { error(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.warden.deleteNotice(deleteTarget.id);
      setNotices((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      success("Notice deleted");
    } catch (err) { error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filtered = notices.filter((n) => {
    const matchCat = filterCat === "All" || n.category === filterCat;
    const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (isLoading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/25">
              <Megaphone className="w-7 h-7" />
            </div>
            Manage Notices
          </h1>
          <p className="text-slate-600 mt-2">Create, edit and manage hostel announcements</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Create Notice</Button>
      </div>

      {/* Search & Filters */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search notices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {FILTER_CATS.map((cat) => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === cat ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>
          ))}
        </div>
      </Card>

      {/* Notices Grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notices found</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((notice) => {
            const p = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Medium;
            const CatIcon = CATEGORY_ICONS[notice.category] || Info;
            const catColor = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.General;
            return (
              <Card key={notice.id} className="relative group hover:shadow-lg transition-shadow duration-300">
                {notice.isExpired && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-md">Expired</div>
                )}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {notice.isPinned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold"><Pin className="w-3 h-3" />Pinned</span>}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${catColor}`}><CatIcon className="w-3 h-3" />{notice.category}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${p.bg} ${p.color}`}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{notice.priority}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">{notice.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">{notice.content}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(notice.createdAt).toLocaleDateString()}</span>
                    {notice.expiresAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Expires {new Date(notice.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(notice)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(notice)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingNotice ? "Edit Notice" : "Create Notice"} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter notice title"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write notice content..." rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (optional)</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-6 rounded-full transition-colors ${form.isPinned ? "bg-primary-600" : "bg-slate-300"}`} onClick={() => setForm({ ...form, isPinned: !form.isPinned })}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPinned ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">{form.isPinned ? <Pin className="w-4 h-4 text-primary-600" /> : <PinOff className="w-4 h-4 text-slate-400" />}Pin this notice</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSaving} className="flex-1">{editingNotice ? "Update Notice" : "Publish Notice"}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Notice">
        <p className="text-slate-600 mb-2">Are you sure you want to delete this notice?</p>
        <p className="text-sm font-semibold text-slate-900 mb-6">"{deleteTarget?.title}"</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};
