import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Arena } from "./pages/Arena";
import AuthPage from "./pages/AuthForm";
import Dashboard from "./pages/Dashboard";

import { useAuth } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { JSX } from "react";
import AvatarSelection from "./pages/AvatarSelection";
import CreateSpace from "./pages/SpaceCreate";
import ManageSpace from "./pages/ManageSpace";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center font-sans font-black uppercase text-black text-4xl"><span className="bg-white border-4 border-black p-4 tracking-widest">LOADING...</span></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return children;
};
function App() {
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
