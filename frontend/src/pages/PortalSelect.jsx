import { Link } from "react-router-dom";
import { ShieldCheck, User, Users } from "lucide-react";

export default function PortalSelect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MemberHub</h1>
          <p className="text-gray-500 mt-1">Choose how you'd like to sign in</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/login/admin"
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-8 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
              <ShieldCheck className="text-blue-600" size={28} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Admin Portal</h2>
            <p className="text-sm text-gray-500 mt-2">
              Manage members, generate certificates, and view reports.
            </p>
          </Link>

          <Link
            to="/login/member"
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-8 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
              <User className="text-emerald-600" size={28} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Member Portal</h2>
            <p className="text-sm text-gray-500 mt-2">
              View your profile and download your certificate.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
