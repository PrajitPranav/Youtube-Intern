import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import DownloadsContent from "@/components/DownloadsContent";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, login } = useUser();
  const [activeTab, setActiveTab] = useState("videos");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const videos = [
    {
      _id: "1",
      videotitle: "Amazing Nature Documentary",
      filename: "nature-doc.mp4",
      filetype: "video/mp4",
      filepath: "/videos/nature-doc.mp4",
      filesize: "500MB",
      videochanel: "Nature Channel",
      Like: 1250,
      views: 45000,
      uploader: "nature_lover",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      videotitle: "Cooking Tutorial: Perfect Pasta",
      filename: "pasta-tutorial.mp4",
      filetype: "video/mp4",
      filepath: "/videos/pasta-tutorial.mp4",
      filesize: "300MB",
      videochanel: "Chef's Kitchen",
      Like: 890,
      views: 23000,
      uploader: "chef_master",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

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
              // Update local user context with premium status
              login({ ...user, isPremium: true });
              alert(
                "🎉 You are now a Premium member! Enjoy unlimited downloads."
              );
            }
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
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

  try {
    let channel = user;

    return (
      <div className="flex-1 min-h-screen bg-white">
        <div className="max-w-full mx-auto">
          <ChannelHeader channel={channel} user={user} />

          {/* Premium upgrade banner — shown only if user exists and is not premium */}
          {user && !user.isPremium && (
            <div className="mx-4 my-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Upgrade to Premium
                  </p>
                  <p className="text-xs text-gray-500">
                    Download unlimited videos for just ₹99
                  </p>
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

          {/* Premium badge — shown when user is premium */}
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
              <div className="px-4 pb-8">
                <VideoUploader channelId={id} channelName={channel?.channelname} />
              </div>
              <div className="px-4 pb-8">
                <ChannelVideos videos={videos} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching channel data:", error);
    return null;
  }
};

export default index;
