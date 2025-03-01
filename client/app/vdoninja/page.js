import { Suspense } from "react";
import VideoNinjaClient from "./client";


export default function VideoNinjaPage() {
  return (
    <div className="p-4">
      <Suspense fallback={<p>Loading Video Ninja...</p>}>
        <VideoNinjaClient />
      </Suspense>
    </div>
  );
}
