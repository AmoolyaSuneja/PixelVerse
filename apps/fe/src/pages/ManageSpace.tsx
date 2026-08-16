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
      
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-5xl md:text-6xl font-black text-black mb-12 uppercase tracking-tighter bg-white border-[6px] border-black inline-block px-6 py-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          MANAGE SPACE:<br/><span className="text-[#1E90FF]">{space?.name}</span>
        </h1>
        
        <div className="bg-white border-[6px] border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF4500] border-l-[6px] border-b-[6px] border-black"></div>
          
          <h2 className="text-4xl font-black text-black mb-8 uppercase border-b-[6px] border-black pb-4 inline-block">
            BANNED USERS
          </h2>
          
          {space?.bannedUsers.length === 0 ? (
            <div className="bg-[#E5E5E5] border-[4px] border-black p-8 text-center">
              <p className="text-2xl font-black text-black uppercase tracking-tight">NO BANNED USERS.</p>
            </div>
          ) : (
            <ul className="space-y-6">
              {space?.bannedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] border-[4px] border-black p-6 hover:bg-[#FFD700] transition-colors gap-4"
                >
                  <span className="text-2xl font-black text-black uppercase tracking-tight">{user.username}</span>
                  <button
                    onClick={() => handleUnban(user.username)}
                    className="w-full sm:w-auto px-8 py-4 bg-[#32CD32] border-[4px] border-black text-black text-xl font-black uppercase hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
