"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import axios from "axios";

export default function VideoCard({ video }: any) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const handleDownload = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const userId = localStorage.getItem("userId");
      if (!userId || !video?._id) {
        alert("Please sign in to download this video");
        return;
      }

      await axios.post(`${backendUrl}/download/${video._id}/${userId}`);

      const fileUrl = `${backendUrl}/${video?.filepath || ""}`;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = video?.videotitle || "video";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Video downloaded successfully");
    } catch (error: any) {
      alert(error?.response?.data || "Download failed");
    }
  };

  return (
    <div className="space-y-3 group">
  <Link href={`/watch/${video?._id}`}>
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
      <video
        src={`${backendUrl}/${video?.filepath || ""}`}
        className="object-cover group-hover:scale-105 transition-transform duration-200"
      />

      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
        10:24
      </div>
    </div>
  </Link>

  <div className="flex gap-3">

    <Avatar className="w-9 h-9 flex-shrink-0">
      <AvatarFallback>{video?.videochanel?.[0]}</AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">

      <Link href={`/watch/${video?._id}`}>
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
          {video?.videotitle}
        </h3>
      </Link>

      <p className="text-sm text-gray-600 mt-1">
        {video?.videochanel}
      </p>

      <p className="text-sm text-gray-600">
        {video?.views?.toLocaleString()} views •{" "}
        {video?.createdAt
          ? formatDistanceToNow(new Date(video.createdAt))
          : ""} ago
      </p>

      
      <button
        onClick={handleDownload}
        className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
      >
        Download
      </button>

    </div>
  </div>

</div>

  );
}
