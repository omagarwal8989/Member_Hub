// import { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import axios from "axios";
// import {
//   CheckCircle2,
//   XCircle,
//   Loader2,
//   Users,
//   Award,
//   Search,
//   ArrowLeft,
// } from "lucide-react";
// import { API_BASE_URL } from "../config.js";

// export default function VerifyCertificate() {
//   const { certificateId } = useParams();
//   const navigate = useNavigate();
//   const [inputValue, setInputValue] = useState("");
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(!!certificateId);

//   useEffect(() => {
//     if (!certificateId) {
//       setResult(null);
//       return;
//     }

//     const verify = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/certificates/verify/${certificateId}`,
//         );
//         setResult(res.data);
//       } catch (error) {
//         setResult({ valid: false });
//       } finally {
//         setLoading(false);
//       }
//     };
//     verify();
//   }, [certificateId]);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     const trimmed = inputValue.trim();
//     if (trimmed) navigate(`/verify/${trimmed}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
//       <Link to="/" className="flex items-center gap-2.5 mb-8">
//         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
//           <Users className="text-white" size={18} />
//         </div>
//         <span className="text-xl font-semibold text-slate-900">MemberHub</span>
//       </Link>

//       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md p-8">
//         {!certificateId ? (
//           // --- Search form mode (no ID in the URL yet) ---
//           <>
//             <h1 className="text-xl font-semibold text-slate-900 mb-1 text-center">
//               Verify a Certificate
//             </h1>
//             <p className="text-sm text-slate-500 mb-6 text-center">
//               Enter the Certificate ID printed on a MemberHub certificate to
//               confirm it's genuine.
//             </p>
//             <form onSubmit={handleSearch} className="space-y-3">
//               <input
//                 className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono"
//                 placeholder="e.g. 0099f11c-2fd9-49af-912b-2ad57573f671"
//                 value={inputValue}
//                 onChange={(e) => setInputValue(e.target.value)}
//                 required
//               />
//               <button
//                 type="submit"
//                 className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 <Search size={16} /> Verify Certificate
//               </button>
//             </form>
//           </>
//         ) : (
//           // --- Result mode (ID present, either typed or via QR/link) ---
//           <div className="text-center">
//             <button
//               onClick={() => navigate("/verify")}
//               className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4"
//             >
//               <ArrowLeft size={14} /> Check another certificate
//             </button>

//             {loading ? (
//               <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
//                 <Loader2 className="animate-spin" size={28} />
//                 <p className="text-sm">Verifying certificate...</p>
//               </div>
//             ) : result?.valid ? (
//               <>
//                 <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
//                   <CheckCircle2 className="text-emerald-600" size={32} />
//                 </div>
//                 <h1 className="text-xl font-semibold text-slate-900 mb-1">
//                   Certificate verified
//                 </h1>
//                 <p className="text-sm text-slate-500 mb-6">
//                   This is a genuine certificate issued by MemberHub.
//                 </p>

//                 <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3">
//                   <div>
//                     <p className="text-xs text-slate-400 uppercase tracking-wide">
//                       Member
//                     </p>
//                     <p className="font-medium text-slate-900">
//                       {result.memberName}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-slate-400 uppercase tracking-wide">
//                       Membership Tier
//                     </p>
//                     <p className="font-medium text-slate-900 flex items-center gap-1.5">
//                       <Award size={15} className="text-amber-600" />
//                       {result.tierName}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-slate-400 uppercase tracking-wide">
//                       Issued On
//                     </p>
//                     <p className="font-medium text-slate-900">
//                       {new Date(result.issuedAt).toLocaleDateString()}
//                     </p>
//                   </div>
//                   <div className="pt-2 border-t border-slate-200">
//                     <p className="text-xs text-slate-400 uppercase tracking-wide">
//                       Certificate ID
//                     </p>
//                     <p className="font-mono text-xs text-slate-500 break-all">
//                       {result.certificateId}
//                     </p>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
//                   <XCircle className="text-red-600" size={32} />
//                 </div>
//                 <h1 className="text-xl font-semibold text-slate-900 mb-1">
//                   Certificate not found
//                 </h1>
//                 <p className="text-sm text-slate-500">
//                   This certificate ID doesn't match any record in our system. It
//                   may be invalid or have been entered incorrectly.
//                 </p>
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }












import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Search,
  ArrowLeft,
  Dumbbell,
} from "lucide-react";
import { API_BASE_URL } from "../config.js";

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!certificateId);

  useEffect(() => {
    if (!certificateId) {
      setResult(null);
      return;
    }

    const verify = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/certificates/verify/${certificateId}`,
        );
        setResult(res.data);
      } catch (error) {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) navigate(`/verify/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Dumbbell className="text-white" size={18} />
        </div>
        <span
          className="text-lg text-white tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          MEMBERHUB
        </span>
      </Link>

      <div className="bg-surface-alt rounded-2xl shadow-2xl shadow-black/50 border border-border w-full max-w-md p-8">
        {!certificateId ? (
          // --- Search form mode ---
          <>
            {/* <h1 className="text-xl font-semibold text-white mb-1 text-center">
              Verify a Certificate
            </h1> */}
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-4"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h1 className="text-xl font-semibold text-white mb-1 text-center">
              Verify a Certificate
            </h1>
            <p className="text-sm text-neutral-400 mb-6 text-center">
              Enter the Certificate ID printed on a MemberHub certificate to
              confirm it's genuine.
            </p>
            <form onSubmit={handleSearch} className="space-y-3">
              <input
                className="w-full p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g. 0099f11c-2fd9-49af-912b-2ad57573f671"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Search size={16} /> Verify Certificate
              </button>
            </form>
          </>
        ) : (
          // --- Result mode ---
          <div className="text-center">
            <button
              onClick={() => navigate("/verify")}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-4"
            >
              <ArrowLeft size={14} /> Check another certificate
            </button>

            {loading ? (
              <div className="py-8 flex flex-col items-center gap-3 text-neutral-500">
                <Loader2 className="animate-spin" size={28} />
                <p className="text-sm">Verifying certificate...</p>
              </div>
            ) : result?.valid ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
                <h1 className="text-xl font-semibold text-white mb-1">
                  Certificate verified
                </h1>
                <p className="text-sm text-neutral-400 mb-6">
                  This is a genuine certificate issued by MemberHub.
                </p>

                <div className="bg-surface-hover rounded-xl p-5 text-left space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">
                      Member
                    </p>
                    <p className="font-medium text-white">
                      {result.memberName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">
                      Membership Tier
                    </p>
                    <p className="font-medium text-white flex items-center gap-1.5">
                      <Award size={15} className="text-amber-400" />
                      {result.tierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">
                      Issued On
                    </p>
                    <p className="font-medium text-white">
                      {new Date(result.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">
                      Certificate ID
                    </p>
                    <p className="font-mono text-xs text-neutral-400 break-all">
                      {result.certificateId}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="text-red-400" size={32} />
                </div>
                <h1 className="text-xl font-semibold text-white mb-1">
                  Certificate not found
                </h1>
                <p className="text-sm text-neutral-400">
                  This certificate ID doesn't match any record in our system. It
                  may be invalid or have been entered incorrectly.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}