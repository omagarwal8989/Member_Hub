import { useState, useEffect } from "react";
import axios from "axios";
import { X, Save } from "lucide-react";

export default function MemberForm({ onCancel, onMemberAdded }) {
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    tierId: "",
    endDate: "",
    document: null,
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/members/tiers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTiers(res.data);
        // Default to the first available tier once loaded
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, tierId: res.data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load membership tiers:", err);
      }
    };
    fetchTiers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tierId) {
      alert("Please select a membership tier.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => data.append(key, val));

    try {
      await axios.post("http://localhost:5000/api/members", data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      onMemberAdded();
    } catch (err) {
      console.error(err);
      alert("Error adding member. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Member</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-lg w-full"
              placeholder="First Name"
              required
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <input
              className="p-3 border rounded-lg w-full"
              placeholder="Last Name"
              required
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <input
            className="w-full p-3 border rounded-lg"
            type="email"
            placeholder="Email Address"
            required
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Membership Tier
            </label>
            <select
              className="w-full p-3 border rounded-lg bg-white"
              required
              value={formData.tierId}
              onChange={(e) =>
                setFormData({ ...formData, tierId: e.target.value })
              }
            >
              <option value="" disabled>
                {tiers.length === 0 ? "Loading tiers..." : "Select a tier"}
              </option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Membership Expiry Date
            </label>
            <input
              className="w-full p-3 border rounded-lg"
              type="date"
              required
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Upload Document
            </label>
            <input
              className="w-full p-3 border rounded-lg"
              type="file"
              onChange={(e) =>
                setFormData({ ...formData, document: e.target.files[0] })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} /> Save Member
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}