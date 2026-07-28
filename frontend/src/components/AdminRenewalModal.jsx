// import { useState, useEffect } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { X, Banknote, AlertTriangle } from "lucide-react";

// export default function AdminRenewalModal({ member, onClose, onRenewed }) {
//   const [tiers, setTiers] = useState([]);
//   const [tierId, setTierId] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [loadingTiers, setLoadingTiers] = useState(true);

//   const currentTierIsActive = member.tier?.isActive !== false;

//   const canRenewNow = member.status !== "ACTIVE";

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   useEffect(() => {
//     const fetchTiers = async () => {
//       try {
//         const res = await axios.get(
//           "http://localhost:5000/api/members/tiers",
//           getAuthHeader(),
//         );
//         const activeTiers = res.data.filter((t) => t.isActive !== false);
//         setTiers(activeTiers);
//         if (currentTierIsActive) {
//           setTierId(member.tierId);
//         } else if (activeTiers.length > 0) {
//           setTierId(activeTiers[0].id);
//         }
//       } catch {
//         toast.error("Failed to load plans");
//       } finally {
//         setLoadingTiers(false);
//       }
//     };
//     fetchTiers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const selectedTier = tiers.find((t) => t.id === tierId);
//   const isSwitchingTier = tierId !== member.tierId;

//   const handleConfirm = async () => {
//     if (!tierId) {
//       toast.error("Please select a plan to continue.");
//       return;
//     }
//     setLoading(true);
//     try {
//       await axios.put(
//         `http://localhost:5000/api/members/${member.id}/renew/direct`,
//         { tierId },
//         getAuthHeader(),
//       );
//       toast.success("Membership renewed!");
//       onRenewed?.();
//       onClose();
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Failed to renew membership.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-800">
//             Renew (Paid Directly)
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X />
//           </button>
//         </div>

//         {!canRenewNow ? (
//           <div className="text-center py-6">
//             <p className="text-gray-600">
//               {member.firstName}'s membership is still active until{" "}
//               <strong>{new Date(member.endDate).toLocaleDateString()}</strong>.
//             </p>
//             <p className="text-sm text-gray-400 mt-2">
//               Renewal is only available once the plan starts expiring or after
//               it ends.
//             </p>
//           </div>
//         ) : (
//           <>
//             <p className="text-sm text-gray-500 mb-4">
//               Use this only if {member.firstName} already paid you directly —
//               cash, or a personal online transfer. This immediately marks the
//               membership as active, no Razorpay checkout involved.
//             </p>

//             {!currentTierIsActive && (
//               <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-4">
//                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
//                 <p>
//                   Their previous plan, <strong>{member.tier?.name}</strong>, was
//                   retired. Choose a new plan to renew them onto below.
//                 </p>
//               </div>
//             )}

//             <div className="space-y-1 mb-6">
//               <label className="text-sm font-medium text-gray-600">Plan</label>
//               <select
//                 className="w-full p-3 border rounded-lg bg-white"
//                 value={tierId}
//                 onChange={(e) => setTierId(e.target.value)}
//                 disabled={loadingTiers}
//               >
//                 {!tierId && (
//                   <option value="" disabled>
//                     {loadingTiers ? "Loading plans..." : "Select a plan"}
//                   </option>
//                 )}
//                 {tiers.map((tier) => (
//                   <option key={tier.id} value={tier.id}>
//                     {tier.name} — ₹{tier.price} / {tier.durationDays} days
//                     {tier.id === member.tierId && currentTierIsActive
//                       ? " (current)"
//                       : ""}
//                   </option>
//                 ))}
//               </select>
//               {selectedTier && (
//                 <p className="text-xs text-gray-400 pt-1">
//                   Extends membership by {selectedTier.durationDays} days
//                   {isSwitchingTier && " — switches plan"}.
//                 </p>
//               )}
//             </div>

//             <button
//               onClick={handleConfirm}
//               disabled={loading || loadingTiers || !tierId}
//               className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
//             >
//               <Banknote size={18} />
//               {loading ? "Renewing..." : "Confirm Renewal"}
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }









import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Banknote, AlertTriangle } from "lucide-react";

import { API_BASE_URL } from "../config.js";


export default function AdminRenewalModal({ member, onClose, onRenewed }) {
  const [tiers, setTiers] = useState([]);
  const [tierId, setTierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(true);

  const currentTierIsActive = member.tier?.isActive !== false;
  const canRenewNow = member.status !== "ACTIVE";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get(
          // "http://localhost:5000/api/members/tiers",
          `${API_BASE_URL}/api/members/tiers`,
          getAuthHeader(),
        );
        const activeTiers = res.data.filter((t) => t.isActive !== false);
        setTiers(activeTiers);
        if (currentTierIsActive) {
          setTierId(member.tierId);
        } else if (activeTiers.length > 0) {
          setTierId(activeTiers[0].id);
        }
      } catch {
        toast.error("Failed to load plans");
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTier = tiers.find((t) => t.id === tierId);
  const isSwitchingTier = tierId !== member.tierId;

  const handleConfirm = async () => {
    if (!tierId) {
      toast.error("Please select a plan to continue.");
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        // `http://localhost:5000/api/members/${member.id}/renew/direct`,
        `${API_BASE_URL}/api/members/${member.id}/renew/direct`,
        { tierId },
        getAuthHeader(),
      );
      toast.success("Membership renewed!");
      onRenewed?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to renew membership.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Renew (Paid Directly)
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white"
          >
            <X />
          </button>
        </div>

        {!canRenewNow ? (
          <div className="text-center py-6">
            <p className="text-neutral-300">
              {member.firstName}'s membership is still active until{" "}
              <strong className="text-white">
                {new Date(member.endDate).toLocaleDateString()}
              </strong>
              .
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Renewal is only available once the plan starts expiring or after
              it ends.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-400 mb-4">
              Use this only if {member.firstName} already paid you directly —
              cash, or a personal online transfer. This immediately marks the
              membership as active, no Razorpay checkout involved.
            </p>

            {!currentTierIsActive && (
              <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-lg p-3 mb-4">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>
                  Their previous plan, <strong>{member.tier?.name}</strong>, was
                  retired. Choose a new plan to renew them onto below.
                </p>
              </div>
            )}

            <div className="space-y-1 mb-6">
              <label className="text-sm font-medium text-neutral-300">
                Plan
              </label>
              <select
                className="w-full p-3 border border-border bg-surface-hover text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                value={tierId}
                onChange={(e) => setTierId(e.target.value)}
                disabled={loadingTiers}
              >
                {!tierId && (
                  <option value="" disabled>
                    {loadingTiers ? "Loading plans..." : "Select a plan"}
                  </option>
                )}
                {tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} — ₹{tier.price} / {tier.durationDays} days
                    {tier.id === member.tierId && currentTierIsActive
                      ? " (current)"
                      : ""}
                  </option>
                ))}
              </select>
              {selectedTier && (
                <p className="text-xs text-neutral-500 pt-1">
                  Extends membership by {selectedTier.durationDays} days
                  {isSwitchingTier && " — switches plan"}.
                </p>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || loadingTiers || !tierId}
              className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Banknote size={18} />
              {loading ? "Renewing..." : "Confirm Renewal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}