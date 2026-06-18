import React, { useState, useEffect } from 'react';

// Mock data service to avoid import issues
const mockDataService = {
  getNotifications: () => [
    {
      id: 'notif_001',
      title: 'New Application Received',
      message: 'A new housing application has been submitted',
      type: 'application',
      priority: 'high',
      status: 'unread',
      createdAt: new Date().toISOString(),
      user: 'System'
    },
    {
      id: 'notif_002',
      title: 'Project Update',
      message: 'Project status has been updated',
      type: 'project',
      priority: 'medium',
      status: 'read',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      user: 'Admin'
    },
    {
      id: 'notif_003',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight',
      type: 'system',
      priority: 'low',
      status: 'read',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      user: 'Admin'
    }
  ],
  subscribe: (callback) => {
    // Mock subscription - return unsubscribe function
    return () => {};
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load notifications
  const loadNotifications = () => {
    try {
      setLoading(true);
      setError(null);
      
      const notificationsData = mockDataService.getNotifications();
      setNotifications(notificationsData || []);
    } catch (err) {
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Setup data service subscription
  useEffect(() => {
    loadNotifications();
    
    const unsubscribe = mockDataService.subscribe((changeType, data, cache) => {
      if (changeType === 'notification_added' || changeType === 'notification_read') {
        loadNotifications();
      }
    });
    
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i className="bi bi-bell me-2"></i>Notifications</h2>
          <p className="text-muted mb-0">Manage system notifications and alerts</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-muted mb-3"></i>
              <h5 className="text-muted">No notifications found</h5>
              <p className="text-muted">
                No notifications available
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Type</th>
                    <th className="border-0">Message</th>
                    <th className="border-0">Priority</th>
                    <th className="border-0">Date</th>
                    <th className="border-0">Status</th>
                    <th className="border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr 
                      key={notification.id}
                      className={!notification.isRead ? 'table-active' : ''}
                    >
                      <td>
                        <div className="fw-medium">
                          {notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{notification.title}</div>
                          <small className="text-muted">{notification.message}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${notification.priority === 'high' ? 'danger' : notification.priority === 'medium' ? 'warning' : 'info'}`}>
                          {notification.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(notification.createdAt).toLocaleDateString()}
                          <br />
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        {notification.isRead ? (
                          <span className="badge bg-success">Read</span>
                        ) : (
                          <span className="badge bg-warning">Unread</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {!notification.isRead && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                dataService.markNotificationRead(notification.id);
                                loadNotifications();
                              }}
                              title="Mark as read"
                            >
                              <i className="bi bi-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this notification?')) {
                                dataService.deleteNotification(notification.id);
                                loadNotifications();
                              }
                            }}
                            title="Delete notification"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-primary mb-1">{notifications.length}</h3>
              <p className="text-muted mb-0">Total Notifications</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-warning mb-1">{notifications.filter(n => !n.isRead).length}</h3>
              <p className="text-muted mb-0">Unread</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger mb-1">{notifications.filter(n => n.priority === 'high').length}</h3>
              <p className="text-muted mb-0">High Priority</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-info mb-1">{notifications.filter(n => n.actionRequired).length}</h3>
              <p className="text-muted mb-0">Action Required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
