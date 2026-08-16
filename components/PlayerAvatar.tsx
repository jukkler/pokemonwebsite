'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/avatars';

interface PlayerAvatarProps {
  avatar: string | null | undefined;
  name: string;
  color: string;
  size?: number;
  className?: string;
}

export default function PlayerAvatar({
  avatar,
  name,
  color,
  size = 32,
  className = '',
}: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const avatarUrl = getAvatarUrl(avatar);

  if (!avatarUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: color }}
      >
        {name.trim().charAt(0).toLocaleUpperCase('de-DE') || '?'}
      </span>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt={name}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
