import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'default';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  className = '',
  type = 'button',
}) => {
  const baseStyles = 'font-rajdhani uppercase tracking-wider transition-all duration-250';
  
  const variantStyles = {
    primary: 'bg-secondary-500 text-bg-300 border-secondary-500 hover:bg-secondary-900',
    secondary: 'bg-primary-500 text-primary-200 border-primary-500 hover:bg-primary-800',
    default: 'bg-transparent text-primary-500 border-primary-500 hover:bg-primary-800 hover:text-primary-200',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
        border-2
        relative
        clip-path-notch
        before:content-['']
        before:absolute
        before:bg-current
        before:h-[3px]
        before:w-[22.627416px]
        before:bottom-[5px]
        before:right-[-6px]
        before:rotate-[-45deg]
        before:z-[100]
      `}
    >
      <span className="relative z-[2]">{children}</span>
    </button>
  );
};

export default Button; 