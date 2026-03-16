import React from "react";
import { PlaySquare } from "lucide-react";
import { useUser } from "@/lib/AuthContext";

export default function SubscriptionsPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <main className="flex-1 p-8">
        <div className="text-center py-16">
          <PlaySquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Don&apos;t miss new videos</h2>
          <p className="text-gray-600">
            Sign in to see updates from your favourite YouTube channels.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold mb-6">Subscriptions</h1>
      <div className="text-center py-16">
        <PlaySquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
        <p className="text-gray-600">
          Channels you subscribe to will appear here.
        </p>
      </div>
    </main>
  );
}
