import React from 'react';

const ErrorMessage = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`alert alert-danger d-flex align-items-center ${className}`}>
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      <div className="flex-grow-1">
        <strong>Error:</strong> {error}
      </div>
      {onRetry && (
        <button 
          className="btn btn-sm btn-outline-danger ms-2"
          onClick={onRetry}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
