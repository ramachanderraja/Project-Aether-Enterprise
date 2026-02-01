import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange';
  size?: 'sm' | 'md';
  rounded?: boolean;
}

const variantClasses = {
  default: 'bg-secondary-100 text-secondary-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  rounded = true,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        rounded ? 'rounded-full' : 'rounded'
      )}
    >
      {children}
    </span>
  );
}
