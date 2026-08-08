// import { useState } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
// import { GoogleLogin } from "@react-oauth/google";

// export default function LoginPage({ onLogin }) {
//   const { portal } = useParams(); // "admin" | "member"
//   const navigate = useNavigate();
//   const isAdminPortal = portal === "admin";

//   // --- Shared email/password state (admin login AND member login) ---
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   // --- Member: first-time sign-up (OTP + create password) ---
//   const [mode, setMode] = useState("login"); // "login" | "signup-email" | "signup-otp"
//   const [signupEmail, setSignupEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [sendingOtp, setSendingOtp] = useState(false);
//   const [verifying, setVerifying] = useState(false);

//   const [error, setError] = useState("");

//   const decodeRole = (token) => {
//     try {
//       return JSON.parse(atob(token.split(".")[1])).role;
//     } catch {
//       return null;
//     }
//   };

//   const finishLogin = (token, expectedRole) => {
//     const role = decodeRole(token);
//     if (role !== expectedRole) {
//       setError(
//         `This account is a ${role?.toLowerCase()} account. Please use the ${
//           role === "ADMIN" ? "Admin" : "Member"
//         } Portal instead.`,
//       );
//       return;
//     }
//     localStorage.setItem("token", token);
//     onLogin();
//   };

//   // --- Login (admin, and member once they have a password) ---
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", {
//         email,
//         password,
//       });
//       finishLogin(res.data.token, isAdminPortal ? "ADMIN" : "MEMBER");
//     } catch (err) {
//       if (err.code === "ERR_NETWORK" || !err.response) {
//         setError(
//           "Can't reach the server. Is your backend running on port 5000?",
//         );
//       } else if (err.response.status === 401) {
//         setError("Invalid credentials!");
//       } else {
//         setError("Something went wrong. Please try again.");
//       }
//     }
//   };

//   // --- Member: Google login ---
//   const handleGoogleSuccess = async (credentialResponse) => {
//     setError("");
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/google", {
//         credential: credentialResponse.credential,
//       });
//       finishLogin(res.data.token, "MEMBER");
//     } catch (err) {
//       setError(
//         err.response?.data?.error || "Google sign-in failed. Please try again.",
//       );
//     }
//   };

//   // --- Member: sign-up step 1 — request OTP ---
//   const handleRequestOtp = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSendingOtp(true);
//     try {
//       await axios.post("http://localhost:5000/api/auth/otp/request", {
//         email: signupEmail,
//       });
//       setMode("signup-otp");
//     } catch (err) {
//       setError(
//         err.response?.data?.error || "Failed to send code. Please try again.",
//       );
//     } finally {
//       setSendingOtp(false);
//     }
//   };

//   // --- Member: sign-up step 2 — verify OTP + set password ---
//   const handleVerifyAndCreatePassword = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (newPassword !== confirmPassword) {
//       setError("Passwords don't match.");
//       return;
//     }

//     setVerifying(true);
//     try {
//       const res = await axios.post(
//         "http://localhost:5000/api/auth/otp/verify-signup",
//         { email: signupEmail, otp, password: newPassword },
//       );
//       finishLogin(res.data.token, "MEMBER");
//     } catch (err) {
//       setError(err.response?.data?.error || "Invalid or expired code.");
//     } finally {
//       setVerifying(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="bg-white p-8 rounded shadow-md w-96">
//         <button
//           type="button"
//           onClick={() => navigate("/")}
//           className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
//         >
//           <ArrowLeft size={14} /> Back
//         </button>

//         <h2 className="text-2xl font-bold mb-4">
//           {isAdminPortal ? "Admin Login" : "Member Login"}
//         </h2>

//         {error && (
//           <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
//             {error}
//           </div>
//         )}

//         {isAdminPortal ? (
//           // --- ADMIN: unchanged email/password form ---
//           <form onSubmit={handleLogin}>
//             <input
//               className="w-full border p-2 mb-4"
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <div className="relative mb-2">
//               <input
//                 className="w-full border p-2 pr-10"
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((prev) => !prev)}
//                 className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 tabIndex={-1}
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>

//             <div className="text-right mb-4">
//               <Link
//                 to="/forgot-password"
//                 className="text-xs text-blue-600 hover:underline"
//               >
//                 Forgot password?
//               </Link>
//             </div>

//             <button className="w-full bg-blue-600 text-white p-2 rounded">
//               Login
//             </button>
//           </form>
//         ) : mode === "login" ? (
//           // --- MEMBER: email + password login ---
//           <div className="space-y-5">
//             <div className="flex justify-center">
//               <GoogleLogin
//                 onSuccess={handleGoogleSuccess}
//                 onError={() => setError("Google sign-in failed.")}
//               />
//             </div>

//             <div className="flex items-center gap-3 text-xs text-gray-400">
//               <div className="flex-1 h-px bg-gray-200" />
//               OR
//               <div className="flex-1 h-px bg-gray-200" />
//             </div>

//             <form onSubmit={handleLogin}>
//               <input
//                 className="w-full border p-2 mb-4"
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//               <div className="relative mb-2">
//                 <input
//                   className="w-full border p-2 pr-10"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                   tabIndex={-1}
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>

//               <div className="text-right mb-4">
//                 <Link
//                   to="/forgot-password"
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>

//               <button className="w-full bg-blue-600 text-white p-2 rounded">
//                 Login
//               </button>
//             </form>

//             <p className="text-sm text-gray-500 text-center">
//               First time here?{" "}
//               <button
//                 type="button"
//                 onClick={() => {
//                   setMode("signup-email");
//                   setError("");
//                 }}
//                 className="text-blue-600 font-medium hover:underline"
//               >
//                 Verify your email to get started
//               </button>
//             </p>
//           </div>
//         ) : mode === "signup-email" ? (
//           // --- MEMBER: sign-up step 1 — enter email, request OTP ---
//           <form onSubmit={handleRequestOtp} className="space-y-3">
//             <p className="text-sm text-gray-500 mb-2">
//               Enter your email and we'll send you a verification code to set up
//               your account.
//             </p>
//             <div className="relative">
//               <Mail
//                 size={16}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//               />
//               <input
//                 className="w-full border p-2 pl-9 rounded"
//                 type="email"
//                 placeholder="Email address"
//                 value={signupEmail}
//                 onChange={(e) => setSignupEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={sendingOtp}
//               className="w-full bg-gray-800 text-white p-2 rounded disabled:opacity-50"
//             >
//               {sendingOtp ? "Sending code..." : "Send Verification Code"}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 setMode("login");
//                 setError("");
//               }}
//               className="w-full text-xs text-gray-400 hover:text-gray-600"
//             >
//               Back to login
//             </button>
//           </form>
//         ) : (
//           // --- MEMBER: sign-up step 2 — enter OTP + create password ---
//           <form onSubmit={handleVerifyAndCreatePassword} className="space-y-3">
//             <p className="text-sm text-gray-500">
//               Enter the 6-digit code sent to{" "}
//               <span className="font-medium text-gray-700">{signupEmail}</span>,
//               then choose a password.
//             </p>
//             <input
//               className="w-full border p-2 rounded text-center tracking-[0.3em] text-lg"
//               type="text"
//               inputMode="numeric"
//               maxLength={6}
//               placeholder="------"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//               required
//             />
//             <input
//               className="w-full border p-2 rounded"
//               type="password"
//               placeholder="Create password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               minLength={6}
//               required
//             />
//             <input
//               className="w-full border p-2 rounded"
//               type="password"
//               placeholder="Confirm password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               minLength={6}
//               required
//             />
//             <button
//               type="submit"
//               disabled={verifying || otp.length !== 6}
//               className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
//             >
//               {verifying ? "Verifying..." : "Verify & Create Account"}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 setMode("signup-email");
//                 setOtp("");
//                 setError("");
//               }}
//               className="w-full text-xs text-gray-400 hover:text-gray-600"
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
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, Mail, Dumbbell } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { API_BASE_URL } from "../config.js";


export default function LoginPage({ onLogin }) {
  const { portal } = useParams();
  const navigate = useNavigate();
  const isAdminPortal = portal === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [mode, setMode] = useState("login");
  const [signupEmail, setSignupEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");

  const decodeRole = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  };

  const finishLogin = (token, expectedRole) => {
    const role = decodeRole(token);
    if (role !== expectedRole) {
      setError(
        `This account is a ${role?.toLowerCase()} account. Please use the ${
          role === "ADMIN" ? "Admin" : "Member"
        } Portal instead.`,
      );
      return;
    }
    localStorage.setItem("token", token);
    onLogin();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      finishLogin(res.data.token, isAdminPortal ? "ADMIN" : "MEMBER");
    } catch (err) {
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError(
          "Can't reach the server. Is your backend running on port 5000?",
        );
      } else if (err.response.status === 401) {
        setError("Invalid credentials!");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        credential: credentialResponse.credential,
      });
      finishLogin(res.data.token, "MEMBER");
    } catch (err) {
      setError(
        err.response?.data?.error || "Google sign-in failed. Please try again.",
      );
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSendingOtp(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/otp/request`, {
        email: signupEmail,
      });
      setMode("signup-otp");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to send code. Please try again.",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndCreatePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setVerifying(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/otp/verify-signup`,
        { email: signupEmail, otp, password: newPassword },
      );
      finishLogin(res.data.token, "MEMBER");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  };

  const inputClass =
    "w-full border border-border bg-surface-hover text-white placeholder-neutral-500 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="bg-surface-alt border border-border p-8 rounded-2xl shadow-2xl shadow-black/50 w-96">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-4"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <Dumbbell className="text-white" size={18} />
          </div>
          <h2
            className="text-xl text-white tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAdminPortal ? "STAFF LOGIN" : "MEMBER LOGIN"}
          </h2>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            {error}
          </div>
        )}

        {isAdminPortal ? (
          <form onSubmit={handleLogin}>
            <input
              className={`${inputClass} mb-4`}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative mb-2">
              <input
                className={`${inputClass} pr-10`}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="text-right mb-4">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-500 hover:text-brand-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
              Login
            </button>
          </form>
        ) : mode === "login" ? (
          <div className="space-y-5">
            <div className="flex justify-center [&>div]:!bg-transparent">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed.")}
                theme="filled_black"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-600">
              <div className="flex-1 h-px bg-border" />
              OR
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleLogin}>
              <input
                className={`${inputClass} mb-4`}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative mb-2">
                <input
                  className={`${inputClass} pr-10`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="text-right mb-4">
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                Login
              </button>
            </form>

            <p className="text-sm text-neutral-500 text-center">
              First time here?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup-email");
                  setError("");
                }}
                className="text-brand-500 font-medium hover:text-brand-400 hover:underline"
              >
                Verify your email to get started
              </button>
            </p>
          </div>
        ) : mode === "signup-email" ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <p className="text-sm text-neutral-400 mb-2">
              Enter your email and we'll send you a verification code to set up
              your account.
            </p>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                className={`${inputClass} pl-9`}
                type="email"
                placeholder="Email address"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={sendingOtp}
              // className="w-full bg-neutral-700 text-white p-2.5 rounded-lg font-medium hover:bg-neutral-600 disabled:opacity-50 transition-colors"
              className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {sendingOtp ? "Sending code..." : "Send Verification Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="w-full text-xs text-neutral-500 hover:text-neutral-300"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndCreatePassword} className="space-y-3">
            <p className="text-sm text-neutral-400">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-neutral-200">
                {signupEmail}
              </span>
              , then choose a password.
            </p>
            <input
              className={`${inputClass} text-center tracking-[0.3em] text-lg`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Create password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={verifying || otp.length !== 6}
              className="w-full bg-brand-600 text-white p-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {verifying ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup-email");
                setOtp("");
                setError("");
              }}
              className="w-full text-xs text-neutral-500 hover:text-neutral-300"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}