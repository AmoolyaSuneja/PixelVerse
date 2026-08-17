import { JSX } from "react";
import { Sidebar } from "./Sidebar";

export const Layout = ({ children }: { children: JSX.Element }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FDFBF7]">
      <Sidebar />
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
