import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { clsx } from 'clsx';

interface IconButtonProps extends HTMLMotionProps<"button"> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  variant = 'primary', 
  size = 'md', 
  className, 
  title,
  ...props 
}) => {
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20 glow-accent",
    secondary: "bg-white/90 dark:bg-black/70 text-slate-900 dark:text-white border border-white/20 dark:border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:bg-white dark:hover:bg-black",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-dark-section text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
    glass: "glass hover:bg-white/90 dark:hover:bg-dark-card/90 text-slate-600 dark:text-slate-300 shadow-lg"
  };

  const sizes = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2.5",
    lg: "w-12 h-12 p-3"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={clsx(
        "flex items-center justify-center rounded-full transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      title={title}
      {...props}
    >
      {icon}
    </motion.button>
  );
};
