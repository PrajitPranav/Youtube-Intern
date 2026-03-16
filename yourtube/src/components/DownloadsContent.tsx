"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function DownloadsContent() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) {
      loadDownloads();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDownloads = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/download/${user._id}`);
      setDownloads(res.data || []);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReDownload = async (video: any) => {
    try {
      await axiosInstance.post(`/download/${video._id}/${user?._id}`);
      const fileUrl = `${backendUrl}/${video?.filepath || ""}`;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = video?.videotitle || "video";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      alert(error?.response?.data || "Download failed");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your Downloads</h2>
        <p className="text-gray-600">Sign in to see your downloaded videos.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading downloads...</div>;
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No downloads yet</h2>
        <p className="text-gray-600">
          Videos you download will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{downloads.length} downloaded video{downloads.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-4">
        {downloads.map((video, index) => (
          <div key={`${video._id}-${index}`} className="flex gap-4 group">
            <Link
              href={`/watch/${video?._id || ""}`}
              className="flex-shrink-0"
            >
              <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={`${backendUrl}/${video?.filepath || ""}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${video?._id || ""}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {video?.videotitle || "Untitled video"}
                </h3>
              </Link>
              <p className="text-sm text-gray-600">
                {video?.videochanel || "Unknown channel"}
              </p>
              <p className="text-sm text-gray-600">
                {(video?.views || 0).toLocaleString()} views •{" "}
                {video?.createdAt
                  ? formatDistanceToNow(new Date(video.createdAt))
                  : "recently"}{" "}
                ago
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 px-3 py-1 h-auto text-xs bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-1"
                onClick={() => handleReDownload(video)}
              >
                <Download className="w-3 h-3" />
                Re-download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
