import type { Avatar as AvatarType } from '../types/trip';

interface AvatarProps {
  avatar: AvatarType;
  size?: number;
  fontSize?: number;
  className?: string;
}

export function Avatar({ avatar, size = 20, fontSize = 8, className = '' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        background: avatar.bg,
        color: avatar.color,
      }}
    >
      {avatar.initials}
    </div>
  );
}
