// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import {
//   LayoutDashboard,
//   Users,
//   Settings as SettingsIcon,
//   LogOut,
//   Bell,
//   Search,
//   BarChart3,
//   UserPlus,
//   UserMinus,
//   Award,
// } from "lucide-react";
// import { Link, useLocation } from "react-router-dom";

// const LAST_SEEN_KEY = "memberhub_activity_last_seen";

// export default function Layout({
//   children,
//   onLogout,
//   userEmail = "admin@memberhub.com",
//   searchQuery = "",
//   onSearchChange,
// }) {
//   const location = useLocation();
//   const isActive = (path) =>
//     path === "/"
//       ? location.pathname === "/"
//       : location.pathname.startsWith(path);

//   const navLinkClass = (path) =>
//     `flex items-center px-3 py-2.5 rounded-lg font-medium group transition-colors ${
//       isActive(path)
//         ? "bg-blue-50 text-blue-700"
//         : "text-gray-600 hover:bg-gray-50"
//     }`;

//   const navIconClass = (path) =>
//     `mr-3 w-5 h-5 ${
//       isActive(path)
//         ? "text-blue-600 group-hover:text-blue-700"
//         : "text-gray-400 group-hover:text-gray-600"
//     }`;

//   // --- Notification bell ---
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [activity, setActivity] = useState([]);
//   const [loadingActivity, setLoadingActivity] = useState(false);
//   // Timestamp of the last time the admin actually opened the dropdown,
//   // persisted across page reloads/logins via localStorage. Anything in
//   // `activity` newer than this counts as "unseen."
//   const [lastSeenAt, setLastSeenAt] = useState(
//     () => localStorage.getItem(LAST_SEEN_KEY) || null,
//   );
//   const bellRef = useRef(null);

//   const fetchActivity = async () => {
//     setLoadingActivity(true);
//     try {
//       const res = await axios.get(
//         "http://localhost:5000/api/members/activity/recent",
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         },
//       );
//       setActivity(res.data);
//     } catch (error) {
//       // Fails silently — the bell just shows nothing rather than an error
//     } finally {
//       setLoadingActivity(false);
//     }
//   };

//   const hasUnread = activity.some(
//     (entry) => !lastSeenAt || new Date(entry.createdAt) > new Date(lastSeenAt),
//   );

//   const toggleNotifications = () => {
//     const next = !showNotifications;
//     setShowNotifications(next);
//     if (next) {
//       fetchActivity();
//       // Mark everything currently known as "seen" the moment the admin
//       // opens the dropdown — not when they close it — so the dot clears
//       // immediately rather than waiting for another render cycle.
//       const now = new Date().toISOString();
//       localStorage.setItem(LAST_SEEN_KEY, now);
//       setLastSeenAt(now);
//     }
//   };

//   useEffect(() => {
//     fetchActivity();
//     // Poll for new activity periodically so the dot can appear even while
//     // the admin is on the page without having opened the bell yet.
//     const interval = setInterval(fetchActivity, 3600000);        // - I set it to 1 hr so that it polls after evry 1 hr
//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (bellRef.current && !bellRef.current.contains(e.target)) {
//         setShowNotifications(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const activityIcon = (type) => {
//     if (type === "MEMBER_ADDED")
//       return <UserPlus size={16} className="text-emerald-600" />;
//     if (type === "MEMBER_DELETED")
//       return <UserMinus size={16} className="text-red-500" />;
//     if (type === "CERTIFICATE_ISSUED")
//       return <Award size={16} className="text-blue-600" />;
//     return <Bell size={16} className="text-gray-400" />;
//   };

//   const timeAgo = (dateStr) => {
//     const diffMs = Date.now() - new Date(dateStr).getTime();
//     const mins = Math.floor(diffMs / 60000);
//     if (mins < 1) return "just now";
//     if (mins < 60) return `${mins}m ago`;
//     const hours = Math.floor(mins / 60);
//     if (hours < 24) return `${hours}h ago`;
//     return `${Math.floor(hours / 24)}d ago`;
//   };

//   const isUnread = (entry) =>
//     !lastSeenAt || new Date(entry.createdAt) > new Date(lastSeenAt);

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
//         {/* Logo Area */}
//         <div className="h-16 flex items-center px-6 border-b border-gray-200">
//           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
//             <Users className="text-white" size={20} />
//           </div>
//           <span className="text-xl font-bold text-gray-900 tracking-tight">
//             MemberHub
//           </span>
//         </div>

//         {/* Navigation Links */}
//         <nav className="flex-1 px-4 py-6 space-y-1">
//           <Link to="/" className={navLinkClass("/")}>
//             <LayoutDashboard className={navIconClass("/")} />
//             Dashboard
//           </Link>
//           <Link to="/reports" className={navLinkClass("/reports")}>
//             <BarChart3 className={navIconClass("/reports")} />
//             Reports
//           </Link>
//           {/* Settings page */}
//           <Link to="/settings" className={navLinkClass("/settings")}>
//             <SettingsIcon className={navIconClass("/settings")} />
//             Settings
//           </Link>
//         </nav>

//         {/* Sidebar Footer (Logout) */}
//         <div className="p-4 border-t border-gray-200">
//           <button
//             onClick={onLogout}
//             className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
//           >
//             <LogOut className="mr-3 w-5 h-5" />
//             Log Out
//           </button>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top Header */}
//         <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
//           {/* Search Bar */}
//           <div className="flex items-center text-gray-400 bg-gray-100 px-3 py-2 rounded-lg w-64 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
//             <Search className="w-4 h-4 mr-2 shrink-0" />
//             <input
//               type="text"
//               placeholder="Search members..."
//               value={searchQuery}
//               onChange={(e) => onSearchChange?.(e.target.value)}
//               className="bg-transparent border-none outline-none text-sm text-gray-700 w-full"
//             />
//           </div>

//           {/* User Profile Area */}
//           <div className="flex items-center gap-6">
//             <div className="relative" ref={bellRef}>
//               <button
//                 onClick={toggleNotifications}
//                 className="text-gray-400 hover:text-gray-600 transition-colors relative"
//               >
//                 <Bell className="w-5 h-5" />
//                 {hasUnread && (
//                   <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
//                   <div className="px-4 py-3 border-b border-gray-100">
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Recent Activity
//                     </h3>
//                   </div>
//                   <div className="max-h-80 overflow-y-auto">
//                     {loadingActivity ? (
//                       <p className="text-sm text-gray-400 p-4">Loading...</p>
//                     ) : activity.length === 0 ? (
//                       <p className="text-sm text-gray-400 p-4">
//                         No recent activity yet.
//                       </p>
//                     ) : (
//                       activity.map((entry) => (
//                         <div
//                           key={entry.id}
//                           className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
//                             isUnread(entry) ? "bg-blue-50/50" : ""
//                           }`}
//                         >
//                           <div className="mt-0.5 relative">
//                             {activityIcon(entry.type)}
//                             {isUnread(entry) && (
//                               <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
//                             )}
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm text-gray-700">
//                               {entry.message}
//                             </p>
//                             <p className="text-xs text-gray-400 mt-0.5">
//                               {timeAgo(entry.createdAt)}
//                             </p>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//             <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
//               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
//                 {userEmail.charAt(0).toUpperCase()}
//               </div>
//               <span className="text-sm font-medium text-gray-700">
//                 {userEmail}
//               </span>
//             </div>
//           </div>
//         </header>

//         {/* Page Content (This is where the Dashboard will render) */}
//         <main className="flex-1 overflow-auto p-8">{children}</main>
//       </div>
//     </div>
//   );
// }









import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  BarChart3,
  UserPlus,
  UserMinus,
  Award,
  Dumbbell,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { API_BASE_URL } from "../config.js";


const LAST_SEEN_KEY = "memberhub_activity_last_seen";

export default function Layout({
  children,
  onLogout,
  userEmail = "admin@memberhub.com",
  searchQuery = "",
  onSearchChange,
}) {
  const location = useLocation();
  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const navLinkClass = (path) =>
    `flex items-center px-3 py-2.5 rounded-lg font-medium group transition-colors ${
      isActive(path)
        ? "bg-brand-600/10 text-brand-500"
        : "text-neutral-400 hover:bg-surface-hover hover:text-neutral-200"
    }`;

  const navIconClass = (path) =>
    `mr-3 w-5 h-5 ${
      isActive(path)
        ? "text-brand-500"
        : "text-neutral-500 group-hover:text-neutral-300"
    }`;

  // --- Notification bell ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(
    () => localStorage.getItem(LAST_SEEN_KEY) || null,
  );


  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  const bellRef = useRef(null);




  // const fetchActivity = async () => {
  //   setLoadingActivity(true);
  //   try {
  //     const res = await axios.get(
  //       // "http://localhost:5000/api/members/activity/recent",
  //       "`${API_BASE_URL}/api/members/activity/recent",
  //       {
  //         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //       },
  //     );
  //     setActivity(res.data);
  //   } catch (error) {
  //     // Fails silently
  //   } finally {
  //     setLoadingActivity(false);
  //   }
  // };


  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/members/activity/recent`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      // Defensive: only ever accept a real array. If the backend ever
      // returns something else (an error object, HTML, etc.), silently
      // fall back to empty rather than crashing the whole Layout.
      setActivity(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch activity:", error); // <-- was fully silent before, now visible for debugging
      setActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };





  const hasUnread = activity.some(
    (entry) => !lastSeenAt || new Date(entry.createdAt) > new Date(lastSeenAt),
  );

  const toggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      fetchActivity();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SEEN_KEY, now);
      setLastSeenAt(now);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activityIcon = (type) => {
    if (type === "MEMBER_ADDED")
      return <UserPlus size={16} className="text-emerald-400" />;
    if (type === "MEMBER_DELETED")
      return <UserMinus size={16} className="text-red-400" />;
    if (type === "CERTIFICATE_ISSUED")
      return <Award size={16} className="text-brand-400" />;
    return <Bell size={16} className="text-neutral-500" />;
  };

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isUnread = (entry) =>
    !lastSeenAt || new Date(entry.createdAt) > new Date(lastSeenAt);

  return (
    <div className="flex h-screen bg-surface font-sans">
      {/* Sidebar */}
      {/* <aside className="w-64 bg-surface-alt border-r border-border flex flex-col"> */}
      {/* Logo Area */}
      {/* <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3">
            <Dumbbell className="text-white" size={18} />
          </div>
          <span
            className="text-lg text-white tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MEMBERHUB
          </span>
        </div> */}

      {/* Navigation Links */}
      {/* <nav className="flex-1 px-4 py-6 space-y-1">
          <Link to="/" className={navLinkClass("/")}>
            <LayoutDashboard className={navIconClass("/")} />
            Dashboard
          </Link>
          <Link to="/reports" className={navLinkClass("/reports")}>
            <BarChart3 className={navIconClass("/reports")} />
            Reports
          </Link>
          <Link to="/settings" className={navLinkClass("/settings")}>
            <SettingsIcon className={navIconClass("/settings")} />
            Settings
          </Link>
        </nav> */}

      {/* Sidebar Footer (Logout) */}
      {/* <div className="p-4 border-t border-border">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-medium transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside> */}

      {/* Mobile overlay — click to close sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-alt border-r border-border flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3">
              <Dumbbell className="text-white" size={18} />
            </div>
            <span
              className="text-lg text-white tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              MEMBERHUB
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            to="/"
            className={navLinkClass("/")}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className={navIconClass("/")} />
            Dashboard
          </Link>
          <Link
            to="/reports"
            className={navLinkClass("/reports")}
            onClick={() => setSidebarOpen(false)}
          >
            <BarChart3 className={navIconClass("/reports")} />
            Reports
          </Link>
          <Link
            to="/settings"
            className={navLinkClass("/settings")}
            onClick={() => setSidebarOpen(false)}
          >
            <SettingsIcon className={navIconClass("/settings")} />
            Settings
          </Link>
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-medium transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        {/* <header className="h-16 bg-surface-alt border-b border-border flex items-center justify-between px-8"> */}
        {/* Search Bar */}
        {/* <div className="flex items-center text-neutral-500 bg-surface-hover px-3 py-2 rounded-lg w-64 focus-within:ring-2 focus-within:ring-brand-600 transition-all"> */}

        <header className="h-16 bg-surface-alt border-b border-border flex items-center justify-between px-4 sm:px-8 gap-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-400 hover:text-white shrink-0"
          >
            <Menu size={22} />
          </button>

          {/* Search Bar */}
          <div className="flex items-center text-neutral-500 bg-surface-hover px-3 py-2 rounded-lg flex-1 max-w-64 focus-within:ring-2 focus-within:ring-brand-600 transition-all">
            <Search className="w-4 h-4 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-neutral-200 placeholder-neutral-500 w-full"
            />
          </div>

          {/* User Profile Area */}

          {/* <div className="flex items-center gap-6"> */}

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggleNotifications}
                className="text-neutral-400 hover:text-white transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-surface-alt"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-surface-alt rounded-xl border border-border shadow-xl shadow-black/40 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-white">
                      Recent Activity
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingActivity ? (
                      <p className="text-sm text-neutral-500 p-4">Loading...</p>
                    ) : activity.length === 0 ? (
                      <p className="text-sm text-neutral-500 p-4">
                        No recent activity yet.
                      </p>
                    ) : (
                      activity.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover ${
                            isUnread(entry) ? "bg-brand-600/5" : ""
                          }`}
                        >
                          <div className="mt-0.5 relative">
                            {activityIcon(entry.type)}
                            {isUnread(entry) && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-300">
                              {entry.message}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {timeAgo(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* <div className="flex items-center gap-3 border-l border-border pl-6"> */}
            <div className="flex items-center gap-3 border-l border-border pl-3 sm:pl-6">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {userEmail.charAt(0).toUpperCase()}
              </div>

              {/* <span className="text-sm font-medium text-neutral-300"> */}
              <span className="hidden sm:inline text-sm font-medium text-neutral-300">
                {userEmail}
              </span>
            </div>
          </div>
        </header>



        {/* Page Content */}
        {/* <main className="flex-1 overflow-auto p-8">{children}</main> */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">{children}</main>


      </div>
    </div>
  );
}