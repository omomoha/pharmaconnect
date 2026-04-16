import Link from 'next/link';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-5xl mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-8 max-w-md">{description}</p>
      )}
      {action && (
        action.onClick ? (
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : action.href ? (
          <Link href={action.href}>
            <Button variant="primary" size="md">
              {action.label}
            </Button>
          </Link>
        ) : null
      )}
    </div>
  );
}
