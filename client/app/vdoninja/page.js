"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function videoNinja(params) {
  const searchParams = useSearchParams();
  const [viewLinks, setViewLinks] = useState([]);
  useEffect(() => {
    let links = [];
    searchParams.forEach((value, key) => {
      const viewlink = `https://vdo.ninja/?view=${value}&codec=vp9&transparent&clean&videobitrate=250`;
      return links.push(viewlink);
    });
    setViewLinks(links);
  }, [searchParams]);

  const safeFrameCount = Math.max(1, Math.min(20, viewLinks.length));
  const getGridCols = () => {
    if (safeFrameCount < 2) return "grid-cols-1";
    if (safeFrameCount <= 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
    if (safeFrameCount <= 8) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (safeFrameCount <= 12)
      return "grid-cols-1 sm:grid-cols-3 lg:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";
  };

  return (
    <div className={`grid w-full ${getGridCols()}`}>
      {viewLinks.map((link, index) => (
        <div key={index} className="aspect-video">
          <iframe
            src={link}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            style={{ border: "none" }}
          />
        </div>
      ))}
    </div>
  );
}
