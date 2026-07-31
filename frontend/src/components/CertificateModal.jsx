// import { useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { X, Download, Award } from "lucide-react";

// const TEMPLATES = [
//   { key: "classic", label: "Classic Blue", color: "#2563eb" },
//   { key: "elegant", label: "Elegant Gold", color: "#b45309" },
//   { key: "modern", label: "Modern Black", color: "#111827" },
// ];

// export default function CertificateModal({ member, onClose }) {
//   const [message, setMessage] = useState(
//     `is an official ${member.tier?.name || "Gold"} Member`,
//   );
//   const [signatoryName, setSignatoryName] = useState("");
//   const [signatoryTitle, setSignatoryTitle] = useState("");
//   const [template, setTemplate] = useState("classic");
//   const [generating, setGenerating] = useState(false);

//   const handleGenerate = async (e) => {
//     e.preventDefault();
//     setGenerating(true);
//     const loadingToast = toast.loading("Generating certificate...");

//     try {
//       const res = await axios.get(
//         `http://localhost:5000/api/members/${member.id}/certificate`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           params: { message, signatoryName, signatoryTitle, template },
//           responseType: "blob",
//         },
//       );

//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `${member.firstName}-Certificate.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();

//       toast.dismiss(loadingToast);
//       toast.success("Certificate downloaded!");
//       onClose();
//     } catch (error) {
//       toast.dismiss(loadingToast);
//       toast.error("Failed to generate certificate.");
//     } finally {
//       setGenerating(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//             <Award className="text-blue-600" size={24} />
//             Customize Certificate
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X />
//           </button>
//         </div>

//         <p className="text-sm text-gray-500 mb-6">
//           For {member.firstName} {member.lastName}
//         </p>

//         <form onSubmit={handleGenerate} className="space-y-5">
//           {/* Template picker */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-600">Style</label>
//             <div className="grid grid-cols-3 gap-3">
//               {TEMPLATES.map((t) => (
//                 <button
//                   type="button"
//                   key={t.key}
//                   onClick={() => setTemplate(t.key)}
//                   className={`p-3 rounded-lg border-2 text-xs font-medium transition-all ${
//                     template === t.key
//                       ? "border-blue-600 bg-blue-50"
//                       : "border-gray-200 hover:border-gray-300"
//                   }`}
//                 >
//                   <div
//                     className="w-full h-6 rounded mb-2"
//                     style={{ backgroundColor: t.color }}
//                   />
//                   {t.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Achievement message */}
//           <div className="space-y-1">
//             <label className="text-sm font-medium text-gray-600">
//               Achievement Text
//             </label>
//             <textarea
//               className="w-full p-3 border rounded-lg resize-none"
//               rows={2}
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//             />
//           </div>

//           {/* Signatory */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-600">
//                 Signatory Name{" "}
//                 <span className="text-gray-400 font-normal">(optional)</span>
//               </label>
//               <input
//                 className="w-full p-3 border rounded-lg"
//                 placeholder="e.g. Jane Smith"
//                 value={signatoryName}
//                 onChange={(e) => setSignatoryName(e.target.value)}
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-600">
//                 Signatory Title
//               </label>
//               <input
//                 className="w-full p-3 border rounded-lg"
//                 placeholder="e.g. Program Director"
//                 value={signatoryTitle}
//                 onChange={(e) => setSignatoryTitle(e.target.value)}
//               />
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={generating}
//             className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
//           >
//             {generating ? (
//               "Generating..."
//             ) : (
//               <>
//                 <Download size={18} /> Generate & Download
//               </>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }










import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Download, Award } from "lucide-react";

const TEMPLATES = [
  { key: "classic", label: "Classic Blue", color: "#2563eb" },
  { key: "elegant", label: "Elegant Gold", color: "#b45309" },
  { key: "modern", label: "Modern Black", color: "#111827" },
];

export default function CertificateModal({ member, onClose }) {
  const [message, setMessage] = useState(
    `is an official ${member.tier?.name || "Gold"} Member`,
  );
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [template, setTemplate] = useState("classic");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    const loadingToast = toast.loading("Generating certificate...");

    try {
      const res = await axios.get(
        // `http://localhost:5000/api/members/${member.id}/certificate`,
        `${API_BASE_URL}/api/members/${member.id}/certificate`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { message, signatoryName, signatoryTitle, template },
          responseType: "blob",
        },
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
      onClose();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate certificate.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-brand-500" size={24} />
            Customize Certificate
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white"
          >
            <X />
          </button>
        </div>

        <p className="text-sm text-neutral-400 mb-6">
          For {member.firstName} {member.lastName}
        </p>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Template picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={`p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                    template === t.key
                      ? "border-brand-600 bg-brand-600/10 text-white"
                      : "border-border hover:border-neutral-600 text-neutral-400"
                  }`}
                >
                  <div
                    className="w-full h-6 rounded mb-2"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Achievement message */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">
              Achievement Text
            </label>
            <textarea
              className="w-full p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-600"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Signatory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">
                Signatory Name{" "}
                <span className="text-neutral-500 font-normal">(optional)</span>
              </label>
              <input
                className="w-full p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g. Jane Smith"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">
                Signatory Title
              </label>
              <input
                className="w-full p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g. Program Director"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 transition-colors"
          >
            {generating ? (
              "Generating..."
            ) : (
              <>
                <Download size={18} /> Generate & Download
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}