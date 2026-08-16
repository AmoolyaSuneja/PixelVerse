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
    <div className="min-h-screen bg-[#E5E5E5] py-12 px-4 font-sans">
      <div className="absolute top-4 right-4 flex gap-4">
        <button
          onClick={() => navigate("/avatar-selection")}
          className="px-6 py-2 bg-blue-600 border-2 border-black rounded-none text-white font-black hover:bg-blue-700 uppercase"
        >
          Change Avatar
        </button>
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-600 border-2 border-black rounded-none text-white font-black hover:bg-red-700 uppercase"
        >
          Logout
        </button>
      </div>
      <div className="max-w-6xl mx-auto mt-12">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-1 bg-white border-4 border-black p-6 rounded-none">
            <h2 className="text-2xl font-black text-black mb-4 uppercase">Join Space</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="ENTER SPACE ID"
                className="flex-1 bg-white border-2 border-black rounded-none px-4 py-2 text-black font-bold focus:outline-none"
                value={spaceIdInput}
                onChange={(e) => setSpaceIdInput(e.target.value)}
              />
              <button
                onClick={handleJoinSpace}
                className="px-6 py-2 bg-green-500 border-2 border-black rounded-none text-black font-black hover:bg-green-600 uppercase"
              >
                Join
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white border-4 border-black p-6 rounded-none">
            <h2 className="text-2xl font-black text-black mb-4 uppercase">
              Create New Space
            </h2>
            <button
              onClick={() => navigate("/create-space")}
              className="w-full py-3 bg-yellow-400 border-2 border-black rounded-none text-black font-black hover:bg-yellow-500 uppercase"
            >
              Create New Space
            </button>
          </div>
        </div>

        <h2 className="text-3xl font-black text-black mb-6 uppercase border-b-4 border-black inline-block pr-8 pb-2">Your Spaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-white border-4 border-black rounded-none p-4 cursor-pointer hover:bg-slate-200 flex flex-col"
              onClick={() => navigate(`/space/?spaceId=${space.id}`)}
            >
              {space.thumbnail && (
                <img
                  src={space.thumbnail}
                  alt={space.name}
                  className="w-full h-48 object-cover border-2 border-black mb-4"
                />
              )}
              <h3 className="text-xl font-black text-black mb-2 uppercase break-words">
                {space.name}
              </h3>
              <p className="text-black font-bold uppercase text-sm mb-4">Dimensions: {space.dimensions}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/manage-space/${space.id}`);
                }}
                className="mt-auto px-4 py-2 bg-blue-600 border-2 border-black rounded-none text-white font-black hover:bg-blue-700 uppercase"
              >
                Manage
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
