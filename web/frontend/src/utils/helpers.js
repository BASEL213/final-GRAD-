// Status badge helper
export const getStatusBadge = (status) => {
  const badgeClass = {
    pending: 'bg-warning',
    approved: 'bg-success',
    rejected: 'bg-danger'
  }[status] || 'bg-secondary';

  return <span className={`badge ${badgeClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

// Date formatter
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

// API helper
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(`http://localhost:5000${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'Request failed');
    }
  } catch (error) {
    console.error('API call error:', error);
    return { success: false, error: error.message };
  }
};

// Loading spinner component
export const LoadingSpinner = ({ size = 'normal', text = 'Loading...' }) => {
  const spinnerClass = size === 'small' ? 'spinner-border-sm' : '';
  
  return (
    <div className="text-center py-5">
      <div className={`spinner-border text-primary ${spinnerClass}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="mt-2 text-muted">{text}</div>
    </div>
  );
};

// Error alert component
export const ErrorAlert = ({ error, message }) => (
  <div className="alert alert-danger d-flex align-items-center mb-4">
    <i className="bi bi-exclamation-triangle me-2"></i>
    <div>
      <strong>Error:</strong> {error}
      {message && <div className="small mt-1">{message}</div>}
    </div>
  </div>
);
