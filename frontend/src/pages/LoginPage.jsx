// import { useState } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";

// export default function LoginPage({ onLogin }) {
//   const { portal } = useParams(); // "admin" | "member"
//   const navigate = useNavigate();
//   const isAdminPortal = portal === "admin";

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const decodeRole = (token) => {
//     try {
//       return JSON.parse(atob(token.split(".")[1])).role;
//     } catch {
//       return null;
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", {
//         email,
//         password,
//       });

//       const role = decodeRole(res.data.token);
//       const expectedRole = isAdminPortal ? "ADMIN" : "MEMBER";

//       if (role !== expectedRole) {
//         setError(
//           `This account is a ${role?.toLowerCase()} account. Please use the ${
//             role === "ADMIN" ? "Admin" : "Member"
//           } Portal instead.`,
//         );
//         return;
//       }

//       localStorage.setItem("token", res.data.token);
//       onLogin();
//     } catch (err) {
//       setError("Invalid credentials!");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-8 rounded shadow-md w-96"
//       >
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

//         <input
//           className="w-full border p-2 mb-4"
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           className="w-full border p-2 mb-2"
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         <div className="text-right mb-4">
//           <Link
//             to="/forgot-password"
//             className="text-xs text-blue-600 hover:underline"
//           >
//             Forgot password?
//           </Link>
//         </div>

//         <button className="w-full bg-blue-600 text-white p-2 rounded">
//           Login
//         </button>

//         {!isAdminPortal && (
//           <p className="text-sm text-gray-500 mt-4 text-center">
//             Don&apos;t have an account?{" "}
//             <Link to="/register" className="text-blue-600 font-medium">
//               Create one
//             </Link>
//           </p>
//         )}
//       </form>
//     </div>
//   );
// }











import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const { portal } = useParams(); // "admin" | "member"
  const navigate = useNavigate();
  const isAdminPortal = portal === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const decodeRole = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const role = decodeRole(res.data.token);
      const expectedRole = isAdminPortal ? "ADMIN" : "MEMBER";

      if (role !== expectedRole) {
        setError(
          `This account is a ${role?.toLowerCase()} account. Please use the ${
            role === "ADMIN" ? "Admin" : "Member"
          } Portal instead.`,
        );
        return;
      }

      localStorage.setItem("token", res.data.token);
      onLogin();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h2 className="text-2xl font-bold mb-4">
          {isAdminPortal ? "Admin Login" : "Member Login"}
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        <input
          className="w-full border p-2 mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-2">
          <input
            className="w-full border p-2 pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="text-right mb-4">
          <Link
            to="/forgot-password"
            className="text-xs text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>

        {!isAdminPortal && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-blue-600 font-medium">
              Create one
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}