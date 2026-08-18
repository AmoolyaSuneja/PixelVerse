import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

type AvatarContextType = {
  avatars: Map<string, string>;
  fetchAvatars: (usernames: string[]) => Promise<void>;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatars, setAvatars] = useState<Map<string, string>>(new Map());
  const avatarsRef = useRef(avatars);
  const inFlight = useRef(new Set<string>());

  const fetchAvatars = useCallback(async (usernames: string[]) => {
    const missingUsernames = [...new Set(usernames)].filter(
      (username) => username && !avatarsRef.current.has(username) && !inFlight.current.has(username),
    );
    if (missingUsernames.length === 0) return;

    missingUsernames.forEach((username) => inFlight.current.add(username));

    try {
      const usernamesString = encodeURIComponent(missingUsernames.join(","));

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
        // Cache a fallback too, so users with no saved avatar are not fetched
        // on every movement update.
        missingUsernames.forEach((username) => {
          if (!newAvatars.has(username)) {
            newAvatars.set(username, "procedural:cyan_vibrant_astro_0");
          }
        });
        avatarsRef.current = newAvatars;
        return newAvatars;
      });
    } catch (error) {
      console.error("Error fetching avatars:", error);
    } finally {
      missingUsernames.forEach((username) => inFlight.current.delete(username));
    }
  }, []);

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
