import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  minHeightClass?: string;
}

export function Card({
  children,
  className = '',
  hover = false,
  gradient = false,
  onClick,
  minHeightClass = ''
}: CardProps) {
  const baseStyles =
    'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200 flex flex-col';
  const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  const gradientStyles = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';
  const heightStyles = minHeightClass ?? '';
  
  const CardComponent = hover || onClick ? motion.div : 'div';
  
  return (
    <CardComponent
      className={`${baseStyles} ${hoverStyles} ${gradientStyles} ${heightStyles} ${className}`}
      onClick={onClick}
      {...(hover || onClick ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
      } : {})}
    >
      {children}
    </CardComponent>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-4 flex-1 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
