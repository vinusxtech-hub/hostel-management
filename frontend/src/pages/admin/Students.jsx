import { useState, useEffect } from "react";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Search, MapPin, Plus } from "lucide-react";

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: "", room: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const fetchStudents = async () => {
    try {
      const data = await api.admin.getStudents();
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentData.name || !newStudentData.room) {
      error("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.admin.addStudent(newStudentData);
      success("Student added successfully");
      setShowModal(false);
      setNewStudentData({ name: "", room: "" });
      fetchStudents();
    } catch (err) {
      error("Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.room.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "inside" && s.status === "Inside") ||
                         (filter === "outside" && s.status === "Outside");
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Students</h1>
            <p className="text-slate-600 mt-1">View and manage all hostel students</p>
          </div>
          <Button size="lg" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
              <Input 
                placeholder="Search by name or room number..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["all", "inside", "outside"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "primary" : "secondary"}
                  onClick={() => setFilter(f)}
                  size="sm"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Students Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Room</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Attendance</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-600">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">{student.name}</td>
                      <td className="py-4 px-4 text-slate-600">{student.room}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: student.attendanceRate }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{student.attendanceRate}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          student.status === "Inside"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          <MapPin className="w-4 h-4" />
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="secondary" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Total Students", value: students.length },
            { label: "Inside Hostel", value: students.filter(s => s.status === "Inside").length },
            { label: "Outside Hostel", value: students.filter(s => s.status === "Outside").length }
          ].map((stat, idx) => (
            <Card key={idx}>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Add Student Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <h2 className="text-2xl font-bold">Add New Student</h2>
            <Input
              label="Full Name"
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Room Number"
              value={newStudentData.room}
              onChange={(e) => setNewStudentData({...newStudentData, room: e.target.value})}
              placeholder="e.g. A-101"
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
};
