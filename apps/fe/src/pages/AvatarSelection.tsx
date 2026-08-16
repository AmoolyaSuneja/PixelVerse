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
    <div className="min-h-screen bg-[#E5E5E5] py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-black text-center text-black mb-12 uppercase border-4 border-black bg-white p-4">
          Choose Your Avatar
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`relative cursor-pointer border-4 ${
                selectedAvatar === avatar.id ? "border-blue-600 bg-blue-100" : "border-black bg-white"
              } rounded-none aspect-square flex flex-col`}
            >
              <img
                src={avatar.imageUrl.startsWith("procedural:") ? generateProceduralDataURL(avatar.imageUrl) : avatar.imageUrl}
                alt={avatar.name}
                className="w-full flex-1 object-contain p-4"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="w-full text-center bg-black text-white text-sm py-2 font-bold uppercase border-t-4 border-black">
                {avatar.name}
              </div>
              {selectedAvatar === avatar.id && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white font-black px-2 py-1 text-xs border-b-4 border-l-4 border-black">
                  SELECTED
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={!selectedAvatar || isSaving}
            className={`px-8 py-4 text-xl font-black rounded-none uppercase border-4 border-black ${
              selectedAvatar
                ? "bg-green-500 hover:bg-green-600 text-black cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              "SAVING..."
            ) : (
              "Save & Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
