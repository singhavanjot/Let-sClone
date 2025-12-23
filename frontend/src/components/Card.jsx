/**
 * Card Component
 * Reusable card container
 */

function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  ...props 
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={`
        bg-dark-800 border border-dark-700 rounded-xl
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
