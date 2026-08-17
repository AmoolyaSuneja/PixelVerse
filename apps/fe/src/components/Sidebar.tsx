import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export const Sidebar = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { spaceId: pathSpaceId } = useParams();
  const querySpaceId = new URLSearchParams(location.search).get("spaceId");
  const spaceId = pathSpaceId || querySpaceId;
  const { token } = useAuth();

  const isArena = location.pathname === "/space";
  const isManage = location.pathname.startsWith("/manage-space");

  const handleBack = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!spaceId) return;
    const confirmDelete = window.confirm(
      "ARE YOU SURE YOU WANT TO DELETE THIS SPACE?"
    );
    if (!confirmDelete) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      await axios.delete(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/");
    } catch (err) {
      console.error("Error deleting space:", err);
      alert("FAILED TO DELETE SPACE");
    }
  };

  const handleChangeArena = () => {
    navigate("/");
  };

  return (
    <div
      className={`h-full bg-[#FFD700] border-r-[6px] border-black flex flex-col transition-all duration-300 z-50 ${
        isMinimized ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 flex justify-between items-center border-b-[6px] border-black bg-white">
        {!isMinimized && (
          <h2 className="font-black text-xl tracking-tighter uppercase text-black truncate">
            MENU
          </h2>
        )}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`font-black text-xl hover:bg-gray-200 border-4 border-transparent hover:border-black w-10 h-10 flex items-center justify-center ${
            isMinimized ? "mx-auto" : ""
          }`}
        >
          {isMinimized ? "→" : "←"}
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        <button
          onClick={handleBack}
          title="Go Back"
          className="w-full bg-white border-[4px] border-black p-3 font-black text-black uppercase hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">↩</span>
          {!isMinimized && <span>BACK</span>}
        </button>

        {isManage && (
          <button
            onClick={handleDelete}
            title="Delete Space"
            className="w-full bg-[#FF4500] border-[4px] border-black p-3 font-black text-white uppercase hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">✖</span>
            {!isMinimized && <span>DEL ARENA</span>}
          </button>
        )}

        {isArena && (
          <button
            onClick={handleChangeArena}
            title="Change Arena"
            className="w-full bg-[#1E90FF] border-[4px] border-black p-3 font-black text-white uppercase hover:bg-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center gap-2 text-center"
          >
            <span className="text-xl">⏏</span>
            {!isMinimized && <span>CHANGE ARENA</span>}
          </button>
        )}
      </div>
    </div>
  );
};
