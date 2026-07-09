import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  Download,
  Loader2,
  Upload,
  Paperclip,
} from "lucide-react";
import Layout from "../components/Layout";
import CertificateModal from "../components/CertificateModal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function MemberDetail({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchMember = async () => {
    setLoading(true);
    try {
      const [memberRes, tiersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/members/${id}`, getAuthHeader()),
        axios.get("http://localhost:5000/api/members/tiers", getAuthHeader()),
      ]);
      setMember(memberRes.data);
      setTiers(tiersRes.data);
    } catch (error) {
      if (error.response?.status === 403) return onLogout();
      if (error.response?.status === 404) {
        toast.error("Member not found");
        navigate("/");
        return;
      }
      toast.error("Failed to load member");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (field, value) => {
    setMember((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `http://localhost:5000/api/members/${id}`,
        {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          tierId: member.tierId,
          endDate: member.endDate?.slice(0, 10),
          status: member.status,
        },
        getAuthHeader(),
      );
      toast.success("Member updated!");
      fetchMember();
    } catch (error) {
      toast.error("Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/members/${id}`,
        getAuthHeader(),
      );
      toast.success("Member deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete member");
      setDeleting(false);
      setConfirmDeleteMember(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", uploadFile);
    if (uploadName.trim()) data.append("name", uploadName.trim());

    try {
      await axios.post(
        `http://localhost:5000/api/members/${id}/documents`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success("Document uploaded!");
      setUploadFile(null);
      setUploadName("");
      fetchMember();
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    setDeletingDocId(docId);
    try {
      await axios.delete(
        `http://localhost:5000/api/members/${id}/documents/${docId}`,
        getAuthHeader(),
      );
      toast.success("Document deleted");
      fetchMember();
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setDeletingDocId(null);
      setConfirmDeleteDocId(null);
    }
  };

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading member...
        </div>
      </Layout>
    );
  }

  if (!member) return null;

  return (
    <Layout onLogout={onLogout}>
      <Toaster position="top-right" />

      {/* Back link */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Member</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  First Name
                </label>
                <input
                  className="w-full p-3 border rounded-lg"
                  value={member.firstName || ""}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Last Name
                </label>
                <input
                  className="w-full p-3 border rounded-lg"
                  value={member.lastName || ""}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                Email Address
              </label>
              <input
                className="w-full p-3 border rounded-lg"
                type="email"
                value={member.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Tier
                </label>
                <select
                  className="w-full p-3 border rounded-lg bg-white"
                  value={member.tierId || ""}
                  onChange={(e) => handleChange("tierId", e.target.value)}
                >
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Membership Expiry Date
                </label>
                <input
                  className="w-full p-3 border rounded-lg"
                  type="date"
                  value={member.endDate ? member.endDate.slice(0, 10) : ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                Status{" "}
                <span className="text-gray-400 font-normal">
                  (usually set automatically by the renewal cron job)
                </span>
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={member.status || "ACTIVE"}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="EXPIRING">Expiring</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteMember(true)}
                className="text-red-600 hover:bg-red-50 font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 ml-auto"
              >
                <Trash2 size={18} /> Delete Member
              </button>
            </div>
          </form>
        </div>

        {/* Right: Summary card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mb-4">
            {member.firstName?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-sm text-gray-500 mb-4">{member.email}</p>

          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-6 ${
              member.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : member.status === "EXPIRING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {member.status}
          </span>

          <div className="space-y-3">
            <button
              onClick={() => setShowCertModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg border border-gray-200 transition-colors"
            >
              <Download size={16} /> Generate Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Document Storage panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Documents</h2>

        {member.documents?.length > 0 ? (
          <ul className="divide-y divide-gray-100 mb-6">
            {member.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-3"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <Paperclip size={16} /> {doc.name}
                </a>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setConfirmDeleteDocId(doc.id)}
                    disabled={deletingDocId === doc.id}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 mb-6">
            No documents uploaded yet.
          </p>
        )}

        <form
          onSubmit={handleUploadDocument}
          className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-gray-100"
        >
          <input
            className="p-2.5 border rounded-lg text-sm flex-1 min-w-0"
            placeholder="Document name (optional)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
          />
          <input
            className="p-2 border rounded-lg text-sm flex-1 min-w-0"
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
          />
          <button
            type="submit"
            disabled={!uploadFile || uploading}
            className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 w-full sm:w-auto"
          >
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {showCertModal && (
        <CertificateModal
          member={member}
          onClose={() => setShowCertModal(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteMember}
        title="Delete this member?"
        message={`Are you sure you want to delete ${member.firstName} ${member.lastName}? This can't be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteMember(false)}
      />

      <ConfirmDialog
        open={!!confirmDeleteDocId}
        title="Delete this document?"
        message="This can't be undone."
        loading={deletingDocId === confirmDeleteDocId}
        onConfirm={() => handleDeleteDocument(confirmDeleteDocId)}
        onCancel={() => setConfirmDeleteDocId(null)}
      />
    </Layout>
  );
}