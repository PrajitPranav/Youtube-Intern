import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import DownloadsContent from "@/components/DownloadsContent";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, login } = useUser();
  const [activeTab, setActiveTab] = useState("videos");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  const channelId = id || user?._id;
  const isOwnChannel = user && (channelId === user._id || channelId === id);


  useEffect(() => {
    if (!channelId) return;
    const fetchChannel = async () => {
      try {
        const res = await axiosInstance.get(`/user/${channelId}`);
        setChannelData(res.data);
      } catch {
        
        setChannelData(user);
      }
    };
    fetchChannel();
  }, [channelId]);

  useEffect(() => {
    const fetchVideos = async () => {
      setVideosLoading(true);
      try {
        const res = await axiosInstance.get("/video/getall");
        const all: any[] = Array.isArray(res.data) ? res.data : [];
        // Show videos uploaded by this channel (matched by uploader email or channel name)
        const channelName =
          channelData?.channelname ||
          channelData?.name ||
          user?.channelname ||
          user?.name;
        const filtered = all.filter(
          (v) =>
            v.uploader === channelName ||
            v.videochanel === channelName ||
            v.videochanel === channelData?.channelname
        );
        setChannelVideos(filtered.length > 0 ? filtered : all);
      } catch {
        setChannelVideos([]);
      } finally {
        setVideosLoading(false);
      }
    };
    fetchVideos();
  }, [channelData]);

  const displayChannel = channelData || user;

  const handleUpgradeToPremium = async () => {
    if (!user) {
      alert("Please sign in to upgrade to Premium");
      return;
    }
    if (user.isPremium) {
      alert("You are already a Premium member!");
      return;
    }
    setPaymentLoading(true);
    try {
      const orderRes = await axiosInstance.post("/payment/create-order");
      const order = orderRes.data;
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "YourTube Premium",
        description: "Unlimited video downloads",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
            });
            if (verifyRes.data?.success) {
              login({ ...user, isPremium: true });
              alert("🎉 You are now a Premium member! Enjoy unlimited downloads.");
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#2563EB" },
        modal: { ondismiss: () => setPaymentLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={displayChannel} user={user} />

      
        {user && !user.isPremium && (
          <div className="mx-4 my-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Upgrade to Premium</p>
                <p className="text-xs text-gray-500">Download unlimited videos for just ₹99</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleUpgradeToPremium}
              disabled={paymentLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-4 py-2 rounded-full"
            >
              {paymentLoading ? "Processing..." : "Upgrade · ₹99"}
            </Button>
          </div>
        )}

    
        {user && user.isPremium && (
          <div className="mx-4 my-3 flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg px-4 py-2 w-fit">
            <Crown className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-700">
              Premium Member — Unlimited Downloads
            </p>
          </div>
        )}

        <Channeltabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "downloads" ? (
          <div className="px-4 py-6">
            <DownloadsContent />
          </div>
        ) : (
          <>
         
            {isOwnChannel && (
              <div className="px-4 pb-8">
                <VideoUploader
                  channelId={channelId}
                  channelName={displayChannel?.channelname || displayChannel?.name}
                />
              </div>
            )}
            <div className="px-4 pb-8">
              {videosLoading ? (
                <div className="text-center py-8 text-gray-500">Loading videos...</div>
              ) : (
                <ChannelVideos videos={channelVideos} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;
