import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface BannedUser {
  id: string;
  username: string;
}

interface SpaceDetails {
  id: string;
  name: string;
  thumbnail: string;
  bannedUsers: BannedUser[];
}

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

export default function ManageSpace() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState<SpaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vibe, setVibe] = useState("grid");
  const [isUpdatingVibe, setIsUpdatingVibe] = useState(false);
  const [vibeSuccess, setVibeSuccess] = useState(false);

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/v1/space/${spaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSpace(response.data);
        if (response.data.thumbnail) {
          setVibe(response.data.thumbnail);
        }
      } catch (err) {
        setError("Failed to fetch space details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaceDetails();
  }, [spaceId, token]);

  const handleUnban = async (userId: string) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/space/${spaceId}/unban`,
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const response = await axios.get(
        `${BACKEND_URL}/api/v1/space/${spaceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSpace(response.data);
    } catch (err) {
      console.error("Failed to unban user", err);
    }
  };

  const handleUpdateVibe = async () => {
    setIsUpdatingVibe(true);
    setVibeSuccess(false);
    try {
      await axios.put(
        `${BACKEND_URL}/api/v1/space/${spaceId}/vibe`,
        { vibe },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setVibeSuccess(true);
      setTimeout(() => setVibeSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update vibe", err);
    } finally {
      setIsUpdatingVibe(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center font-sans">
        <p className="text-black text-4xl font-black uppercase tracking-widest border-4 border-black p-4 bg-white">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center font-sans">
        <p className="text-red-700 bg-red-100 border-4 border-red-700 p-4 font-black uppercase text-2xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 font-sans relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-full h-1/3 bg-[#FFD700] border-t-[6px] border-black -z-10"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-10 uppercase tracking-tighter bg-white border-[4px] border-black inline-block px-5 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          MANAGE SPACE:<br/><span className="text-[#1E90FF]">{space?.name}</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-[4px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative h-fit">
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#32CD32] border-l-[4px] border-b-[4px] border-black"></div>
            
            <h2 className="text-2xl font-black text-black mb-6 uppercase border-b-[4px] border-black pb-3 inline-block">
              CHANGE VIBE
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {VIBES.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  className={`cursor-pointer border-[3px] border-black p-1 flex flex-col items-center justify-center aspect-square transition-all ${
                    vibe === v.id
                      ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 ring-4 ring-black"
                      : "hover:bg-gray-100"
                  }`}
                  style={{ backgroundColor: vibe === v.id ? "#FDFBF7" : "white" }}
                >
                  <div
                    className="w-full h-full border-2 border-black mb-1"
                    style={{ backgroundColor: v.color }}
                  ></div>
                  <span className="font-black text-[10px] leading-tight uppercase text-center">{v.name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpdateVibe}
              disabled={isUpdatingVibe}
              className={`w-full py-3 border-[3px] border-black text-black text-lg font-black uppercase hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 ${
                vibeSuccess ? "bg-[#32CD32]" : "bg-[#FFD700]"
              }`}
            >
              {isUpdatingVibe ? "UPDATING..." : vibeSuccess ? "VIBE UPDATED!" : "UPDATE VIBE"}
            </button>
          </div>

          <div className="bg-white border-[4px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative h-fit">
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#FF4500] border-l-[4px] border-b-[4px] border-black"></div>
            
            <h2 className="text-2xl font-black text-black mb-6 uppercase border-b-[4px] border-black pb-3 inline-block">
              BANNED USERS
            </h2>
            
            {space?.bannedUsers.length === 0 ? (
              <div className="bg-[#E5E5E5] border-[3px] border-black p-6 text-center">
                <p className="text-lg font-black text-black uppercase tracking-tight">NO BANNED USERS.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {space?.bannedUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] border-[3px] border-black p-4 hover:bg-[#FFD700] transition-colors gap-3"
                  >
                    <span className="text-lg font-black text-black uppercase tracking-tight">{user.username}</span>
                    <button
                      onClick={() => handleUnban(user.username)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#32CD32] border-[3px] border-black text-black text-sm font-black uppercase hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      UNBAN
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
