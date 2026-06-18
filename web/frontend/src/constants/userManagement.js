export const DEPARTMENTS = [
  'Housing Review',
  'Finance',
  'Complaints',
  'Support',
  'Administration',
];

export const STAFF_ROLES = ['admin', 'employee'];

export const ALL_ROLES = ['citizen', 'employee', 'admin'];

export const USER_STATUSES = ['active', 'inactive', 'suspended'];

export const EMPTY_STAFF_FORM = {
  name: '',
  email: '',
  phone: '',
  nationalId: '',
  password: '',
  department: 'Housing Review',
  role: 'employee',
  status: 'active',
};

export const normalizeRole = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'reviewer' || r === 'viewer') return 'employee';
  return r;
};

export const isStaffRole = (role) => STAFF_ROLES.includes(normalizeRole(role));

/** Department is internal staff metadata only — not shown for citizens */
export const getDisplayDepartment = (user) => {
  if (!user || !isStaffRole(user.role)) return null;
  const dept = user.department;
  if (!dept || dept === 'General') return null;
  return dept;
};

/** Build lookup sets from MongoDB applications (match by email or national ID) */
export const buildApplicantIndex = (applications = []) => {
  const byEmail = new Set();
  const byNationalId = new Set();
  applications.forEach((app) => {
    const email = (app.email || app.applicantEmail || '').trim().toLowerCase();
    const nid = (app.nationalId || '').trim();
    if (email) byEmail.add(email);
    if (nid) byNationalId.add(nid);
  });
  return { byEmail, byNationalId };
};

export const citizenHasApplication = (user, applicantIndex) => {
  if (!user) return false;
  if (user.hasApplication === true) return true;
  if (!applicantIndex) return false;
  const email = (user.email || '').trim().toLowerCase();
  const nid = (user.nationalId || '').trim();
  const byEmail = applicantIndex.byEmail.has(email);
  const byNid = applicantIndex.byNationalId.has(nid);
  if (byEmail) return true;
  if (byNid && user.applicationNationalIdMatch !== false) return true;
  return byNid;
};

/** UI-only label for citizens — not used for authentication */
export const getCitizenApplicantDisplay = (user, applicantIndex) => {
  if (citizenHasApplication(user, applicantIndex)) {
    return { label: 'Active Applicant', badgeClass: 'bg-success' };
  }
  return { label: 'Inactive Applicant', badgeClass: 'bg-secondary' };
};

/** Combined status column: applicant state for citizens, account status for staff */
export const getUserDisplayStatus = (user, applicantIndex) => {
  const role = normalizeRole(user.role);
  if (role === 'citizen') {
    return getCitizenApplicantDisplay(user, applicantIndex);
  }
  const status = user.status || 'active';
  const map = {
    active: { label: 'Active', badgeClass: 'bg-success' },
    inactive: { label: 'Inactive', badgeClass: 'bg-secondary' },
    suspended: { label: 'Suspended', badgeClass: 'bg-warning text-dark' },
  };
  return map[status] || { label: status, badgeClass: 'bg-secondary' };
};

export const getHasApplicationDisplay = (user, applicantIndex) => {
  const role = normalizeRole(user.role);
  if (role !== 'citizen') return { text: '—', badgeClass: null };
  const hasApp = citizenHasApplication(user, applicantIndex);
  const emailOnly =
    user.applicationEmailMatch === true ||
    (user.email && applicantIndex?.byEmail?.has((user.email || '').toLowerCase()));
  const nidOnly = hasApp && !emailOnly && user.applicationNationalIdMatch === true;
  if (hasApp) {
    return {
      text: nidOnly ? 'Yes (ID only)' : 'Yes',
      badgeClass: nidOnly ? 'bg-warning text-dark' : 'bg-success',
      title: nidOnly
        ? 'Matched by National ID only — email differs from application. Run DB fix script.'
        : 'Application linked by email',
    };
  }
  return { text: 'No', badgeClass: 'bg-light text-dark border', title: '' };
};

export const formatLastLogin = (dateStr) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today ${time}`;
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
