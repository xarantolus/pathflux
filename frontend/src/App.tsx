import '@xyflow/react/dist/style.css';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useMediaQuery } from "react-responsive";
import { Route, Routes } from "react-router";
import Graph from "./pages/graph";
import { useState } from 'react';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  useMediaQuery(
    {
      query: "(prefers-color-scheme: dark)",
    },
    undefined,
    (isSystemDark) => setIsDark(isSystemDark)
  )

  return (
    <SidebarProvider className={isDark ? "dark" : ""}>
      <AppSidebar />
      <div className="relative flex flex-col w-full h-full">
        <SidebarTrigger className="absolute top-2 left-2 z-10" />
        <Routes>
          <Route path="/" element={<Graph />} />
          <Route path="/settings" element={<Graph />} />
        </Routes>
      </div>
    </SidebarProvider>
  );
}
