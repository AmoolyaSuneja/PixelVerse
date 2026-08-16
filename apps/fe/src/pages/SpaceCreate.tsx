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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#32CD32] border-[6px] border-black rounded-full z-0 translate-x-[-50%] translate-y-[-50%]"></div>
      
      <div className="relative z-10 bg-white border-[4px] border-black p-8 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-8 uppercase text-center border-b-[4px] border-black pb-4 tracking-tighter">
          CREATE<br/>SPACE
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-black mb-2 font-black uppercase text-lg">Space Name</label>
            <input
              type="text"
              className="w-full bg-[#FDFBF7] border-[3px] border-black rounded-none px-3 py-3 text-black font-black uppercase text-lg focus:outline-none focus:bg-[#FFD700] transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER NAME"
            />
          </div>

          <div>
            <label className="block text-black mb-2 font-black uppercase text-lg">
              Dimensions
            </label>
            <div className="relative">
              <select
                className="w-full bg-[#FDFBF7] border-[3px] border-black rounded-none px-3 py-3 text-black font-black uppercase text-lg focus:outline-none focus:bg-[#1E90FF] focus:text-white appearance-none cursor-pointer transition-colors"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
              >
                <option value="100x100">100 x 100</option>
                <option value="200x200">200 x 200</option>
                <option value="300x300">300 x 300</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none border-l-[3px] border-black bg-white">
                <span className="font-black text-black">▼</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full py-4 bg-[#FF4500] border-[4px] border-black rounded-none text-white text-2xl font-black uppercase hover:bg-black hover:text-white transition-colors mt-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            {isCreating ? "WAIT..." : "LAUNCH"}
          </button>
        </div>
      </div>
    </div>
  );
}
