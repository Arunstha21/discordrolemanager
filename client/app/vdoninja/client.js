"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VideoNinjaClient() {
  const searchParams = useSearchParams();
  const [viewLinks, setViewLinks] = useState([]);

  useEffect(() => {
    const links = [];
    searchParams.forEach((value) => {
      const viewlink = {
        url: `https://vdo.ninja/?view=${value}&codec=vp9&transparent&clean&videobitrate=250`,
        viewId: value,  // Save the actual view ID
      };
      links.push(viewlink);
    });
    setViewLinks(links);
  }, [searchParams]);

  const safeFrameCount = Math.max(1, Math.min(20, viewLinks.length));

  const getGridCols = () => {
    if (safeFrameCount < 2) return "grid-cols-1";
    if (safeFrameCount <= 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
    if (safeFrameCount <= 8) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (safeFrameCount <= 12) return "grid-cols-1 sm:grid-cols-3 lg:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";
  };

  return (
    <div className={`grid w-full ${getGridCols()} gap-4`}>
      {viewLinks.map((link, index) => (
        <div key={index} className="relative aspect-video border border-gray-500">
          <div className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-1 rounded">
            {link.viewId}
          </div>

          <iframe
            src={link.url}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            style={{ border: "none" }}
          />
        </div>
      ))}
    </div>
  );
}
