/**
 * Session Code Display Component
 * Shows session code in a prominent, copyable format
 */

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

function SessionCodeDisplay({ code, label = 'Session Code' }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Session code copied!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="text-center">
      {label && (
        <p className="text-sm text-gray-400 mb-2">{label}</p>
      )}
      <div 
        className="relative inline-flex items-center justify-center px-8 py-4 bg-dark-700 rounded-xl cursor-pointer group"
        onClick={copyToClipboard}
      >
        <span className="session-code text-3xl font-bold text-white tracking-widest">
          {code}
        </span>
        <button
          className="absolute right-4 p-2 text-gray-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <FiCheck className="w-5 h-5 text-green-500" />
          ) : (
            <FiCopy className="w-5 h-5 group-hover:text-primary-400" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Click to copy
      </p>
    </div>
  );
}

export default SessionCodeDisplay;
