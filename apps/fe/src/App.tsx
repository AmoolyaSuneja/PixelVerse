import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Arena } from "./pages/Arena";
import AuthPage from "./pages/AuthForm";
import Dashboard from "./pages/Dashboard";

import { useAuth } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { JSX, useEffect } from "react";
import AvatarSelection from "./pages/AvatarSelection";
import CreateSpace from "./pages/SpaceCreate";
import ManageSpace from "./pages/ManageSpace";
import Lenis from "lenis";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-sans font-black uppercase text-black text-4xl"><span className="bg-yellow-400 border-4 border-black p-4 tracking-widest translate-x-2 translate-y-2"><span className="block -translate-x-4 -translate-y-4 bg-white border-4 border-black p-4">LOADING...</span></span></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return children;
};
function App() {
  useEffect(() => {
    new Lenis({
      autoRaf: true,
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/space"
          element={
            <ProtectedRoute>
              <Arena />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-space"
          element={
            <ProtectedRoute>
              <CreateSpace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avatar-selection"
          element={
            <ProtectedRoute>
              <AvatarSelection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-space/:spaceId"
          element={
            <ProtectedRoute>
              <ManageSpace />
            </ProtectedRoute>
          }
        />

        <Route path="/auth" index element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
