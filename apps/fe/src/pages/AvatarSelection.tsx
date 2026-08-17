import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { generateProceduralDataURL } from "../utils/SpriteGenerator";

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function AvatarSelection() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/v1/avatars`,
        );
        setAvatars(response.data.avatars);
      } catch (error) {
        console.error("Error fetching avatars:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  const handleSave = async () => {
    if (!selectedAvatar) return;

    setIsSaving(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/user/metadata`,
        { avatarId: selectedAvatar },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigate("/");
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setIsSaving(false);
    }
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
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-2xl mx-auto w-full relative">
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FF00FF] border-[4px] border-black -z-10 rotate-45"></div>
        <div className="flex gap-4 items-center justify-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white border-[4px] border-black flex items-center justify-center font-black text-2xl hover:bg-black hover:text-white transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            title="Go Back"
          >
            ↩
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-center text-black uppercase border-[4px] border-black bg-[#FFD700] p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] tracking-tighter flex-1">
            CHOOSE AVATAR
          </h1>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`relative cursor-pointer border-[4px] ${
                selectedAvatar === avatar.id ? "border-black bg-[#1E90FF] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px] translate-x-[-2px]" : "border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              } transition-all duration-75 rounded-none aspect-square flex flex-col`}
            >
              <img
                src={avatar.imageUrl.startsWith("procedural:") ? generateProceduralDataURL(avatar.imageUrl) : avatar.imageUrl}
                alt={avatar.name}
                className="w-full flex-1 object-contain p-2"
                style={{ imageRendering: "pixelated" }}
              />
              <div className={`w-full text-center border-t-[4px] border-black text-sm py-1 font-black uppercase tracking-tight ${selectedAvatar === avatar.id ? "bg-black text-white" : "bg-white text-black"}`}>
                {avatar.name}
              </div>
              {selectedAvatar === avatar.id && (
                <div className="absolute top-0 right-0 bg-[#FFD700] text-black font-black px-1 py-1 text-[10px] border-b-[4px] border-l-[4px] border-black">
                  [SET]
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center relative">
          <button
            onClick={handleSave}
            disabled={!selectedAvatar || isSaving}
            className={`px-6 py-3 text-lg font-black rounded-none uppercase border-[4px] border-black ${
              selectedAvatar
                ? "bg-[#32CD32] hover:bg-black hover:text-white text-black cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              "WAIT..."
            ) : (
              "SAVE & PROCEED"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
