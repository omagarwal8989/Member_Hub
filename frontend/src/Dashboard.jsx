// import { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
// } from "recharts";
// import { Download, UserPlus, Users, SearchX } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import MemberForm from "./components/MemberForm";
// import CertificateModal from "./components/CertificateModal";
// import Layout from "./components/Layout";

// const STATUS_FILTERS = ["ALL", "ACTIVE", "EXPIRING", "INACTIVE"];

// export default function Dashboard({ onLogout }) {
//   const navigate = useNavigate();
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [certModalMember, setCertModalMember] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   const fetchMembers = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(
//         "http://localhost:5000/api/members",
//         getAuthHeader(),
//       );
//       setMembers(response.data);
//     } catch (error) {
//       console.error("Error fetching members:", error);
//       if (error.response?.status === 403) onLogout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   // Filter members by search query (name/email) and status
//   const filteredMembers = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     return members.filter((member) => {
//       const matchesStatus =
//         statusFilter === "ALL" || member.status === statusFilter;
//       if (!matchesStatus) return false;
//       if (!q) return true;
//       const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
//       return fullName.includes(q) || member.email?.toLowerCase().includes(q);
//     });
//   }, [members, searchQuery, statusFilter]);

//   const activeCount = members.filter((m) => m.status === "ACTIVE").length;
//   const expiringCount = members.filter((m) => m.status === "EXPIRING").length;
//   const chartData = [
//     { name: "Active", value: activeCount },
//     { name: "Expiring", value: expiringCount },
//   ];
//   const COLORS = ["#10b981", "#f59e0b"];

//   return (
//     <Layout
//       onLogout={onLogout}
//       searchQuery={searchQuery}
//       onSearchChange={setSearchQuery}
//     >
//       <Toaster position="top-right" />

//       {/* Stats Row */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
//           <h2 className="text-lg font-bold text-gray-800 mb-2">
//             Member Overview
//           </h2>
//           <div className="h-48">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={chartData}
//                   dataKey="value"
//                   nameKey="name"
//                   outerRadius={70}
//                   innerRadius={50}
//                   paddingAngle={5}
//                 >
//                   {chartData.map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={COLORS[index % COLORS.length]}
//                     />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//         <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center items-center relative overflow-hidden">
//           <Users
//             size={120}
//             className="absolute opacity-10 -right-4 -bottom-4"
//           />
//           <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wider mb-2">
//             Total Members
//           </h3>
//           <p className="text-6xl font-bold">{members.length}</p>
//         </div>
//       </div>

//       {/* Directory Header */}
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
//         <h2 className="text-xl font-bold text-gray-800">
//           Member Directory
//           {filteredMembers.length !== members.length && (
//             <span className="ml-2 text-sm font-normal text-gray-500">
//               ({filteredMembers.length} of {members.length})
//             </span>
//           )}
//         </h2>

//         <div className="flex items-center gap-3">
//           {/* Status filter pills */}
//           <div className="flex bg-gray-100 rounded-lg p-1">
//             {STATUS_FILTERS.map((status) => (
//               <button
//                 key={status}
//                 onClick={() => setStatusFilter(status)}
//                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
//                   statusFilter === status
//                     ? "bg-white text-blue-700 shadow-sm"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 {status === "ALL"
//                   ? "All"
//                   : status.charAt(0) + status.slice(1).toLowerCase()}
//               </button>
//             ))}
//           </div>

//           <button
//             onClick={() => setShowForm(true)}
//             className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 whitespace-nowrap"
//           >
//             <UserPlus size={18} /> Add New Member
//           </button>
//         </div>
//       </div>

//       {/* Member Form Modal */}
//       {showForm && (
//         <MemberForm
//           onCancel={() => setShowForm(false)}
//           onMemberAdded={() => {
//             setShowForm(false);
//             fetchMembers();
//             toast.success("Member added successfully!");
//           }}
//         />
//       )}

//       {/* Certificate Customization Modal */}
//       {certModalMember && (
//         <CertificateModal
//           member={certModalMember}
//           onClose={() => setCertModalMember(null)}
//         />
//       )}

//       {/* Member Table */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
//         {loading ? (
//           <div className="p-12 text-center text-gray-400 text-sm">
//             Loading members...
//           </div>
//         ) : filteredMembers.length === 0 ? (
//           <div className="p-12 text-center">
//             <SearchX className="mx-auto mb-3 text-gray-300" size={36} />
//             <p className="text-gray-500 font-medium">No members found</p>
//             <p className="text-sm text-gray-400 mt-1">
//               Try a different search term or filter.
//             </p>
//           </div>
//         ) : (
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
//                   Member
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
//                   Tier
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
//                   Status
//                 </th>
//                 <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {filteredMembers.map((member) => (
//                 <tr
//                   key={member.id}
//                   onClick={() => navigate(`/members/${member.id}`)}
//                   className="hover:bg-gray-50 transition-colors cursor-pointer"
//                 >
//                   <td className="px-6 py-4">
//                     <div className="text-sm font-medium text-gray-900">
//                       {member.firstName} {member.lastName}
//                     </div>
//                     <div className="text-sm text-gray-500">{member.email}</div>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-600">
//                     {member.tier?.name || "Gold"}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span
//                       className={`px-2.5 py-1 rounded-full text-xs font-medium ${
//                         member.status === "ACTIVE"
//                           ? "bg-green-100 text-green-700"
//                           : member.status === "EXPIRING"
//                             ? "bg-amber-100 text-amber-700"
//                             : "bg-red-100 text-red-700"
//                       }`}
//                     >
//                       {member.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setCertModalMember(member);
//                       }}
//                       className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1"
//                     >
//                       <Download size={16} /> Certificate
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </Layout>
//   );
// }











import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Download, UserPlus, Users, SearchX } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import MemberForm from "./components/MemberForm";
import CertificateModal from "./components/CertificateModal";
import Layout from "./components/Layout";

const STATUS_FILTERS = ["ALL", "ACTIVE", "EXPIRING", "INACTIVE"];

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [certModalMember, setCertModalMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/members",
        getAuthHeader(),
      );
      setMembers(response.data);
    } catch (error) {
      console.error("Error fetching members:", error);
      if (error.response?.status === 403) onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter members by search query (name/email) and status
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const matchesStatus =
        statusFilter === "ALL" || member.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return fullName.includes(q) || member.email?.toLowerCase().includes(q);
    });
  }, [members, searchQuery, statusFilter]);

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const expiringCount = members.filter((m) => m.status === "EXPIRING").length;
  const inactiveCount = members.filter((m) => m.status === "INACTIVE").length;
  const chartData = [
    { name: "Active", value: activeCount },
    { name: "Expiring", value: expiringCount },
    { name: "Inactive", value: inactiveCount },
  ];
  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <Layout
      onLogout={onLogout}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <Toaster position="top-right" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Member Overview
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={70}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center items-center relative overflow-hidden">
          <Users
            size={120}
            className="absolute opacity-10 -right-4 -bottom-4"
          />
          <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wider mb-2">
            Total Members
          </h3>
          <p className="text-6xl font-bold">{members.length}</p>
        </div>
      </div>

      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Member Directory
          {filteredMembers.length !== members.length && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredMembers.length} of {members.length})
            </span>
          )}
        </h2>

        <div className="flex items-center gap-3">
          {/* Status filter pills */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={18} /> Add New Member
          </button>
        </div>
      </div>

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          onCancel={() => setShowForm(false)}
          onMemberAdded={() => {
            setShowForm(false);
            fetchMembers();
            toast.success("Member added successfully!");
          }}
        />
      )}

      {/* Certificate Customization Modal */}
      {certModalMember && (
        <CertificateModal
          member={certModalMember}
          onClose={() => setCertModalMember(null)}
        />
      )}

      {/* Member Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <SearchX className="mx-auto mb-3 text-gray-300" size={36} />
            <p className="text-gray-500 font-medium">No members found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different search term or filter.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.tier?.name || "Gold"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : member.status === "EXPIRING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCertModalMember(member);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1"
                    >
                      <Download size={16} /> Certificate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}