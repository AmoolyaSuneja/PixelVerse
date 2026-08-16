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
    <div className="min-h-screen bg-[#E5E5E5] py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-black mb-8 uppercase border-b-4 border-black inline-block pr-8 pb-2">
          Manage Space: {space?.name}
        </h1>
        <div className="bg-white border-4 border-black p-8 rounded-none">
          <h2 className="text-2xl font-black text-black mb-6 uppercase border-b-2 border-black pb-2">
            Banned Users
          </h2>
          {space?.bannedUsers.length === 0 ? (
            <p className="text-black font-bold uppercase tracking-widest">No banned users.</p>
          ) : (
            <ul className="space-y-4">
              {space?.bannedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex justify-between items-center bg-gray-200 border-2 border-black p-4 rounded-none"
                >
                  <span className="text-black font-bold uppercase">{user.username}</span>
                  <button
                    onClick={() => handleUnban(user.username)}
                    className="px-6 py-2 bg-green-500 border-2 border-black rounded-none text-black font-black uppercase hover:bg-green-600"
                  >
                    Unban
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
