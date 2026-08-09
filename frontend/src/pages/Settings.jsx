// import { useState, useEffect } from "react";
// import axios from "axios";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   KeyRound,
//   Tag,
//   Plus,
//   Trash2,
//   Save,
//   X,
//   ArrowUp,
//   ArrowDown,
//   EyeOff,
//   Eye,
//   Star, // <-- add this
// } from "lucide-react";

// import Layout from "../components/Layout";
// import ConfirmDialog from "../components/ConfirmDialog";

// export default function Settings({ onLogout }) {
//   // --- Password change ---
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [changingPassword, setChangingPassword] = useState(false);
//   const [confirmDeleteTierId, setConfirmDeleteTierId] = useState(null);
//   const [deletingTier, setDeletingTier] = useState(false);

//   // --- Tier management ---
//   const [tiers, setTiers] = useState([]);
//   const [loadingTiers, setLoadingTiers] = useState(true);
//   const [editingTierId, setEditingTierId] = useState(null);
//   const [editForm, setEditForm] = useState({});
//   const [newTier, setNewTier] = useState({
//     name: "",
//     price: "",
//     durationDays: "",
//     description: "",
//   });
//   const [savingTier, setSavingTier] = useState(false);

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   const fetchTiers = async () => {
//     setLoadingTiers(true);
//     try {
//       const res = await axios.get(
//         "http://localhost:5000/api/members/tiers",
//         getAuthHeader(),
//       );
//       setTiers(res.data);
//     } catch (error) {
//       toast.error("Failed to load tiers");
//     } finally {
//       setLoadingTiers(false);
//     }
//   };

//   useEffect(() => {
//     fetchTiers();
//   }, []);

//   const moveTier = async (index, direction) => {
//     const newIndex = index + direction;
//     if (newIndex < 0 || newIndex >= tiers.length) return;

//     // Optimistic reorder in the UI, then persist — swapping two adjacent
//     // items so the change feels instant rather than waiting on a round trip.
//     const reordered = [...tiers];
//     [reordered[index], reordered[newIndex]] = [
//       reordered[newIndex],
//       reordered[index],
//     ];
//     setTiers(reordered);

//     try {
//       await axios.put(
//         "http://localhost:5000/api/members/tiers/reorder",
//         { orderedIds: reordered.map((t) => t.id) },
//         getAuthHeader(),
//       );
//     } catch (error) {
//       toast.error("Failed to save new order");
//       fetchTiers(); // revert to the real server order on failure
//     }
//   };

//   const handleChangePassword = async (e) => {
//     e.preventDefault();
//     if (newPassword !== confirmPassword) {
//       toast.error("New passwords don't match");
//       return;
//     }
//     setChangingPassword(true);
//     try {
//       await axios.put(
//         "http://localhost:5000/api/auth/change-password",
//         { currentPassword, newPassword },
//         getAuthHeader(),
//       );
//       toast.success("Password changed!");
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to change password");
//     } finally {
//       setChangingPassword(false);
//     }
//   };

//   const handleAddTier = async (e) => {
//     e.preventDefault();
//     setSavingTier(true);
//     try {
//       await axios.post(
//         "http://localhost:5000/api/members/tiers",
//         newTier,
//         getAuthHeader(),
//       );
//       toast.success("Plan created!");
//       setNewTier({ name: "", price: "", durationDays: "", description: "" });
//       fetchTiers();
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to create plan");
//     } finally {
//       setSavingTier(false);
//     }
//   };

//   const startEditingTier = (tier) => {
//     setEditingTierId(tier.id);
//     setEditForm({
//       name: tier.name,
//       price: tier.price,
//       durationDays: tier.durationDays,
//       description: tier.description || "",
//     });
//   };

//   const handleSaveTierEdit = async (tierId) => {
//     setSavingTier(true);
//     try {
//       await axios.put(
//         `http://localhost:5000/api/members/tiers/${tierId}`,
//         editForm,
//         getAuthHeader(),
//       );
//       toast.success("Plan updated!");
//       setEditingTierId(null);
//       fetchTiers();
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to update plan");
//     } finally {
//       setSavingTier(false);
//     }
//   };

//   const handleDeleteTier = async (tierId) => {
//     setDeletingTier(true);
//     try {
//       await axios.delete(
//         `http://localhost:5000/api/members/tiers/${tierId}`,
//         getAuthHeader(),
//       );
//       toast.success("Plan deleted");
//       fetchTiers();
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to delete plan");
//     } finally {
//       setDeletingTier(false);
//       setConfirmDeleteTierId(null);
//     }
//   };

//   const handleToggleActive = async (tier) => {
//     const nextActive = !tier.isActive;
//     // Optimistic update so the badge/button flips instantly.
//     setTiers((prev) =>
//       prev.map((t) => (t.id === tier.id ? { ...t, isActive: nextActive } : t)),
//     );
//     try {
//       await axios.put(
//         `http://localhost:5000/api/members/tiers/${tier.id}`,
//         { isActive: nextActive },
//         getAuthHeader(),
//       );
//       toast.success(nextActive ? "Plan reactivated" : "Plan retired");
//     } catch (error) {
//       toast.error("Failed to update plan status");
//       fetchTiers(); // revert to real server state on failure
//     }
//   };

//   const handleSetPopular = async (tier) => {
//     // Optimistic update: this tier becomes popular, every other tier stops
//     // being popular — mirrors what the backend transaction will do.
//     const previous = tiers;
//     setTiers((prev) =>
//       prev.map((t) => ({ ...t, isPopular: t.id === tier.id })),
//     );
//     try {
//       await axios.put(
//         `http://localhost:5000/api/members/tiers/${tier.id}/popular`,
//         {},
//         getAuthHeader(),
//       );
//       toast.success(`${tier.name} is now marked Most Popular`);
//     } catch (error) {
//       toast.error("Failed to update popular plan");
//       setTiers(previous); // revert on failure
//     }
//   };

//   return (
//     <Layout onLogout={onLogout}>
//       <Toaster position="top-right" />
//       <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

//       {/* Account / Password */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 max-w-lg">
//         <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
//           <KeyRound size={18} className="text-gray-400" />
//           Change Password
//         </h2>
//         <form onSubmit={handleChangePassword} className="space-y-4">
//           <input
//             className="w-full p-3 border rounded-lg"
//             type="password"
//             placeholder="Current password"
//             value={currentPassword}
//             onChange={(e) => setCurrentPassword(e.target.value)}
//             required
//           />
//           <input
//             className="w-full p-3 border rounded-lg"
//             type="password"
//             placeholder="New password"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             required
//             minLength={6}
//           />
//           <input
//             className="w-full p-3 border rounded-lg"
//             type="password"
//             placeholder="Confirm new password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             required
//             minLength={6}
//           />
//           <button
//             type="submit"
//             disabled={changingPassword}
//             className="bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             <Save size={16} />{" "}
//             {changingPassword ? "Saving..." : "Update Password"}
//           </button>
//         </form>
//       </div>

//       {/* Membership Plans */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
//         <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
//           <Tag size={18} className="text-gray-400" />
//           Membership Plans
//         </h2>
//         <p className="text-xs text-gray-400 mb-4">
//           These plans, prices, and descriptions are shown live on your public
//           landing page, in the order shown below — use the arrows to reorder
//           them.
//         </p>

//         {loadingTiers ? (
//           <p className="text-sm text-gray-400">Loading plans...</p>
//         ) : (
//           <ul className="divide-y divide-gray-100 mb-6">
//             {tiers.map((tier, index) =>
//               editingTierId === tier.id ? (
//                 <li key={tier.id} className="py-3 space-y-2">
//                   <div className="flex items-center gap-2">
//                     <input
//                       className="p-2 border rounded-lg text-sm flex-1 min-w-0"
//                       placeholder="Plan name"
//                       value={editForm.name}
//                       onChange={(e) =>
//                         setEditForm({ ...editForm, name: e.target.value })
//                       }
//                     />
//                     <input
//                       className="p-2 border rounded-lg text-sm w-24"
//                       type="number"
//                       step="0.01"
//                       placeholder="Price"
//                       value={editForm.price}
//                       onChange={(e) =>
//                         setEditForm({ ...editForm, price: e.target.value })
//                       }
//                     />
//                     <input
//                       className="p-2 border rounded-lg text-sm w-24"
//                       type="number"
//                       placeholder="Days"
//                       value={editForm.durationDays}
//                       onChange={(e) =>
//                         setEditForm({
//                           ...editForm,
//                           durationDays: e.target.value,
//                         })
//                       }
//                     />
//                   </div>
//                   <textarea
//                     className="w-full p-2 border rounded-lg text-sm resize-none"
//                     rows={2}
//                     placeholder="Description shown on the landing page (optional)"
//                     value={editForm.description}
//                     onChange={(e) =>
//                       setEditForm({ ...editForm, description: e.target.value })
//                     }
//                   />
//                   <div className="flex items-center gap-2 justify-end">
//                     <button
//                       onClick={() => setEditingTierId(null)}
//                       className="text-gray-400 hover:bg-gray-50 p-2 rounded-lg"
//                     >
//                       <X size={16} />
//                     </button>
//                     <button
//                       onClick={() => handleSaveTierEdit(tier.id)}
//                       disabled={savingTier}
//                       className="text-green-600 hover:bg-green-50 p-2 rounded-lg disabled:opacity-50"
//                     >
//                       <Save size={16} />
//                     </button>
//                   </div>
//                 </li>
//               ) : (
//                 <li
//                   key={tier.id}
//                   className="py-3 flex items-start justify-between gap-4"
//                 >
//                   <div className="flex flex-col shrink-0 -my-1">
//                     <button
//                       onClick={() => moveTier(index, -1)}
//                       disabled={index === 0}
//                       className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
//                       title="Move up"
//                     >
//                       <ArrowUp size={14} />
//                     </button>
//                     <button
//                       onClick={() => moveTier(index, 1)}
//                       disabled={index === tiers.length - 1}
//                       className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
//                       title="Move down"
//                     >
//                       <ArrowDown size={14} />
//                     </button>
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
//                       {tier.name}
//                       {tier.isActive === false && (
//                         <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
//                           Retired
//                         </span>
//                       )}
//                     </p>
//                     <p className="text-xs text-gray-400 mb-1">
//                       ₹{tier.price} · {tier.durationDays} days
//                     </p>
//                     {tier.description ? (
//                       <p className="text-xs text-gray-500 leading-relaxed">
//                         {tier.description}
//                       </p>
//                     ) : (
//                       <p className="text-xs text-gray-300 italic">
//                         No description yet — add one so it shows on the landing
//                         page.
//                       </p>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-3 shrink-0">

//                     <button
//                       onClick={() => handleSetPopular(tier)}
//                       disabled={tier.isPopular}
//                       className={`text-sm font-medium flex items-center gap-1 ${
//                         tier.isPopular
//                           ? "text-amber-500 cursor-default"
//                           : "text-gray-400 hover:text-amber-600"
//                       }`}
//                       title={
//                         tier.isPopular
//                           ? "This is the current Most Popular plan"
//                           : "Mark as Most Popular on the landing page"
//                       }
//                     >
//                       <Star
//                         size={14}
//                         fill={tier.isPopular ? "currentColor" : "none"}
//                       />
//                       {tier.isPopular ? "Popular" : "Mark Popular"}
//                     </button>

//                     <button
//                       onClick={() => handleToggleActive(tier)}
//                       className={`text-sm font-medium flex items-center gap-1 ${
//                         tier.isActive === false
//                           ? "text-emerald-600 hover:text-emerald-800"
//                           : "text-gray-500 hover:text-gray-700"
//                       }`}
//                       title={
//                         tier.isActive === false
//                           ? "Reactivate — show this plan again"
//                           : "Retire — hide from new registrations and the landing page, keep existing members"
//                       }
//                     >
//                       {tier.isActive === false ? (
//                         <>
//                           <Eye size={14} /> Reactivate
//                         </>
//                       ) : (
//                         <>
//                           <EyeOff size={14} /> Retire
//                         </>
//                       )}
//                     </button>
//                     <button
//                       onClick={() => startEditingTier(tier)}
//                       className="text-sm text-blue-600 hover:text-blue-800 font-medium"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => setConfirmDeleteTierId(tier.id)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 </li>
//               ),
//             )}
//           </ul>
//         )}

//         <form
//           onSubmit={handleAddTier}
//           className="pt-4 border-t border-gray-100 space-y-3"
//         >
//           <div className="flex flex-col sm:flex-row flex-wrap gap-3">
//             <input
//               className="p-2.5 border rounded-lg text-sm flex-1 min-w-0"
//               placeholder="Plan name (e.g. Gym + Yoga)"
//               value={newTier.name}
//               onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
//               required
//             />
//             <input
//               className="p-2.5 border rounded-lg text-sm w-28"
//               type="number"
//               step="0.01"
//               placeholder="Price"
//               value={newTier.price}
//               onChange={(e) =>
//                 setNewTier({ ...newTier, price: e.target.value })
//               }
//               required
//             />
//             <input
//               className="p-2.5 border rounded-lg text-sm w-32"
//               type="number"
//               placeholder="Duration (days)"
//               value={newTier.durationDays}
//               onChange={(e) =>
//                 setNewTier({ ...newTier, durationDays: e.target.value })
//               }
//               required
//             />
//           </div>
//           <textarea
//             className="w-full p-2.5 border rounded-lg text-sm resize-none"
//             rows={2}
//             placeholder="Description shown on the landing page (optional) — e.g. 'Everything in Gym Access, plus unlimited yoga classes.'"
//             value={newTier.description}
//             onChange={(e) =>
//               setNewTier({ ...newTier, description: e.target.value })
//             }
//           />
//           <button
//             type="submit"
//             disabled={savingTier}
//             className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
//           >
//             <Plus size={16} /> Add Plan
//           </button>
//         </form>
//       </div>

//       <ConfirmDialog
//         open={!!confirmDeleteTierId}
//         title="Delete this plan?"
//         message="This can't be undone. Make sure no members are still assigned to it."
//         loading={deletingTier}
//         onConfirm={() => handleDeleteTier(confirmDeleteTierId)}
//         onCancel={() => setConfirmDeleteTierId(null)}
//       />
//     </Layout>
//   );
// }













import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  KeyRound,
  Tag,
  Plus,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Eye,
  Star,
} from "lucide-react";

import Layout from "../components/Layout";
import ConfirmDialog from "../components/ConfirmDialog";

import { API_BASE_URL } from "../config.js";


export default function Settings({ onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmDeleteTierId, setConfirmDeleteTierId] = useState(null);
  const [deletingTier, setDeletingTier] = useState(false);

  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [editingTierId, setEditingTierId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newTier, setNewTier] = useState({
    name: "",
    price: "",
    durationDays: "",
    description: "",
  });
  const [savingTier, setSavingTier] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchTiers = async () => {
    setLoadingTiers(true);
    try {
      const res = await axios.get(
        // "http://localhost:5000/api/members/tiers",
        `${API_BASE_URL}/api/members/tiers`,
        getAuthHeader(),
      );
      setTiers(res.data);
    } catch (error) {
      toast.error("Failed to load tiers");
    } finally {
      setLoadingTiers(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const moveTier = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tiers.length) return;

    const reordered = [...tiers];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];
    setTiers(reordered);

    try {
      await axios.put(
        // "http://localhost:5000/api/members/tiers/reorder",
        `${API_BASE_URL}/api/members/tiers/reorder`,
        { orderedIds: reordered.map((t) => t.id) },
        getAuthHeader(),
      );
    } catch (error) {
      toast.error("Failed to save new order");
      fetchTiers();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      await axios.put(
        // "http://localhost:5000/api/auth/change-password",
        `${API_BASE_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        getAuthHeader(),
      );
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddTier = async (e) => {
    e.preventDefault();
    setSavingTier(true);
    try {
      await axios.post(
        // "http://localhost:5000/api/members/tiers",
        `${API_BASE_URL}/api/members/tiers`,
        newTier,
        getAuthHeader(),
      );
      toast.success("Plan created!");
      setNewTier({ name: "", price: "", durationDays: "", description: "" });
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create plan");
    } finally {
      setSavingTier(false);
    }
  };

  const startEditingTier = (tier) => {
    setEditingTierId(tier.id);
    setEditForm({
      name: tier.name,
      price: tier.price,
      durationDays: tier.durationDays,
      description: tier.description || "",
    });
  };

  const handleSaveTierEdit = async (tierId) => {
    setSavingTier(true);
    try {
      await axios.put(
        // `http://localhost:5000/api/members/tiers/${tierId}`,
        `${API_BASE_URL}/api/members/tiers/${tierId}`,
        editForm,
        getAuthHeader(),
      );
      toast.success("Plan updated!");
      setEditingTierId(null);
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update plan");
    } finally {
      setSavingTier(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    setDeletingTier(true);
    try {
      await axios.delete(
        // `http://localhost:5000/api/members/tiers/${tierId}`,
        `${API_BASE_URL}/api/members/tiers/${tierId}`,
        getAuthHeader(),
      );
      toast.success("Plan deleted");
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete plan");
    } finally {
      setDeletingTier(false);
      setConfirmDeleteTierId(null);
    }
  };

  const handleToggleActive = async (tier) => {
    const nextActive = !tier.isActive;
    setTiers((prev) =>
      prev.map((t) => (t.id === tier.id ? { ...t, isActive: nextActive } : t)),
    );
    try {
      await axios.put(
        // `http://localhost:5000/api/members/tiers/${tier.id}`,
        `${API_BASE_URL}/api/members/tiers/${tier.id}`,
        { isActive: nextActive },
        getAuthHeader(),
      );
      toast.success(nextActive ? "Plan reactivated" : "Plan retired");
    } catch (error) {
      toast.error("Failed to update plan status");
      fetchTiers();
    }
  };

  const handleSetPopular = async (tier) => {
    const previous = tiers;
    setTiers((prev) =>
      prev.map((t) => ({ ...t, isPopular: t.id === tier.id })),
    );
    try {
      await axios.put(
        // `http://localhost:5000/api/members/tiers/${tier.id}/popular`,
        `${API_BASE_URL}/api/members/tiers/${tier.id}/popular`,
        {},
        getAuthHeader(),
      );
      toast.success(`${tier.name} is now marked Most Popular`);
    } catch (error) {
      toast.error("Failed to update popular plan");
      setTiers(previous);
    }
  };

  const inputClass =
    "border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600";

  return (
    <Layout onLogout={onLogout}>
      <Toaster position="top-right" />
      <h1
        className="text-2xl text-white mb-6 tracking-wide"
        style={{ fontFamily: "var(--font-display)" }}
      >
        SETTINGS
      </h1>

      {/* Account / Password */}
      <div className="bg-surface-alt rounded-xl border border-border p-6 mb-8 max-w-lg">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <KeyRound size={18} className="text-neutral-500" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            className={`w-full p-3 ${inputClass}`}
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className={`w-full p-3 ${inputClass}`}
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            className={`w-full p-3 ${inputClass}`}
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={changingPassword}
            className="bg-brand-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <Save size={16} />{" "}
            {changingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Membership Plans */}
      <div className="bg-surface-alt rounded-xl border border-border p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Tag size={18} className="text-neutral-500" />
          Membership Plans
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          These plans, prices, and descriptions are shown live on your public
          landing page, in the order shown below — use the arrows to reorder
          them.
        </p>

        {loadingTiers ? (
          <p className="text-sm text-neutral-500">Loading plans...</p>
        ) : (
          <ul className="divide-y divide-border mb-6">
            {tiers.map((tier, index) =>
              editingTierId === tier.id ? (
                <li key={tier.id} className="py-3 space-y-2">

                


                  {/* <div className="flex items-center gap-2">
                    <input
                      className={`p-2 text-sm flex-1 min-w-0 ${inputClass}`}
                      placeholder="Plan name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                    <input
                      className={`p-2 text-sm w-24 ${inputClass}`}
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                    <input
                      className={`p-2 text-sm w-24 ${inputClass}`}
                      type="number"
                      placeholder="Days"
                      value={editForm.durationDays}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          durationDays: e.target.value,
                        })
                      }
                    />
                  </div> */}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={`p-2 text-sm flex-1 min-w-0 ${inputClass}`}
                      placeholder="Plan name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <input
                        className={`p-2 text-sm w-full sm:w-24 ${inputClass}`}
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                      />
                      <input
                        className={`p-2 text-sm w-full sm:w-24 ${inputClass}`}
                        type="number"
                        placeholder="Days"
                        value={editForm.durationDays}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            durationDays: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>





                  <textarea
                    className={`w-full p-2 text-sm resize-none ${inputClass}`}
                    rows={2}
                    placeholder="Description shown on the landing page (optional)"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingTierId(null)}
                      className="text-neutral-500 hover:bg-surface-hover p-2 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleSaveTierEdit(tier.id)}
                      disabled={savingTier}
                      className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg disabled:opacity-50"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </li>
              ) : (


                <li key={tier.id} className="py-3 flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                  <div className="flex flex-col shrink-0 -my-1">
                    <button
                      onClick={() => moveTier(index, -1)}
                      disabled={index === 0}
                      className="text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveTier(index, 1)}
                      disabled={index === tiers.length - 1}
                      className="text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-100 flex items-center gap-2">
                      {tier.name}
                      {tier.isActive === false && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-hover text-neutral-400 px-1.5 py-0.5 rounded">
                          Retired
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 mb-1">
                      ₹{tier.price} · {tier.durationDays} days
                    </p>
                    {tier.description ? (
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {tier.description}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-600 italic">
                        No description yet — add one so it shows on the landing
                        page.
                      </p>
                    )}
                  </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-8">
                    <button
                      onClick={() => handleSetPopular(tier)}
                      disabled={tier.isPopular}
                      className={`text-sm font-medium flex items-center gap-1 ${
                        tier.isPopular
                          ? "text-amber-400 cursor-default"
                          : "text-neutral-500 hover:text-amber-400"
                      }`}
                      title={
                        tier.isPopular
                          ? "This is the current Most Popular plan"
                          : "Mark as Most Popular on the landing page"
                      }
                    >
                      <Star
                        size={14}
                        fill={tier.isPopular ? "currentColor" : "none"}
                      />
                      {tier.isPopular ? "Popular" : "Mark Popular"}
                    </button>

                    <button
                      onClick={() => handleToggleActive(tier)}
                      className={`text-sm font-medium flex items-center gap-1 ${
                        tier.isActive === false
                          ? "text-emerald-400 hover:text-emerald-300"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                      title={
                        tier.isActive === false
                          ? "Reactivate — show this plan again"
                          : "Retire — hide from new registrations and the landing page, keep existing members"
                      }
                    >
                      {tier.isActive === false ? (
                        <>
                          <Eye size={14} /> Reactivate
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Retire
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => startEditingTier(tier)}
                      className="text-sm text-brand-500 hover:text-brand-400 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteTierId(tier.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <form
          onSubmit={handleAddTier}
          className="pt-4 border-t border-border space-y-3"
        >
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              className={`p-2.5 text-sm flex-1 min-w-0 ${inputClass}`}
              placeholder="Plan name (e.g. Gym + Yoga)"
              value={newTier.name}
              onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
              required
            />
            <input
              className={`p-2.5 text-sm w-28 ${inputClass}`}
              type="number"
              step="0.01"
              placeholder="Price"
              value={newTier.price}
              onChange={(e) =>
                setNewTier({ ...newTier, price: e.target.value })
              }
              required
            />
            <input
              className={`p-2.5 text-sm w-32 ${inputClass}`}
              type="number"
              placeholder="Duration (days)"
              value={newTier.durationDays}
              onChange={(e) =>
                setNewTier({ ...newTier, durationDays: e.target.value })
              }
              required
            />
          </div>
          <textarea
            className={`w-full p-2.5 text-sm resize-none ${inputClass}`}
            rows={2}
            placeholder="Description shown on the landing page (optional) — e.g. 'Everything in Gym Access, plus unlimited yoga classes.'"
            value={newTier.description}
            onChange={(e) =>
              setNewTier({ ...newTier, description: e.target.value })
            }
          />
          <button
            type="submit"
            disabled={savingTier}
            className="bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto transition-colors"
          >
            <Plus size={16} /> Add Plan
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteTierId}
        title="Delete this plan?"
        message="This can't be undone. Make sure no members are still assigned to it."
        loading={deletingTier}
        onConfirm={() => handleDeleteTier(confirmDeleteTierId)}
        onCancel={() => setConfirmDeleteTierId(null)}
      />
    </Layout>
  );
}