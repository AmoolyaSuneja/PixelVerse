import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(username, password);
        navigate("/");
      } else {
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
    <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {error && <div className="text-red-700 bg-red-100 border-2 border-red-700 p-2 font-bold mb-4">{error}</div>}
      <div className="max-w-md w-full space-y-8 bg-white border-4 border-black p-8 rounded-none">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tight">
            Pixelverse
          </h1>
          <p className="mt-2 text-sm text-black font-bold uppercase">
            Your Gateway to Infinite Worlds
          </p>
        </div>
        <div className="text-center border-t-2 border-b-2 border-black py-4 mb-4">
          <h2 className="text-xl font-black text-black uppercase">
            {isLogin ? "Welcome Back Traveler!" : "Begin Your Journey"}
          </h2>
          <p className="mt-2 text-sm text-black font-bold">
            {isLogin ? "Continue your adventure" : "Create your new identity"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="rounded-none appearance-none block w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-black sm:text-sm font-bold"
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
                className="rounded-none appearance-none block w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-black sm:text-sm font-bold"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border-2 border-black text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 focus:outline-none uppercase"
          >
            {isSubmitting ? (
              <span>LOADING...</span>
            ) : isLogin ? (
              "SIGN IN"
            ) : (
              "SIGN UP"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-black hover:underline uppercase"
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
