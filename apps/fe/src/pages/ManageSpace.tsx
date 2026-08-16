import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useState, useEffect } from "react";

interface BannedUser {
  id: string;
  username: string;
}

interface SpaceDetails {
  id: string;
  name: string;
  bannedUsers: BannedUser[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function ManageSpace() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { token } = useAuth();
  const [space, setSpace] = useState<SpaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-10 uppercase tracking-tighter bg-white border-[4px] border-black inline-block px-5 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          MANAGE SPACE:<br/><span className="text-[#1E90FF]">{space?.name}</span>
        </h1>
        
        <div className="bg-white border-[4px] border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#FF4500] border-l-[4px] border-b-[4px] border-black"></div>
          
          <h2 className="text-3xl font-black text-black mb-6 uppercase border-b-[4px] border-black pb-3 inline-block">
            BANNED USERS
          </h2>
          
          {space?.bannedUsers.length === 0 ? (
            <div className="bg-[#E5E5E5] border-[3px] border-black p-6 text-center">
              <p className="text-xl font-black text-black uppercase tracking-tight">NO BANNED USERS.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {space?.bannedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] border-[3px] border-black p-5 hover:bg-[#FFD700] transition-colors gap-3"
                >
                  <span className="text-xl font-black text-black uppercase tracking-tight">{user.username}</span>
                  <button
                    onClick={() => handleUnban(user.username)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#32CD32] border-[3px] border-black text-black text-lg font-black uppercase hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
  );
}
