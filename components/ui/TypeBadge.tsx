/**
 * TypeBadge-Komponente
 * Ovale Badges mit Typ-Farbe und SVG-Icon
 */

import Image from 'next/image';
import { getTypeColor, getGermanTypeName } from '@/lib/design-tokens';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function TypeBadge({
  type,
  size = 'md',
  showIcon = true,
  className = '',
}: TypeBadgeProps) {
  const typeColor = getTypeColor(type);
  const typeName = getGermanTypeName(type);
  const normalizedType = type.toLowerCase();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:brightness-110 border-2 ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${typeColor}30`, // 30% opacity
        borderColor: `${typeColor}80`,     // 80% opacity
        color: 'var(--foreground)',
      }}
    >
      {showIcon && (
        <Image
          src={`/icons/types/${normalizedType}.svg`}
          alt={`${normalizedType} type`}
          width={iconSizes[size]}
          height={iconSizes[size]}
          className="opacity-90"
        />
      )}
      <span>{typeName}</span>
    </span>
  );
}

