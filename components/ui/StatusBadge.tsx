/**
 * Status-Badge Komponente
 * Zeigt verschiedene Status-Informationen an (K.O., Team, etc.)
 */

interface StatusBadgeProps {
  icon?: string;
  text: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
  onClick?: () => void;
  className?: string;
}

const variantClasses = {
  success: 'bg-green-50 text-green-700 border-green-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function StatusBadge({ 
  icon, 
  text, 
  variant, 
  onClick,
  className = '' 
}: StatusBadgeProps) {
  const baseClasses = `text-sm px-3 py-1.5 rounded-full font-medium border ${variantClasses[variant]}`;
  const interactiveClasses = onClick ? 'cursor-help' : '';

  return (
    <span 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
}
