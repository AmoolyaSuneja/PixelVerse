import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Helper to decode JWT without needing the jsonwebtoken Node.js library
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

type User = {
  id: string;
  role: "User" | "Admin";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      // Keep the session when the tab or browser is closed. `sessionStorage`
      // is cleared at the end of a browser session, which made returning users
      // appear signed out despite having already authenticated.
      const storedToken =
        localStorage.getItem("token") ?? sessionStorage.getItem("token");
      if (storedToken) {
        try {
          const decoded = parseJwt(storedToken) as {
            userId: string;
            role: "User" | "Admin";
          } | null;

          if (decoded?.userId && decoded.role) {
            // Migrate tokens created by earlier versions of the app.
            localStorage.setItem("token", storedToken);
            sessionStorage.removeItem("token");
            setUser({ id: decoded.userId, role: decoded.role });
            setToken(storedToken);
          } else {
            throw new Error("Invalid token");
          }
        } catch (error) {
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      const decoded = parseJwt(data.token) as {
        userId: string;
        role: "User" | "Admin";
      };

      setUser({ id: decoded.userId, role: decoded.role });
      setToken(data.token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      const signupResponse = await fetch(
        `${BACKEND_URL}/api/v1/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, type: "user" }),
        },
      );

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.message || "Signup failed");
      }

      // The server returns a session token with the newly created account. This
      // avoids a second request (and another cold-start wait in deployment).
      localStorage.setItem("token", signupData.token);
      const decoded = parseJwt(signupData.token) as {
        userId: string;
        role: "User" | "Admin";
      };
      setUser({ id: decoded.userId, role: decoded.role });
      setToken(signupData.token);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
