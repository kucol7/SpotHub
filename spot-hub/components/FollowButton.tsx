"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "../lib/supabase/client";

type FollowButtonProps = {
  currentUserId: string | null;
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowersChange?: (delta: number) => void;
};

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialIsFollowing,
  onFollowersChange,
}: FollowButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) {
          throw error;
        }

        setIsFollowing(false);
        onFollowersChange?.(-1);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });

        if (error) {
          throw error;
        }

        setIsFollowing(true);
        onFollowersChange?.(1);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        isFollowing
          ? "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-600 px-6 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isFollowing ? "Obserwujesz" : "Obserwuj"}
    </button>
  );
}
