// import { useState, useEffect } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { X, CreditCard, AlertTriangle } from "lucide-react";
// import { API_BASE_URL } from "../config.js";

// function loadRazorpayScript() {
//   return new Promise((resolve) => {
//     if (window.Razorpay) return resolve(true);
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// }

// export default function RenewalModal({ member, onClose, onRenewed }) {
//   const [loading, setLoading] = useState(false);
//   const [tiers, setTiers] = useState([]);
//   const [loadingTiers, setLoadingTiers] = useState(true);
//   const [tierId, setTierId] = useState("");

//   // A member's current tier only stays selectable at renewal time if it's
//   // still active — a retired plan shouldn't be renewable back into, even
//   // though the member technically still has it until they renew.
//   const currentTierIsActive = member.tier?.isActive !== false;

//   const canRenewNow = member.status !== "ACTIVE";

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   useEffect(() => {
//     const fetchTiers = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
//         setTiers(res.data);
//         // Default the selection: current tier if it's still active,
//         // otherwise the first available plan so the member must
//         // consciously pick a replacement.
//         if (currentTierIsActive) {
//           setTierId(member.tierId);
//         } else if (res.data.length > 0) {
//           setTierId(res.data[0].id);
//         }
//       } catch {
//         // If this fails and their tier is still active, fall back to
//         // renewing at their current tier — better than a dead end.
//         if (currentTierIsActive) setTierId(member.tierId);
//       } finally {
//         setLoadingTiers(false);
//       }
//     };
//     fetchTiers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const selectedTier = tiers.find((t) => t.id === tierId);
//   const isSwitchingTier = tierId !== member.tierId;

//   const handlePay = async () => {
//     if (!tierId) {
//       toast.error("Please select a plan to continue.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const scriptLoaded = await loadRazorpayScript();
//       if (!scriptLoaded) {
//         toast.error(
//           "Couldn't load the payment gateway. Check your connection.",
//         );
//         setLoading(false);
//         return;
//       }

//       const { data: order } = await axios.post(
//         `http://localhost:5000/api/members/${member.id}/renew/create-order`,
//         { tierId },
//         getAuthHeader(),
//       );

//       const options = {
//         key: order.keyId,
//         amount: order.amount,
//         currency: order.currency,
//         name: "MemberHub",
//         description: `${order.tierName} Membership Renewal`,
//         order_id: order.orderId,
//         prefill: { name: order.memberName },
//         theme: { color: "#2563EB" },
//         handler: async (response) => {
//           try {
//             await axios.post(
//               `http://localhost:5000/api/members/${member.id}/renew/verify`,
//               {
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               },
//               getAuthHeader(),
//             );
//             toast.success("Membership renewed!");
//             onRenewed?.();
//             onClose();
//           } catch (err) {
//             toast.error(
//               "Payment succeeded but the renewal didn't apply automatically — it will be picked up shortly, or contact support.",
//             );
//           }
//         },
//         modal: {
//           ondismiss: () => setLoading(false),
//         },
//       };

//       const checkout = new window.Razorpay(options);
//       checkout.open();
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Failed to start payment.");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-800">Renew Membership</h2>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//             <X />
//           </button>
//         </div>

//         {!canRenewNow ? (
//           <div className="text-center py-6">
//             <p className="text-gray-600">
//               Your membership is still active until{" "}
//               <strong>{new Date(member.endDate).toLocaleDateString()}</strong>.
//             </p>
//             <p className="text-sm text-gray-400 mt-2">
//               You can renew once your plan starts expiring or after it ends.
//             </p>
//           </div>
//         ) : (
//           <>
//             {!currentTierIsActive && (
//               <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-4">
//                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
//                 <p>
//                   Your previous plan, <strong>{member.tier?.name}</strong>, is no
//                   longer available. Please choose a new plan below to continue.
//                 </p>
//               </div>
//             )}

//             <div className="space-y-1 mb-4">
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
//                     {tier.name}
//                     {tier.id === member.tierId && currentTierIsActive
//                       ? " (current)"
//                       : ""}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="bg-gray-50 rounded-xl p-5 mb-6">
//               <p className="text-sm text-gray-500">
//                 {isSwitchingTier ? "New Tier" : "Current Tier"}
//               </p>
//               <p className="text-lg font-semibold text-gray-800">
//                 {selectedTier?.name || "—"}
//               </p>
//               <p className="mt-3 text-3xl font-bold text-blue-600">
//                 {selectedTier ? `₹${selectedTier.price}` : "—"}
//               </p>
//               {selectedTier && (
//                 <p className="text-xs text-gray-400 mt-1">
//                   Extends membership by {selectedTier.durationDays} days
//                   {isSwitchingTier && " — switches your plan"}
//                 </p>
//               )}
//             </div>

//             <button
//               onClick={handlePay}
//               disabled={loading || loadingTiers || !tierId}
//               className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
//             >
//               <CreditCard size={18} />{" "}
//               {loading
//                 ? "Opening payment..."
//                 : selectedTier
//                   ? `Pay ₹${selectedTier.price}`
//                   : "Select a plan"}
//             </button>
//             <p className="text-xs text-gray-400 text-center mt-3">
//               Secured by Razorpay. Cards, UPI, netbanking, and wallets accepted.
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }









import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, CreditCard, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "../config.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RenewalModal({ member, onClose, onRenewed }) {
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [tierId, setTierId] = useState("");

  const currentTierIsActive = member.tier?.isActive !== false;
  const canRenewNow = member.status !== "ACTIVE";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
        setTiers(res.data);
        if (currentTierIsActive) {
          setTierId(member.tierId);
        } else if (res.data.length > 0) {
          setTierId(res.data[0].id);
        }
      } catch {
        if (currentTierIsActive) setTierId(member.tierId);
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTier = tiers.find((t) => t.id === tierId);
  const isSwitchingTier = tierId !== member.tierId;

  const handlePay = async () => {
    if (!tierId) {
      toast.error("Please select a plan to continue.");
      return;
    }
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error(
          "Couldn't load the payment gateway. Check your connection.",
        );
        setLoading(false);
        return;
      }

      const { data: order } = await axios.post(
        // `http://localhost:5000/api/members/${member.id}/renew/create-order`,
        `${API_BASE_URL}/api/members/${member.id}/renew/create-order`,
        { tierId },
        getAuthHeader(),
      );

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "MemberHub",
        description: `${order.tierName} Membership Renewal`,
        order_id: order.orderId,
        prefill: { name: order.memberName },
        theme: { color: "#dc2626" },
        handler: async (response) => {
          try {
            await axios.post(
              // `http://localhost:5000/api/members/${member.id}/renew/verify`,
              `${API_BASE_URL}/api/members/${member.id}/renew/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              getAuthHeader(),
            );
            toast.success("Membership renewed!");
            onRenewed?.();
            onClose();
          } catch (err) {
            toast.error(
              "Payment succeeded but the renewal didn't apply automatically — it will be picked up shortly, or contact support.",
            );
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start payment.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Renew Membership</h2>
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
              Your membership is still active until{" "}
              <strong className="text-white">
                {new Date(member.endDate).toLocaleDateString()}
              </strong>
              .
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              You can renew once your plan starts expiring or after it ends.
            </p>
          </div>
        ) : (
          <>
            {!currentTierIsActive && (
              <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-lg p-3 mb-4">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>
                  Your previous plan, <strong>{member.tier?.name}</strong>, is
                  no longer available. Please choose a new plan below to
                  continue.
                </p>
              </div>
            )}

            <div className="space-y-1 mb-4">
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
                    {tier.name}
                    {tier.id === member.tierId && currentTierIsActive
                      ? " (current)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-surface-hover rounded-xl p-5 mb-6">
              <p className="text-sm text-neutral-400">
                {isSwitchingTier ? "New Tier" : "Current Tier"}
              </p>
              <p className="text-lg font-semibold text-white">
                {selectedTier?.name || "—"}
              </p>
              <p className="mt-3 text-3xl font-bold text-brand-500">
                {selectedTier ? `₹${selectedTier.price}` : "—"}
              </p>
              {selectedTier && (
                <p className="text-xs text-neutral-500 mt-1">
                  Extends membership by {selectedTier.durationDays} days
                  {isSwitchingTier && " — switches your plan"}
                </p>
              )}
            </div>

            <button
              onClick={handlePay}
              disabled={loading || loadingTiers || !tierId}
              className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard size={18} />{" "}
              {loading
                ? "Opening payment..."
                : selectedTier
                  ? `Pay ₹${selectedTier.price}`
                  : "Select a plan"}
            </button>
            <p className="text-xs text-neutral-500 text-center mt-3">
              Secured by Razorpay. Cards, UPI, netbanking, and wallets accepted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}