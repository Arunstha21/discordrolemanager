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
        viewId: value, // Save the actual view ID
      };
      links.push(viewlink);
    });
    setViewLinks(links);
  }, [searchParams]);

  return (
    <div className="flex flex-wrap justify-center gap-4 w-full">
      {viewLinks.map((link, index) => (
        <div
          key={index}
          className="relative aspect-video w-full max-w-sm border border-gray-500"
        >
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
