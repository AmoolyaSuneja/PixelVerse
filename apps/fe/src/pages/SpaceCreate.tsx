import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const VIBES = [
  { id: "grid", name: "Neon Grid", color: "#FF00FF" },
  { id: "space", name: "Deep Space", color: "#1A1A40" },
  { id: "ocean", name: "Ocean Floor", color: "#006699" },
  { id: "lava", name: "Lava Pit", color: "#FF3300" },
  { id: "matrix", name: "Digital Rain", color: "#00FF00" },
  { id: "forest", name: "Mystic Forest", color: "#228B22" },
  { id: "snow", name: "Ice Cavern", color: "#ADD8E6" },
  { id: "desert", name: "Scorched Desert", color: "#EDC9AF" },
  { id: "clouds", name: "Cloud Kingdom", color: "#87CEEB" },
  { id: "cyberpunk", name: "Cyberpunk", color: "#9400D3" },
];

export default function CreateSpace() {
  const [name, setName] = useState("");
  const [dimensions, setDimensions] = useState("100x100");
  const [vibe, setVibe] = useState("grid");
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/space`,
        { name, dimensions, thumbnail: vibe },
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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans relative overflow-hidden py-8">
      <div className="absolute top-10 left-10 w-48 h-48 bg-[#32CD32] border-[6px] border-black rounded-full z-0 translate-x-[-20%] translate-y-[-20%]"></div>
      
      <div className="relative z-10 bg-white border-[4px] border-black p-6 max-w-xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex gap-4 items-center mb-8 border-b-[4px] border-black pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center font-black text-xl hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            title="Go Back"
          >
            ↩
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase text-center tracking-tighter flex-1">
            CREATE SPACE
          </h1>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black mb-2 font-black uppercase text-base">Space Name</label>
              <input
                type="text"
                className="w-full bg-[#FDFBF7] border-[3px] border-black rounded-none px-3 py-2 text-black font-black uppercase text-base focus:outline-none focus:bg-[#FFD700] transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ENTER NAME"
              />
            </div>

            <div>
              <label className="block text-black mb-2 font-black uppercase text-base">
                Dimensions
              </label>
              <div className="relative">
                <select
                  className="w-full bg-[#FDFBF7] border-[3px] border-black rounded-none px-3 py-2 text-black font-black uppercase text-base focus:outline-none focus:bg-[#1E90FF] focus:text-white appearance-none cursor-pointer transition-colors"
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
          </div>

          <div>
            <label className="block text-black mb-4 font-black uppercase text-base border-t-[4px] border-black pt-4">
              Select Arena Vibe
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {VIBES.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  className={`cursor-pointer border-[3px] border-black p-2 flex flex-col items-center justify-center aspect-square transition-all ${
                    vibe === v.id
                      ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 scale-105 ring-4 ring-black"
                      : "hover:bg-gray-100"
                  }`}
                  style={{ backgroundColor: vibe === v.id ? "#FDFBF7" : "white" }}
                >
                  <div
                    className="w-full h-full border-2 border-black mb-2"
                    style={{ backgroundColor: v.color }}
                  ></div>
                  <span className="font-black text-xs uppercase text-center">{v.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating || !name}
            className="w-full py-3 bg-[#FF4500] border-[4px] border-black rounded-none text-white text-xl font-black uppercase hover:bg-black hover:text-white transition-colors mt-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "WAIT..." : "LAUNCH"}
          </button>
        </div>
      </div>
    </div>
  );
}
