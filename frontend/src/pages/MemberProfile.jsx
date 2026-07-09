import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  LogOut,
  Download,
  Mail,
  Save,
  Users,
  Paperclip,
  Upload,
} from "lucide-react";

export default function MemberProfile({ onLogout }) {
  const [member, setMember] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/members/me",
        getAuthHeader(),
      );
      setMember(res.data);
      setEmail(res.data.email);
    } catch (error) {
      if (error.response?.status === 403) return onLogout();
      // 404 here means this login isn't linked to a Member profile yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `http://localhost:5000/api/members/${member.id}`,
        { email },
        getAuthHeader(),
      );
      setMember((prev) => ({ ...prev, email }));
      toast.success("Email updated!");
    } catch (error) {
      toast.error("Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    const loadingToast = toast.loading("Generating certificate...");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/members/${member.id}/certificate`,
        { ...getAuthHeader(), responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${member.firstName}-Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss(loadingToast);
      toast.success("Certificate downloaded!");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to download certificate.");
    } finally {
      setDownloading(false);
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
        `http://localhost:5000/api/members/${member.id}/documents`,
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
      fetchProfile();
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Users className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            MemberHub
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors"
        >
          <LogOut size={18} /> Log Out
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading...</div>
        ) : !member ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-600 font-medium">
              No membership profile is linked to this account yet.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Ask an administrator to make sure your member record uses the same
              email address as this login.
            </p>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {member.firstName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {member.firstName} {member.lastName}
                  </h1>
                  <span
                    className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : member.status === "EXPIRING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                <div>
                  <dt className="text-gray-400">Tier</dt>
                  <dd className="font-medium text-gray-800">
                    {member.tier?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Member Since</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(member.startDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Expires On</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(member.endDate).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Update email */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                Contact Email
              </h2>
              <form onSubmit={handleSaveEmail} className="flex gap-3">
                <input
                  className="flex-1 p-3 border rounded-lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={saving || email === member.email}
                  className="bg-blue-600 text-white font-medium px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </form>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Paperclip size={16} className="text-gray-400" />
                My Documents
              </h2>

              {member.documents?.length > 0 ? (
                <ul className="divide-y divide-gray-100 mb-4">
                  {member.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {doc.name}
                      </a>
                      <span className="text-xs text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mb-4">
                  No documents uploaded yet.
                </p>
              )}

              <form
                onSubmit={handleUploadDocument}
                className="flex flex-col sm:flex-row flex-wrap gap-3 pt-3 border-t border-gray-100"
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

            {/* Certificate */}
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl border border-gray-200 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              {downloading ? "Generating..." : "Download My Certificate"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}