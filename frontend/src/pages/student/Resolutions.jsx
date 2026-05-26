import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";

export const Resolutions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [resolutions, setResolutions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const { success, error } = useToast();

  useEffect(() => {
    fetchResolutions();
    const loadSettings = async () => {
      try {
        const data = await api.student.getSettings();
        setCategories(data.resolutionCategories || []);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const fetchResolutions = async () => {
    try {
      const data = await api.student.getResolutions();
      setResolutions(data);
    } catch (err) {
      error("Failed to load resolutions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.description) {
      error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const newResolution = await api.student.submitResolution(formData);
      setResolutions([newResolution, ...resolutions]);
      setFormData({ category: "", description: "" });
      setShowModal(false);
      success("Resolution submitted successfully!");
    } catch (err) {
      error("Failed to submit resolution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "In Progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "Resolved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const filteredResolutions = resolutions.filter(r => filter === "All" || r.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resolutions</h1>
          <p className="text-slate-600 mt-1">Submit and track your hostel resolutions</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <Button onClick={() => setShowModal(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Resolutions List */}
      <div className="space-y-4">
        {filteredResolutions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No resolutions found</p>
            </div>
          </Card>
        ) : (
          filteredResolutions.map((resolution) => (
            <Card key={resolution.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{resolution.category}</h3>
                  <p className="text-sm text-slate-600 mt-1">{resolution.date}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(resolution.status)}`}>
                  {getStatusIcon(resolution.status)}
                  <span className="text-sm font-medium">{resolution.status}</span>
                </div>
              </div>
              <p className="text-slate-700 mb-4">{resolution.description}</p>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold">New Resolution</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 resize-vertical min-h-[100px]"
              placeholder="Describe your issue in detail..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Resolution'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
