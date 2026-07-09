import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { KeyRound, Tag, Plus, Trash2, Save, X } from "lucide-react";
import Layout from "../components/Layout";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Settings({ onLogout }) {
  // --- Password change ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmDeleteTierId, setConfirmDeleteTierId] = useState(null);
  const [deletingTier, setDeletingTier] = useState(false);

  // --- Tier management ---
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [editingTierId, setEditingTierId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newTier, setNewTier] = useState({
    name: "",
    price: "",
    durationDays: "",
  });
  const [savingTier, setSavingTier] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchTiers = async () => {
    setLoadingTiers(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/members/tiers",
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      await axios.put(
        "http://localhost:5000/api/auth/change-password",
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
        "http://localhost:5000/api/members/tiers",
        newTier,
        getAuthHeader(),
      );
      toast.success("Tier created!");
      setNewTier({ name: "", price: "", durationDays: "" });
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create tier");
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
    });
  };

  const handleSaveTierEdit = async (tierId) => {
    setSavingTier(true);
    try {
      await axios.put(
        `http://localhost:5000/api/members/tiers/${tierId}`,
        editForm,
        getAuthHeader(),
      );
      toast.success("Tier updated!");
      setEditingTierId(null);
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update tier");
    } finally {
      setSavingTier(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    setDeletingTier(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/members/tiers/${tierId}`,
        getAuthHeader(),
      );
      toast.success("Tier deleted");
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete tier");
    } finally {
      setDeletingTier(false);
      setConfirmDeleteTierId(null);
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Account / Password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 max-w-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <KeyRound size={18} className="text-gray-400" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            className="w-full p-3 border rounded-lg"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className="w-full p-3 border rounded-lg"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            className="w-full p-3 border rounded-lg"
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
            className="bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />{" "}
            {changingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Membership Tiers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tag size={18} className="text-gray-400" />
          Membership Tiers
        </h2>

        {loadingTiers ? (
          <p className="text-sm text-gray-400">Loading tiers...</p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-6">
            {tiers.map((tier) =>
              editingTierId === tier.id ? (
                <li key={tier.id} className="py-3 flex items-center gap-2">
                  <input
                    className="p-2 border rounded-lg text-sm flex-1 min-w-0"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <input
                    className="p-2 border rounded-lg text-sm w-24"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                  />
                  <input
                    className="p-2 border rounded-lg text-sm w-24"
                    type="number"
                    value={editForm.durationDays}
                    onChange={(e) =>
                      setEditForm({ ...editForm, durationDays: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleSaveTierEdit(tier.id)}
                    disabled={savingTier}
                    className="text-green-600 hover:bg-green-50 p-2 rounded-lg disabled:opacity-50"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setEditingTierId(null)}
                    className="text-gray-400 hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </li>
              ) : (
                <li
                  key={tier.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tier.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      ₹{tier.price} · {tier.durationDays} days
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEditingTier(tier)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteTierId(tier.id)}
                      className="text-red-500 hover:text-red-700"
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
          className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-gray-100"
        >
          <input
            className="p-2.5 border rounded-lg text-sm flex-1 min-w-0"
            placeholder="Tier name (e.g. Gold)"
            value={newTier.name}
            onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
            required
          />
          <input
            className="p-2.5 border rounded-lg text-sm w-28"
            type="number"
            step="0.01"
            placeholder="Price"
            value={newTier.price}
            onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
            required
          />
          <input
            className="p-2.5 border rounded-lg text-sm w-32"
            type="number"
            placeholder="Duration (days)"
            value={newTier.durationDays}
            onChange={(e) =>
              setNewTier({ ...newTier, durationDays: e.target.value })
            }
            required
          />
          <button
            type="submit"
            disabled={savingTier}
            className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 w-full sm:w-auto"
          >
            <Plus size={16} /> Add Tier
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteTierId}
        title="Delete this tier?"
        message="This can't be undone. Make sure no members are still assigned to it."
        loading={deletingTier}
        onConfirm={() => handleDeleteTier(confirmDeleteTierId)}
        onCancel={() => setConfirmDeleteTierId(null)}
      />
    </Layout>
  );
}