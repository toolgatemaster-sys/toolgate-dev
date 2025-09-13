"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    setT(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed right-4 top-4 flex gap-2">
        <Button variant="outlineSupabase" size="tiny" onClick={() => setT("light")}>
          Light
        </Button>
        <Button variant="brandSupabase" size="tiny" onClick={() => setT("dark")}>Dark</Button>
      </div>
      {children}
    </div>
  );
}
