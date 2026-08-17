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
  const [spaceToDelete, setSpaceToDelete] = useState<string | null>(null);
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
    <div className="min-h-screen bg-[#FDFBF7] p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-[3px] border-black pb-3 gap-3 relative">
          <div className="absolute -top-2 -left-2 w-16 h-16 bg-[#FFD700] rounded-full border-[3px] border-black -z-10"></div>
          <div>
            <div className="flex gap-4 items-center mb-2">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center font-black text-2xl hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                title="Go Back"
              >
                ↩
              </button>
              <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter leading-none">
                DASH<br/>BOARD
              </h1>
            </div>
            <p className="mt-2 text-sm font-black text-black uppercase bg-[#1E90FF] text-white border-2 border-black inline-block px-2 py-1 transform -rotate-1">
              WELCOME BACK, TRAVELER
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/avatar-selection")}
              className="px-4 py-2 bg-[#32CD32] text-black border-[3px] border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              AVATAR
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-[#FF4500] text-white border-[3px] border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/create-space")}
            className="group relative flex flex-col items-center justify-center p-6 bg-[#FFD700] border-[3px] border-black text-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-3xl font-black mb-2 group-hover:rotate-90 transition-transform">
              +
            </div>
            <span className="text-xl font-black uppercase tracking-tight">Create Space</span>
          </button>

          <div className="bg-white border-[3px] border-black p-5 flex flex-col justify-center relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="absolute right-0 top-0 w-16 h-16 bg-[#1E90FF] border-l-[3px] border-b-[3px] border-black rounded-bl-full"></div>
            <h2 className="text-xl font-black text-black uppercase mb-2 relative z-10">
              Join Existing
            </h2>
            <div className="flex gap-2 relative z-10">
              <input
                type="text"
                placeholder="SPACE ID"
                value={spaceIdInput}
                onChange={(e) => setSpaceIdInput(e.target.value)}
                className="flex-1 bg-[#FDFBF7] border-2 border-black p-2 text-black font-black uppercase text-sm placeholder-gray-400 focus:outline-none focus:bg-white"
              />
              <button
                onClick={handleJoinSpace}
                className="px-4 py-2 bg-[#32CD32] text-black border-2 border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>

        {/* Spaces List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-black uppercase tracking-tighter inline-block border-b-[3px] border-black pb-1">
            Your Spaces
          </h2>

          {isLoading ? (
            <div className="text-center py-12 bg-white border-[3px] border-black">
              <span className="text-xl font-black text-black uppercase bg-[#FFD700] px-3 py-1 border-2 border-black">LOADING...</span>
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-12 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-black text-black uppercase">NO SPACES FOUND</p>
              <p className="text-sm font-bold mt-2">CREATE ONE TO START</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((space, i) => (
                <div
                  key={space.id}
                  className={`bg-white border-[3px] border-black p-4 flex flex-col relative transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[160px] ${
                    i % 3 === 0 ? "bg-[#FF4500] text-white" :
                    i % 3 === 1 ? "bg-[#1E90FF] text-white" :
                    "bg-white text-black hover:bg-[#FFD700]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter line-clamp-2 ${i % 3 === 0 ? 'text-white' : i % 3 === 1 ? 'text-white' : 'text-black'}`}>
                      {space.name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black text-white p-1 border-2 border-black font-black uppercase text-[10px] text-center">
                        {space.dimensions}
                      </div>
                      <div className="w-8 h-8 border-2 border-black flex items-center justify-center font-black bg-white text-black text-[10px]">
                        #{space.id.slice(0,2)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/space/?spaceId=${space.id}`)}
                        className={`flex-1 py-1 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white transition-colors ${i % 3 !== 2 ? 'bg-white text-black' : 'bg-black text-white hover:bg-white hover:text-black'}`}
                      >
                        ENTER
                      </button>
                      <button
                        onClick={() => navigate(`/manage-space/${space.id}`)}
                        className="px-2 py-1 bg-white text-black border-2 border-black font-black uppercase text-[10px] hover:bg-gray-200 transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setSpaceToDelete(space.id)}
                        className="px-2 py-1 bg-[#FF4500] text-white border-2 border-black font-black uppercase text-[10px] hover:bg-black transition-colors"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Elegant Delete Modal */}
      {spaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white border-[6px] border-black p-8 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative transform rotate-1">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FF4500] border-[4px] border-black rounded-full z-10 flex items-center justify-center text-white font-black text-2xl">!</div>
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-4 border-b-[4px] border-black pb-2">
              Confirm Delete
            </h2>
            <p className="text-lg font-bold text-black uppercase mb-8">
              Are you absolute sure you want to obliterate this space? This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setSpaceToDelete(null)}
                className="flex-1 py-3 bg-[#E5E5E5] border-[4px] border-black text-black font-black uppercase text-xl hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  if (!spaceToDelete) return;
                  try {
                    await axios.delete(`${BACKEND_URL}/api/v1/space/${spaceToDelete}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    setSpaces(spaces.filter(s => s.id !== spaceToDelete));
                    setSpaceToDelete(null);
                  } catch (err) {
                    console.error(err);
                    alert("FAILED TO DELETE SPACE");
                  }
                }}
                className="flex-1 py-3 bg-[#FF4500] border-[4px] border-black text-white font-black uppercase text-xl hover:bg-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                NUKE IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
