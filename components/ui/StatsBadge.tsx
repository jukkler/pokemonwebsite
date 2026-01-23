/**
 * Stats-Badge Komponente
 * Zeigt Durchschnitts-Basispunkte an
 */

interface StatsBadgeProps {
  label: string;
  value: number;
  variant?: 'blue' | 'green' | 'red' | 'yellow';
}

const variantClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function StatsBadge({ label, value, variant = 'blue' }: StatsBadgeProps) {
  return (
    <span className={`text-sm px-3 py-1.5 rounded-full font-medium border ${variantClasses[variant]}`}>
      {label}: {value}
    </span>
  );
}
