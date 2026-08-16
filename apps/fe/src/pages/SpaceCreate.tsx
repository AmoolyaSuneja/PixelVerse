import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function CreateSpace() {
  const [name, setName] = useState("");
  const [dimensions, setDimensions] = useState("100x100");
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/space`,
        { name, dimensions },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigate(`/space/?spaceId=${response.data.spaceId}`);
    } catch (error) {
      console.error("Error creating space:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-4 border-black rounded-none p-8 max-w-md w-full">
        <h1 className="text-3xl font-black text-black mb-8 uppercase text-center border-b-4 border-black pb-4">Create New Space</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-black mb-2 font-bold uppercase tracking-wider">Space Name</label>
            <input
              type="text"
              className="w-full bg-white border-2 border-black rounded-none px-4 py-3 text-black font-bold focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-black mb-2 font-bold uppercase tracking-wider">
              Dimensions
            </label>
            <select
              className="w-full bg-white border-2 border-black rounded-none px-4 py-3 text-black font-bold focus:outline-none appearance-none cursor-pointer"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            >
              <option value="100x100">100x100</option>
              <option value="200x200">200x200</option>
              <option value="300x300">300x300</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full py-4 bg-yellow-400 border-2 border-black rounded-none text-black font-black uppercase hover:bg-yellow-500 mt-8"
          >
            {isCreating ? "CREATING..." : "CREATE SPACE"}
          </button>
        </div>
      </div>
    </div>
  );
}
