"use client";

import { useState } from "react";
import ProfileHeader, { type ProfileStat } from "./ProfileHeader";
import FollowButton from "./FollowButton";

type PublicProfileHeaderProps = {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  joinDate: string;
  watchedCount: number;
  followingCount: number;
  followersCount: number;
  currentUserId: string | null;
  targetUserId: string;
  initialIsFollowing: boolean;
};

export default function PublicProfileHeader({
  username,
  bio,
  avatarUrl,
  joinDate,
  watchedCount,
  followingCount,
  followersCount,
  currentUserId,
  targetUserId,
  initialIsFollowing,
}: PublicProfileHeaderProps) {
  const [followers, setFollowers] = useState(followersCount);

  const stats: ProfileStat[] = [
    { label: "Obejrzane filmy", value: String(watchedCount) },
    { label: "Obserwowani", value: String(followingCount) },
    { label: "Obserwujący", value: String(followers) },
    { label: "Data dołączenia", value: joinDate },
  ];

  return (
    <ProfileHeader
      username={username}
      bio={bio}
      avatarUrl={avatarUrl}
      stats={stats}
      emptyBioText="Ten użytkownik nie dodał jeszcze opisu."
      action={
        <FollowButton
          currentUserId={currentUserId}
          targetUserId={targetUserId}
          initialIsFollowing={initialIsFollowing}
          onFollowersChange={(delta) =>
            setFollowers((value) => Math.max(0, value + delta))
          }
        />
      }
    />
  );
}
