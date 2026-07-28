// import { useState, useEffect } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { CreditCard } from "lucide-react";
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

// export default function JoinMembership({ onJoined }) {
//   const [tiers, setTiers] = useState([]);
//   const [loadingTiers, setLoadingTiers] = useState(true);
//   const [tierId, setTierId] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [loading, setLoading] = useState(false);

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   useEffect(() => {
//     const fetchTiers = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
//         setTiers(res.data);
//         if (res.data.length > 0) setTierId(res.data[0].id);
//       } catch {
//         toast.error("Failed to load plans");
//       } finally {
//         setLoadingTiers(false);
//       }
//     };
//     fetchTiers();
//   }, []);

//   const selectedTier = tiers.find((t) => t.id === tierId);

//   const handlePay = async (e) => {
//     e.preventDefault();
//     if (!firstName.trim() || !lastName.trim()) {
//       toast.error("Please enter your name.");
//       return;
//     }
//     if (!tierId) {
//       toast.error("Please select a plan.");
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
//         "http://localhost:5000/api/members/join/create-order",
//         { tierId, firstName, lastName },
//         getAuthHeader(),
//       );

//       const options = {
//         key: order.keyId,
//         amount: order.amount,
//         currency: order.currency,
//         name: "MemberHub",
//         description: `${order.tierName} Membership`,
//         order_id: order.orderId,
//         prefill: { name: `${firstName} ${lastName}` },
//         theme: { color: "#2563EB" },
//         handler: async (response) => {
//           try {
//             await axios.post(
//               "http://localhost:5000/api/members/join/verify",
//               {
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 firstName,
//                 lastName,
//               },
//               getAuthHeader(),
//             );
//             toast.success("Welcome to MemberHub!");
//             onJoined?.();
//           } catch (err) {
//             toast.error(
//               "Payment succeeded but activation didn't complete automatically — it will be picked up shortly, or contact support.",
//             );
//           }
//         },
//         modal: { ondismiss: () => setLoading(false) },
//       };

//       const checkout = new window.Razorpay(options);
//       checkout.open();
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Failed to start payment.");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
//       <h2 className="text-xl font-bold text-gray-800 mb-2">
//         Complete Your Sign-Up
//       </h2>
//       <p className="text-sm text-gray-500 mb-6">
//         You're signed in — just pick a plan and pay to activate your membership.
//         No admin approval needed.
//       </p>

//       <form
//         onSubmit={handlePay}
//         className="text-left space-y-4 max-w-sm mx-auto"
//       >
//         <div className="grid grid-cols-2 gap-3">
//           <input
//             className="p-3 border rounded-lg w-full"
//             placeholder="First Name"
//             value={firstName}
//             onChange={(e) => setFirstName(e.target.value)}
//             required
//           />
//           <input
//             className="p-3 border rounded-lg w-full"
//             placeholder="Last Name"
//             value={lastName}
//             onChange={(e) => setLastName(e.target.value)}
//             required
//           />
//         </div>

//         <div className="space-y-1">
//           <label className="text-sm font-medium text-gray-600">Plan</label>
//           <select
//             className="w-full p-3 border rounded-lg bg-white"
//             value={tierId}
//             onChange={(e) => setTierId(e.target.value)}
//             disabled={loadingTiers}
//             required
//           >
//             {tiers.map((tier) => (
//               <option key={tier.id} value={tier.id}>
//                 {tier.name} — ₹{tier.price} / {tier.durationDays} days
//               </option>
//             ))}
//           </select>
//         </div>

//         {selectedTier && (
//           <div className="bg-gray-50 rounded-xl p-4">
//             <p className="text-2xl font-bold text-blue-600">
//               ₹{selectedTier.price}
//             </p>
//             <p className="text-xs text-gray-400 mt-1">
//               {selectedTier.durationDays} days membership
//             </p>
//           </div>
//         )}

//         <button
//           type="submit"
//           disabled={loading || loadingTiers}
//           className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
//         >
//           <CreditCard size={18} />
//           {loading ? "Opening payment..." : "Pay & Activate Membership"}
//         </button>
//       </form>
//     </div>
//   );
// }














import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";
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

export default function JoinMembership({ onJoined }) {
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [tierId, setTierId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
        setTiers(res.data);
        if (res.data.length > 0) setTierId(res.data[0].id);
      } catch {
        toast.error("Failed to load plans");
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
  }, []);

  const selectedTier = tiers.find((t) => t.id === tierId);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!tierId) {
      toast.error("Please select a plan.");
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
        // "http://localhost:5000/api/members/join/create-order",
        `${API_BASE_URL}/api/members/join/create-order`,
        { tierId, firstName, lastName },
        getAuthHeader(),
      );

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "MemberHub",
        description: `${order.tierName} Membership`,
        order_id: order.orderId,
        prefill: { name: `${firstName} ${lastName}` },
        theme: { color: "#dc2626" },
        handler: async (response) => {
          try {
            await axios.post(
              // "http://localhost:5000/api/members/join/verify",
              `${API_BASE_URL}/api/members/join/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                firstName,
                lastName,
              },
              getAuthHeader(),
            );
            toast.success("Welcome to MemberHub!");
            onJoined?.();
          } catch (err) {
            toast.error(
              "Payment succeeded but activation didn't complete automatically — it will be picked up shortly, or contact support.",
            );
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start payment.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-alt rounded-xl border border-border p-8 text-center">
      <h2 className="text-xl font-bold text-white mb-2">
        Complete Your Sign-Up
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        You're signed in — just pick a plan and pay to activate your membership.
        No admin approval needed.
      </p>

      <form
        onSubmit={handlePay}
        className="text-left space-y-4 max-w-sm mx-auto"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            className="p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="p-3 border border-border bg-surface-hover text-white placeholder-neutral-500 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-300">Plan</label>
          <select
            className="w-full p-3 border border-border bg-surface-hover text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            disabled={loadingTiers}
            required
          >
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} — ₹{tier.price} / {tier.durationDays} days
              </option>
            ))}
          </select>
        </div>

        {selectedTier && (
          <div className="bg-surface-hover rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-500">
              ₹{selectedTier.price}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {selectedTier.durationDays} days membership
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || loadingTiers}
          className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <CreditCard size={18} />
          {loading ? "Opening payment..." : "Pay & Activate Membership"}
        </button>
      </form>
    </div>
  );
}