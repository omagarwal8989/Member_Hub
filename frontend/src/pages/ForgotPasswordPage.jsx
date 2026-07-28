// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";

// export default function ForgotPasswordPage() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleRequestOtp = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const res = await axios.post(
//         "http://localhost:5000/api/auth/forgot-password",
//         { email },
//       );
//       setMessage(res.data.message);
//       setStep(2);
//     } catch (err) {
//       setError("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (newPassword !== confirmPassword) {
//       setError("Passwords don't match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axios.post("http://localhost:5000/api/auth/reset-password", {
//         email,
//         otp,
//         newPassword,
//       });
//       navigate("/", { state: { passwordResetSuccess: true } });
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to reset password.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="bg-white p-8 rounded shadow-md w-96">
//         <Link
//           to="/"
//           className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
//         >
//           <ArrowLeft size={14} /> Back to login
//         </Link>

//         <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
//         <p className="text-sm text-gray-500 mb-4">
//           {step === 1
//             ? "Enter your account email and we'll send you a one-time code."
//             : `Enter the code sent to ${email} and choose a new password.`}
//         </p>

//         {error && (
//           <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
//             {error}
//           </div>
//         )}
//         {message && step === 2 && (
//           <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">
//             {message}
//           </div>
//         )}

//         {step === 1 ? (
//           <form onSubmit={handleRequestOtp}>
//             <input
//               className="w-full border p-2 mb-4"
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//             <button
//               disabled={loading}
//               className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
//             >
//               {loading ? "Sending..." : "Send Reset Code"}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleResetPassword}>
//             <input
//               className="w-full border p-2 mb-4 tracking-widest text-center font-mono"
//               type="text"
//               placeholder="6-digit code"
//               maxLength={6}
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//               required
//             />
//             <input
//               className="w-full border p-2 mb-4"
//               type="password"
//               placeholder="New password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               required
//               minLength={6}
//             />
//             <input
//               className="w-full border p-2 mb-4"
//               type="password"
//               placeholder="Confirm new password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               required
//               minLength={6}
//             />
//             <button
//               disabled={loading}
//               className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
//             >
//               {loading ? "Resetting..." : "Reset Password"}
//             </button>
//             <button
//               type="button"
//               onClick={() => setStep(1)}
//               className="w-full text-sm text-gray-500 mt-3"
//             >
//               Use a different email
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }









import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Dumbbell } from "lucide-react";

import { API_BASE_URL } from "../config.js";


export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        // "http://localhost:5000/api/auth/forgot-password",
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email },
      );
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });
      navigate("/", { state: { passwordResetSuccess: true } });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-border bg-surface-hover text-white placeholder-neutral-500 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-96">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-4"
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <Dumbbell className="text-white" size={18} />
          </div>
          <h2
            className="text-xl text-white tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FORGOT PASSWORD
          </h2>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          {step === 1
            ? "Enter your account email and we'll send you a one-time code."
            : `Enter the code sent to ${email} and choose a new password.`}
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            {error}
          </div>
        )}
        {message && step === 2 && (
          <div className="mb-4 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <input
              className={`${inputClass} mb-4`}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input
              className={`${inputClass} mb-4 tracking-widest text-center font-mono`}
              type="text"
              placeholder="6-digit code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <input
              className={`${inputClass} mb-4`}
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              className={`${inputClass} mb-4`}
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              disabled={loading}
              className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-neutral-500 hover:text-neutral-300 mt-3"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}