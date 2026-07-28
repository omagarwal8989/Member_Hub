// import { useState, useEffect } from "react";
// import axios from "axios";
// import { X, Save } from "lucide-react";

// export default function MemberForm({ onCancel, onMemberAdded }) {
//   const [loading, setLoading] = useState(false);
//   const [tiers, setTiers] = useState([]);
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     tierId: "",
//     document: null,
//   });

//   useEffect(() => {
//     const fetchTiers = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/members/tiers", {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         // This endpoint returns ALL tiers (including retired ones) since
//         // Settings needs to manage/reactivate them. For enrolling a brand
//         // new member, though, only active plans should be selectable —
//         // retiring a plan is supposed to stop new signups onto it.
//         const activeTiers = res.data.filter((t) => t.isActive !== false);
//         setTiers(activeTiers);
//         // Default to the first available tier once loaded
//         if (activeTiers.length > 0) {
//           setFormData((prev) => ({ ...prev, tierId: activeTiers[0].id }));
//         }
//       } catch (err) {
//         console.error("Failed to load membership tiers:", err);
//       }
//     };
//     fetchTiers();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.tierId) {
//       alert("Please select a membership tier.");
//       return;
//     }

//     setLoading(true);
//     const data = new FormData();
//     Object.entries(formData).forEach(([key, val]) => data.append(key, val));

//     try {
//       await axios.post("http://localhost:5000/api/members", data, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       onMemberAdded();
//     } catch (err) {
//       console.error(err);
//       alert("Error adding member. Please check all fields.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-800">Add New Member</h2>
//           <button
//             onClick={onCancel}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X />
//           </button>
//         </div>

//         <p className="text-sm text-gray-500 -mt-2 mb-6">
//           Use this form only for members who paid you directly (cash, or a
//           personal online transfer). Their membership starts today and is marked
//           active immediately — the expiry date is set automatically from the
//           plan you choose below.
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <input
//               className="p-3 border rounded-lg w-full"
//               placeholder="First Name"
//               required
//               onChange={(e) =>
//                 setFormData({ ...formData, firstName: e.target.value })
//               }
//             />
//             <input
//               className="p-3 border rounded-lg w-full"
//               placeholder="Last Name"
//               required
//               onChange={(e) =>
//                 setFormData({ ...formData, lastName: e.target.value })
//               }
//             />
//           </div>

//           <input
//             className="w-full p-3 border rounded-lg"
//             type="email"
//             placeholder="Email Address"
//             required
//             onChange={(e) =>
//               setFormData({ ...formData, email: e.target.value })
//             }
//           />

//           <div className="space-y-1">
//             <label className="text-sm font-medium text-gray-600">
//               Membership Tier
//             </label>
//             <select
//               className="w-full p-3 border rounded-lg bg-white"
//               required
//               value={formData.tierId}
//               onChange={(e) =>
//                 setFormData({ ...formData, tierId: e.target.value })
//               }
//             >
//               <option value="" disabled>
//                 {tiers.length === 0 ? "Loading tiers..." : "Select a tier"}
//               </option>
//               {tiers.map((tier) => (
//                 <option key={tier.id} value={tier.id}>
//                   {tier.name} — {tier.durationDays} days
//                 </option>
//               ))}
//             </select>
//             <p className="text-xs text-gray-400 pt-1">
//               Membership expiry will be set automatically based on this plan's
//               duration, starting today.
//             </p>
//           </div>

//           <div className="space-y-1">
//             <label className="text-sm font-medium text-gray-600">
//               Upload Document
//             </label>
//             <input
//               className="w-full p-3 border rounded-lg"
//               type="file"
//               onChange={(e) =>
//                 setFormData({ ...formData, document: e.target.files[0] })
//               }
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
//           >
//             {loading ? (
//               "Saving..."
//             ) : (
//               <>
//                 <Save size={18} /> Save Member
//               </>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }









import { useState, useEffect } from "react";
import axios from "axios";
import { X, Save } from "lucide-react";

import { API_BASE_URL } from "../config.js";


export default function MemberForm({ onCancel, onMemberAdded }) {
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    tierId: "",
    document: null,
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/members/tiers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const activeTiers = res.data.filter((t) => t.isActive !== false);
        setTiers(activeTiers);
        if (activeTiers.length > 0) {
          setFormData((prev) => ({ ...prev, tierId: activeTiers[0].id }));
        }
      } catch (err) {
        console.error("Failed to load membership tiers:", err);
      }
    };
    fetchTiers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tierId) {
      alert("Please select a membership tier.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => data.append(key, val));

    try {
      await axios.post(`${API_BASE_URL}/api/members`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      onMemberAdded();
    } catch (err) {
      console.error(err);
      alert("Error adding member. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Member</h2>
          <button
            onClick={onCancel}
            className="text-neutral-500 hover:text-white"
          >
            <X />
          </button>
        </div>

        <p className="text-sm text-neutral-400 -mt-2 mb-6">
          Use this form only for members who paid you directly (cash, or a
          personal online transfer). Their membership starts today and is marked
          active immediately — the expiry date is set automatically from the
          plan you choose below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className={`p-3 w-full ${inputClass}`}
              placeholder="First Name"
              required
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <input
              className={`p-3 w-full ${inputClass}`}
              placeholder="Last Name"
              required
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <input
            className={`w-full p-3 ${inputClass}`}
            type="email"
            placeholder="Email Address"
            required
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">
              Membership Tier
            </label>
            <select
              className={`w-full p-3 ${inputClass}`}
              required
              value={formData.tierId}
              onChange={(e) =>
                setFormData({ ...formData, tierId: e.target.value })
              }
            >
              <option value="" disabled>
                {tiers.length === 0 ? "Loading tiers..." : "Select a tier"}
              </option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} — {tier.durationDays} days
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 pt-1">
              Membership expiry will be set automatically based on this plan's
              duration, starting today.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">
              Upload Document
            </label>
            <input
              className={`w-full p-3 ${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-brand-600 file:text-white file:text-xs`}
              type="file"
              onChange={(e) =>
                setFormData({ ...formData, document: e.target.files[0] })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 transition-colors"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} /> Save Member
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}