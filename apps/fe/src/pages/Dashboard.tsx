import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface Space {
  id: string;
  name: string;
  dimensions: string;
  thumbnail?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceIdInput, setSpaceIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/v1/space/all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setSpaces(response.data.spaces);
      } catch (error) {
        console.error("Error fetching spaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, [token]);

  const handleJoinSpace = async () => {
    if (!spaceIdInput) return;
    navigate(`/space/?spaceId=${spaceIdInput}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center">
          <p className="text-black text-4xl font-black uppercase tracking-widest border-4 border-black p-4 bg-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-[6px] border-black pb-4 gap-4 relative">
          <div className="absolute -top-3 -left-3 w-24 h-24 bg-[#FFD700] rounded-full border-[4px] border-black -z-10"></div>
          <div>
            <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none">
              DASH<br/>BOARD
            </h1>
            <p className="mt-3 text-lg font-black text-black uppercase bg-[#1E90FF] text-white border-[3px] border-black inline-block px-3 py-1 transform -rotate-1">
              WELCOME BACK, TRAVELER
            </p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-3 bg-[#FF4500] text-white border-[4px] border-black font-black uppercase text-lg hover:bg-black hover:text-white transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            LOGOUT
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/create-space")}
            className="group relative flex flex-col items-center justify-center p-8 bg-[#FFD700] border-[4px] border-black text-black hover:bg-black hover:text-white transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-4xl font-black mb-3 group-hover:rotate-90 transition-transform">
              +
            </div>
            <span className="text-2xl font-black uppercase tracking-tight">Create Space</span>
          </button>

          <div className="bg-white border-[4px] border-black p-6 flex flex-col justify-center relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#1E90FF] border-l-[4px] border-b-[4px] border-black rounded-bl-full"></div>
            <h2 className="text-3xl font-black text-black uppercase mb-3 relative z-10">
              Join Existing
            </h2>
            <div className="flex gap-3 relative z-10">
              <input
                type="text"
                placeholder="SPACE ID"
                value={spaceIdInput}
                onChange={(e) => setSpaceIdInput(e.target.value)}
                className="flex-1 bg-[#FDFBF7] border-[3px] border-black p-3 text-black font-black uppercase text-lg placeholder-gray-400 focus:outline-none focus:bg-white"
              />
              <button
                onClick={handleJoinSpace}
                className="px-6 py-3 bg-[#32CD32] text-black border-[3px] border-black font-black uppercase text-lg hover:bg-black hover:text-white transition-colors"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>

        {/* Spaces List */}
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter inline-block border-b-[4px] border-black pb-2">
            Your Spaces
          </h2>

          {isLoading ? (
            <div className="text-center py-16 bg-white border-[4px] border-black">
              <span className="text-3xl font-black text-black uppercase bg-[#FFD700] px-4 py-2 border-3 border-black">LOADING...</span>
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-16 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black uppercase">NO SPACES FOUND</p>
              <p className="text-lg font-bold mt-3">CREATE ONE TO START</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[200px]">
              {spaces.map((space, i) => (
                <div
                  key={space.id}
                  className={`bg-white border-[4px] border-black p-5 flex flex-col relative transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                    i % 3 === 0 ? "bg-[#FF4500] text-white lg:col-span-2 lg:row-span-2" :
                    i % 3 === 1 ? "bg-[#1E90FF] text-white" :
                    "bg-white text-black hover:bg-[#FFD700]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-3xl font-black uppercase tracking-tighter line-clamp-2 ${i % 3 === 0 ? 'text-white' : i % 3 === 1 ? 'text-white' : 'text-black'}`}>
                      {space.name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 bg-black text-white p-2 border-3 border-black font-black uppercase text-xs text-center">
                        {space.dimensions}
                      </div>
                      <div className="w-10 h-10 border-3 border-black flex items-center justify-center font-black bg-white text-black text-xs">
                        #{space.id.slice(0,2)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/space/?spaceId=${space.id}`)}
                        className={`flex-1 py-2 border-[3px] border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors ${i % 3 !== 2 ? 'bg-white text-black' : 'bg-black text-white hover:bg-white hover:text-black'}`}
                      >
                        ENTER
                      </button>
                      <button
                        onClick={() => navigate(`/manage-space/${space.id}`)}
                        className="px-3 py-2 bg-white text-black border-[3px] border-black font-black uppercase text-xs hover:bg-gray-200 transition-colors"
                      >
                        EDIT
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
