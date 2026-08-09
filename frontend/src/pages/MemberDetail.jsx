// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   ArrowLeft,
//   Trash2,
//   Download,
//   Loader2,
//   Upload,
//   Paperclip,
//   Banknote,
//   Mail,
//   Tag,
//   CalendarClock,
//   CalendarCheck,
// } from "lucide-react";
// import Layout from "../components/Layout";
// import CertificateModal from "../components/CertificateModal";
// import AdminRenewalModal from "../components/AdminRenewalModal";
// import ConfirmDialog from "../components/ConfirmDialog";

// export default function MemberDetail({ onLogout }) {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [member, setMember] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [deleting, setDeleting] = useState(false);
//   const [showCertModal, setShowCertModal] = useState(false);
//   const [showAdminRenewalModal, setShowAdminRenewalModal] = useState(false);
//   const [uploadFile, setUploadFile] = useState(null);
//   const [uploadName, setUploadName] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const [deletingDocId, setDeletingDocId] = useState(null);
//   const [confirmDeleteMember, setConfirmDeleteMember] = useState(false);
//   const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   const fetchMember = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `http://localhost:5000/api/members/${id}`,
//         getAuthHeader(),
//       );
//       setMember(res.data);
//     } catch (error) {
//       if (error.response?.status === 403) return onLogout();
//       if (error.response?.status === 404) {
//         toast.error("Member not found");
//         navigate("/");
//         return;
//       }
//       toast.error("Failed to load member");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMember();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   const handleDelete = async () => {
//     setDeleting(true);
//     try {
//       await axios.delete(
//         `http://localhost:5000/api/members/${id}`,
//         getAuthHeader(),
//       );
//       toast.success("Member deleted");
//       navigate("/");
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to delete member");
//       setDeleting(false);
//       setConfirmDeleteMember(false);
//     }
//   };

//   const handleUploadDocument = async (e) => {
//     e.preventDefault();
//     if (!uploadFile) return;

//     setUploading(true);
//     const data = new FormData();
//     data.append("file", uploadFile);
//     if (uploadName.trim()) data.append("name", uploadName.trim());

//     try {
//       await axios.post(
//         `http://localhost:5000/api/members/${id}/documents`,
//         data,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "Content-Type": "multipart/form-data",
//           },
//         },
//       );
//       toast.success("Document uploaded!");
//       setUploadFile(null);
//       setUploadName("");
//       fetchMember();
//     } catch (error) {
//       toast.error("Failed to upload document");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDeleteDocument = async (docId) => {
//     setDeletingDocId(docId);
//     try {
//       await axios.delete(
//         `http://localhost:5000/api/members/${id}/documents/${docId}`,
//         getAuthHeader(),
//       );
//       toast.success("Document deleted");
//       fetchMember();
//     } catch (error) {
//       toast.error("Failed to delete document");
//     } finally {
//       setDeletingDocId(null);
//       setConfirmDeleteDocId(null);
//     }
//   };

//   if (loading) {
//     return (
//       <Layout onLogout={onLogout}>
//         <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
//           <Loader2 className="animate-spin" size={20} />
//           Loading member...
//         </div>
//       </Layout>
//     );
//   }

//   if (!member) return null;

//   const canDelete = member.status === "INACTIVE";
//   const latestPayment = member.payments?.[0];

//   return (
//     <Layout onLogout={onLogout}>
//       <Toaster position="top-right" />

//       <button
//         onClick={() => navigate("/")}
//         className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium"
//       >
//         <ArrowLeft size={16} /> Back to Directory
//       </button>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left: Read-only detail card */}
//         <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//           <div className="flex items-center gap-4 mb-6">
//             <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
//               {member.firstName?.charAt(0).toUpperCase()}
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-800">
//                 {member.firstName} {member.lastName}
//               </h2>
//               <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
//                 <Mail size={13} className="text-gray-400" />
//                 {member.email}
//               </p>
//             </div>
//           </div>

//           {/* <p className="text-xs text-gray-400 mb-4">
//             Name and email are locked once a member is created. If details
//             were entered incorrectly, delete this member once inactive and
//             re-add them with the correct information.
//           </p> */}

//           <dl className="grid grid-cols-2 gap-5 border-t border-gray-100 pt-5">
//             <div className="flex items-start gap-2.5">
//               <Tag size={16} className="text-gray-400 mt-0.5" />
//               <div>
//                 <dt className="text-xs text-gray-400">Tier</dt>
//                 <dd className="font-medium text-gray-800">
//                   {member.tier?.name}
//                 </dd>
//               </div>
//             </div>
//             <div className="flex items-start gap-2.5">
//               <CalendarClock size={16} className="text-gray-400 mt-0.5" />
//               <div>
//                 <dt className="text-xs text-gray-400">Member Since</dt>
//                 <dd className="font-medium text-gray-800">
//                   {new Date(member.startDate).toLocaleDateString()}
//                 </dd>
//               </div>
//             </div>
//             <div className="flex items-start gap-2.5">
//               <CalendarCheck size={16} className="text-gray-400 mt-0.5" />
//               <div>
//                 <dt className="text-xs text-gray-400">Expires On</dt>
//                 <dd className="font-medium text-gray-800">
//                   {new Date(member.endDate).toLocaleDateString()}
//                 </dd>
//               </div>
//             </div>
//             <div className="flex items-start gap-2.5">
//               <Banknote size={16} className="text-gray-400 mt-0.5" />
//               <div>
//                 <dt className="text-xs text-gray-400">Payment</dt>
//                 <dd className="font-medium text-gray-800">
//                   {latestPayment
//                     ? latestPayment.method === "ONLINE"
//                       ? "Website"
//                       : "Cash / Direct"
//                     : "—"}
//                 </dd>
//               </div>
//             </div>
//           </dl>

//           <div className="flex items-center pt-6 mt-2 border-t border-gray-100">
//             <button
//               type="button"
//               onClick={() => canDelete && setConfirmDeleteMember(true)}
//               disabled={!canDelete}
//               title={
//                 canDelete
//                   ? undefined
//                   : "Only inactive (lapsed) members can be deleted"
//               }
//               className="text-red-600 hover:bg-red-50 font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
//             >
//               <Trash2 size={18} /> Delete Member
//             </button>
//           </div>
//         </div>

//         {/* Right: Summary card + actions */}
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
//           <span
//             className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-6 ${
//               member.status === "ACTIVE"
//                 ? "bg-green-100 text-green-700"
//                 : member.status === "EXPIRING"
//                   ? "bg-amber-100 text-amber-700"
//                   : "bg-red-100 text-red-700"
//             }`}
//           >
//             {member.status}
//           </span>

//           <div className="space-y-3">
//             <button
//               onClick={() => setShowAdminRenewalModal(true)}
//               className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
//             >
//               <Banknote size={16} /> Renew (Paid Directly)
//             </button>
//             <button
//               onClick={() => setShowCertModal(true)}
//               className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg border border-gray-200 transition-colors"
//             >
//               <Download size={16} /> Generate Certificate
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Document Storage panel */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
//         <h2 className="text-lg font-bold text-gray-800 mb-4">Documents</h2>

//         {member.documents?.length > 0 ? (
//           <ul className="divide-y divide-gray-100 mb-6">
//             {member.documents.map((doc) => (
//               <li
//                 key={doc.id}
//                 className="flex items-center justify-between py-3"
//               >
//                 <a
//                   href={doc.url}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
//                 >
//                   <Paperclip size={16} /> {doc.name}
//                 </a>
//                 <div className="flex items-center gap-4">
//                   <span className="text-xs text-gray-400">
//                     {new Date(doc.uploadedAt).toLocaleDateString()}
//                   </span>
//                   <button
//                     onClick={() => setConfirmDeleteDocId(doc.id)}
//                     disabled={deletingDocId === doc.id}
//                     className="text-red-500 hover:text-red-700 disabled:opacity-50"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-sm text-gray-400 mb-6">
//             No documents uploaded yet.
//           </p>
//         )}

//         <form
//           onSubmit={handleUploadDocument}
//           className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-gray-100"
//         >
//           <input
//             className="p-2.5 border rounded-lg text-sm flex-1 min-w-0"
//             placeholder="Document name (optional)"
//             value={uploadName}
//             onChange={(e) => setUploadName(e.target.value)}
//           />
//           <input
//             className="p-2 border rounded-lg text-sm flex-1 min-w-0"
//             type="file"
//             onChange={(e) => setUploadFile(e.target.files[0])}
//           />
//           <button
//             type="submit"
//             disabled={!uploadFile || uploading}
//             className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 w-full sm:w-auto"
//           >
//             <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
//           </button>
//         </form>
//       </div>

//       {showCertModal && (
//         <CertificateModal
//           member={member}
//           onClose={() => setShowCertModal(false)}
//         />
//       )}

//       {showAdminRenewalModal && (
//         <AdminRenewalModal
//           member={member}
//           onClose={() => setShowAdminRenewalModal(false)}
//           onRenewed={fetchMember}
//         />
//       )}

//       <ConfirmDialog
//         open={confirmDeleteMember}
//         title="Delete this member?"
//         message={`Are you sure you want to delete ${member.firstName} ${member.lastName}? This can't be undone.`}
//         loading={deleting}
//         onConfirm={handleDelete}
//         onCancel={() => setConfirmDeleteMember(false)}
//       />

//       <ConfirmDialog
//         open={!!confirmDeleteDocId}
//         title="Delete this document?"
//         message="This can't be undone."
//         loading={deletingDocId === confirmDeleteDocId}
//         onConfirm={() => handleDeleteDocument(confirmDeleteDocId)}
//         onCancel={() => setConfirmDeleteDocId(null)}
//       />
//     </Layout>
//   );
// }











import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Trash2,
  Download,
  Loader2,
  Upload,
  Paperclip,
  Banknote,
  Mail,
  Tag,
  CalendarClock,
  CalendarCheck,
  Receipt,
} from "lucide-react";
import Layout from "../components/Layout";
import CertificateModal from "../components/CertificateModal";
import AdminRenewalModal from "../components/AdminRenewalModal";
import ConfirmDialog from "../components/ConfirmDialog";

import { API_BASE_URL } from "../config.js";


export default function MemberDetail({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showAdminRenewalModal, setShowAdminRenewalModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });



  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await axios.get(
        // `http://localhost:5000/api/members/${id}/payments`,
        `${API_BASE_URL}/api/members/${id}/payments`,
        getAuthHeader(),
      );
      setPayments(res.data);
    } catch (error) {
      // Fails silently — section just shows "no history"
    } finally {
      setLoadingPayments(false);
    }
  };




  const fetchMember = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        // `http://localhost:5000/api/members/${id}`,
        `${API_BASE_URL}/api/members/${id}`,
        getAuthHeader(),
      );
      setMember(res.data);
      fetchPayments();
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(
        // `http://localhost:5000/api/members/${id}`,
        `${API_BASE_URL}/api/members/${id}`,
        getAuthHeader(),
      );
      toast.success("Member deleted");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete member");
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
        // `http://localhost:5000/api/members/${id}/documents`,
        `${API_BASE_URL}/api/members/${id}/documents`,
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
        // `http://localhost:5000/api/members/${id}/documents/${docId}`,
        `${API_BASE_URL}/api/members/${id}/documents/${docId}`,
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
        <div className="flex items-center justify-center h-64 text-neutral-500 gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading member...
        </div>
      </Layout>
    );
  }

  if (!member) return null;

  const canDelete = member.status === "INACTIVE";
  const latestPayment = member.payments?.[0];

  return (
    <Layout onLogout={onLogout}>
      <Toaster position="top-right" />

      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-6 font-medium"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Read-only detail card */}
        <div className="lg:col-span-2 bg-surface-alt rounded-xl border border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-brand-600/15 flex items-center justify-center text-brand-500 font-bold text-xl shrink-0">
              {member.firstName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {member.firstName} {member.lastName}
              </h2>

              {/* <p className="text-sm text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Mail size={13} className="text-neutral-500" />
                {member.email}
              </p> */}
              <p className="text-sm text-neutral-400 flex items-center gap-1.5 mt-0.5 min-w-0">
                <Mail size={13} className="text-neutral-500 shrink-0" />
                <span className="break-all">{member.email}</span>
              </p>
            </div>
          </div>

          {/* <dl className="grid grid-cols-2 gap-5 border-t border-border pt-5"> */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-border pt-5">
            <div className="flex items-start gap-2.5">
              <Tag size={16} className="text-neutral-500 mt-0.5" />
              <div>
                <dt className="text-xs text-neutral-500">Tier</dt>
                <dd className="font-medium text-neutral-200">
                  {member.tier?.name}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarClock size={16} className="text-neutral-500 mt-0.5" />
              <div>
                <dt className="text-xs text-neutral-500">Member Since</dt>
                <dd className="font-medium text-neutral-200">
                  {new Date(member.startDate).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarCheck size={16} className="text-neutral-500 mt-0.5" />
              <div>
                <dt className="text-xs text-neutral-500">Expires On</dt>
                <dd className="font-medium text-neutral-200">
                  {new Date(member.endDate).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Banknote size={16} className="text-neutral-500 mt-0.5" />
              <div>
                <dt className="text-xs text-neutral-500">Payment</dt>
                <dd className="font-medium text-neutral-200">
                  {latestPayment
                    ? latestPayment.method === "ONLINE"
                      ? "Website"
                      : "Cash / Direct"
                    : "—"}
                </dd>
              </div>
            </div>
          </dl>

          <div className="flex items-center pt-6 mt-2 border-t border-border">
            <button
              type="button"
              onClick={() => canDelete && setConfirmDeleteMember(true)}
              disabled={!canDelete}
              title={
                canDelete
                  ? undefined
                  : "Only inactive (lapsed) members can be deleted"
              }
              className="text-red-400 hover:bg-red-500/10 font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <Trash2 size={18} /> Delete Member
            </button>
          </div>
        </div>

        {/* Right: Summary card + actions */}
        <div className="bg-surface-alt rounded-xl border border-border p-6 h-fit">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-6 ${
              member.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-400"
                : member.status === "EXPIRING"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}
          >
            {member.status}
          </span>

          <div className="space-y-3">
            <button
              onClick={() => setShowAdminRenewalModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              <Banknote size={16} /> Renew (Paid Directly)
            </button>
            <button
              onClick={() => setShowCertModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-surface-hover hover:bg-neutral-800 text-neutral-200 font-medium py-2.5 rounded-lg border border-border transition-colors"
            >
              <Download size={16} /> Generate Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Document Storage panel */}
      <div className="bg-surface-alt rounded-xl border border-border p-6 mt-6">
        <h2 className="text-lg font-bold text-white mb-4">Documents</h2>

        {member.documents?.length > 0 ? (
          <ul className="divide-y divide-border mb-6">
            {member.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-3"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-400"
                >
                  <Paperclip size={16} /> {doc.name}
                </a>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-neutral-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setConfirmDeleteDocId(doc.id)}
                    disabled={deletingDocId === doc.id}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500 mb-6">
            No documents uploaded yet.
          </p>
        )}

        <form
          onSubmit={handleUploadDocument}
          className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-border"
        >
          <input
            className="p-2.5 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Document name (optional)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
          />
          <input
            className="p-2 border border-border bg-surface-hover text-neutral-300 rounded-lg text-sm flex-1 min-w-0 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-brand-600 file:text-white file:text-xs"
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
          />
          <button
            type="submit"
            disabled={!uploadFile || uploading}
            className="bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 w-full sm:w-auto transition-colors"
          >
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Payment History */}
      <div className="bg-surface-alt rounded-xl border border-border p-6 mt-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-neutral-500" />
          Payment History
        </h2>

        {loadingPayments ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-neutral-500">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {p.tier?.name || "Membership"}
                  </p>
                  {/* <p className="text-xs text-neutral-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p> */}
                  <p className="text-xs text-neutral-500">
                    {p.periodStart && p.periodEnd
                      ? `${new Date(p.periodStart).toLocaleDateString()} – ${new Date(p.periodEnd).toLocaleDateString()}`
                      : "Dates not recorded"}
                  </p>
                </div>



                {/* <div className="text-right">
                  <p className="text-sm font-medium text-neutral-200">
                    ₹{p.amount}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5"> */}
                
                <div className="sm:text-right">
                  <p className="text-sm font-medium text-neutral-200">
                    ₹{p.amount}
                  </p>
                  <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                
                
                
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        p.method === "ONLINE"
                          ? "bg-brand-600/10 text-brand-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {p.method === "ONLINE" ? "Website" : "Cash / Direct"}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        p.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : p.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCertModal && (
        <CertificateModal
          member={member}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {showAdminRenewalModal && (
        <AdminRenewalModal
          member={member}
          onClose={() => setShowAdminRenewalModal(false)}
          onRenewed={fetchMember}
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