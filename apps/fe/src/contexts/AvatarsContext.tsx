import { createContext, useContext, useState, ReactNode } from "react";

type AvatarContextType = {
  avatars: Map<string, string>;
  fetchAvatars: (usernames: string[]) => Promise<void>;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatars, setAvatars] = useState<Map<string, string>>(new Map());

  const fetchAvatars = async (usernames: string[]) => {
    if (usernames.length === 0) return;

    try {
      const usernamesString = usernames.join(",");

      const response = await fetch(
        `${BACKEND_URL}/api/v1/user/metadata/bulk?userIds=${usernamesString}`,
      );
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} - ${response.statusText}`,
        );
      }
      const { avatars: avatarData } = await response.json();

      setAvatars((prevAvatars) => {
        const newAvatars = new Map(prevAvatars);
        avatarData.forEach(
          ({ username, avatarId }: { username: string; avatarId: string }) => {
            const finalAvatarId = avatarId && avatarId !== "default" ? avatarId : "procedural:cyan_vibrant_astro_0";
            newAvatars.set(username, finalAvatarId);
          },
        );
        return newAvatars;
      });
    } catch (error) {
      console.error("Error fetching avatars:", error);
    }
  };

  return (
    <AvatarContext.Provider value={{ avatars, fetchAvatars }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) throw new Error("useAvatar must be used within AvatarProvider");
  return context;
};
