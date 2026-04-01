import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantClasses = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500/40 shadow-sm hover:shadow',
      secondary:
        'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500/40 shadow-sm hover:shadow',
      outline:
        'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500/30',
      ghost:
        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400/30',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40 shadow-sm hover:shadow',
    };

    const sizeClasses = {
      xs: 'px-2.5 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
    };

    const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={allClasses}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
