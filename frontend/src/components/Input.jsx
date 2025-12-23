/**
 * Input Component
 * Reusable input field with label and error handling
 */

import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-dark-700 border rounded-lg
            text-white placeholder-gray-500
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-dark-600 hover:border-dark-500'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
