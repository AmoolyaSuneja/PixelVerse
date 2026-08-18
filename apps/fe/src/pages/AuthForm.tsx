import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [error, setError] = useState("");
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isNewAccount) {
      navigate("/");
    }
  }, [user, isNewAccount, navigate]);

  if (user && !isNewAccount) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(username, password);
        navigate("/");
      } else {
        setIsNewAccount(true);
        await signup(username, password);
        navigate("/avatar-selection");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-[#1E90FF] border-r-8 border-black z-0"></div>
      <div className="absolute top-10 right-10 w-24 h-24 bg-[#FFD700] border-[6px] border-black rounded-full z-0"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#FF4500] border-[6px] border-black z-0 rotate-12"></div>
      
      {error && <div className="absolute top-4 z-50 text-black bg-[#FF4500] border-4 border-black p-4 font-black uppercase text-base">{error}</div>}
      
      <div className="relative z-10 max-w-sm w-full bg-white border-[4px] border-black p-6 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-6 border-b-[4px] border-black pb-4">
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter">
            Pixelverse
          </h1>
          <p className="mt-4 text-sm text-black font-black uppercase bg-[#FFD700] border-2 border-black inline-block px-2 py-1 transform -rotate-2">
            Gateway to Infinite Worlds
          </p>
        </div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-black uppercase">
            {isLogin ? "Welcome Back!" : "Begin Journey"}
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="rounded-none block w-full px-3 py-2 bg-[#FDFBF7] border-[3px] border-black text-black placeholder-gray-500 focus:outline-none focus:bg-[#1E90FF] focus:text-white sm:text-sm font-black uppercase transition-colors"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="rounded-none block w-full px-3 py-2 bg-[#FDFBF7] border-[3px] border-black text-black placeholder-gray-500 focus:outline-none focus:bg-[#FF4500] focus:text-white sm:text-sm font-black uppercase transition-colors"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border-[3px] border-black text-base font-black rounded-none text-black bg-[#FFD700] hover:bg-black hover:text-white focus:outline-none uppercase transition-colors"
          >
            {isSubmitting ? (
              <span>WAIT...</span>
            ) : isLogin ? (
              "SIGN IN"
            ) : (
              "SIGN UP"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setIsNewAccount(false);
            }}
            className="text-xs font-black text-black hover:bg-black hover:text-white px-2 py-1 uppercase border-2 border-transparent hover:border-black transition-colors"
          >
            {isLogin
              ? "DON'T HAVE AN ACCOUNT? SIGN UP"
              : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
          </button>
        </div>
      </div>
    </div>
  );
}
