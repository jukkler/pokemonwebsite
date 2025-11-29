/**
 * TypeBadge-Komponente
 * Ovale Badges mit Typ-Farbe und Icon
 */

import { getTypeColor, getGermanTypeName, getTypeIcon } from '@/lib/design-tokens';

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
  const typeIcon = getTypeIcon(type);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: typeColor }}
    >
      {showIcon && <span className="text-white">{typeIcon}</span>}
      <span>{typeName}</span>
    </span>
  );
}

