import React from "react";
import Videogrid from "@/components/Videogrid";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <main className="flex-1 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Compass className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Explore</h1>
      </div>
      <Videogrid />
    </main>
  );
}
