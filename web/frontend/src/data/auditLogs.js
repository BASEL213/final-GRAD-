export const auditLogs = [
  {
    id: 1,
    admin: "Admin User",
    action: "Approved application for Ahmed Mohamed",
    target: "Application #1",
    date: "2024-01-20 14:30:00",
    type: "approval"
  },
  {
    id: 2,
    admin: "Admin User",
    action: "Rejected application for Mohamed Hassan",
    target: "Application #3",
    date: "2024-01-19 10:15:00",
    type: "rejection"
  },
  {
    id: 3,
    admin: "Admin User",
    action: "Created new project: Delta Green Community",
    target: "Project #8",
    date: "2024-01-18 16:45:00",
    type: "creation"
  },
  {
    id: 4,
    admin: "Admin User",
    action: "Updated project: Cairo Garden Residences",
    target: "Project #1",
    date: "2024-01-17 09:20:00",
    type: "update"
  },
  {
    id: 5,
    admin: "Admin User",
    action: "Approved application for Omar Khalid",
    target: "Application #5",
    date: "2024-01-16 13:00:00",
    type: "approval"
  },
  {
    id: 6,
    admin: "Admin User",
    action: "Rejected application for Kamal Rashid",
    target: "Application #7",
    date: "2024-01-15 11:30:00",
    type: "rejection"
  },
  {
    id: 7,
    admin: "Admin User",
    action: "Approved application for Laila Mohamed",
    target: "Application #8",
    date: "2024-01-14 15:45:00",
    type: "approval"
  },
  {
    id: 8,
    admin: "Admin User",
    action: "Deleted project: Old Cairo Complex",
    target: "Project #9",
    date: "2024-01-13 08:00:00",
    type: "deletion"
  },
  {
    id: 9,
    admin: "Admin User",
    action: "Updated user role: Reviewer to Admin",
    target: "User #12",
    date: "2024-01-12 12:30:00",
    type: "role_change"
  },
  {
    id: 10,
    admin: "Admin User",
    action: "Exported applications report",
    target: "Report System",
    date: "2024-01-11 17:00:00",
    type: "export"
  },
  {
    id: 11,
    admin: "Admin User",
    action: "Modified project pricing: Alexandria Coastal Towers",
    target: "Project #2",
    date: "2024-01-10 14:15:00",
    type: "update"
  },
  {
    id: 12,
    admin: "Admin User",
    action: "Approved application for Fatma Ali",
    target: "Application #2",
    date: "2024-01-09 10:45:00",
    type: "approval"
  }
];

export const getActionColor = (type) => {
  switch (type) {
    case 'approval':
      return 'success';
    case 'rejection':
      return 'danger';
    case 'creation':
      return 'primary';
    case 'update':
      return 'info';
    case 'deletion':
      return 'warning';
    case 'role_change':
      return 'secondary';
    case 'export':
      return 'dark';
    default:
      return 'secondary';
  }
};

export const getActionIcon = (type) => {
  switch (type) {
    case 'approval':
      return 'v';
    case 'rejection':
      return 'x';
    case 'creation':
      return '+';
    case 'update':
      return 'edit';
    case 'deletion':
      return '-';
    case 'role_change':
      return 'person';
    case 'export':
      return 'graph-up';
    default:
      return 'circle';
  }
};
