import '@xyflow/react/dist/style.css';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useMediaQuery } from "react-responsive";
import { Route, Routes } from "react-router";
import Graph from "./pages/graph";
import { useEffect, useState } from 'react';
import Experiment from './pages/experiment';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  useMediaQuery(
    {
      query: "(prefers-color-scheme: dark)",
    },
    undefined,
    (isSystemDark) => {
      console.log("isSystemDark", isSystemDark);
      setIsDark(isSystemDark);
    }
  )

  // Set once on first render
  useEffect(() => {
    setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  return (
    <SidebarProvider className={isDark ? "dark" : ""}>
      <AppSidebar />
      <div className="relative flex flex-col w-full h-full">
        <SidebarTrigger className="absolute top-2 left-2 z-10" />
        <Routes>
          <Route path="/" element={<Graph />} />
          <Route path="/experiment" element={<Experiment />} />
          <Route path="/settings" element={<h1>Test</h1>} />
        </Routes>
      </div>
    </SidebarProvider>
  );
}
