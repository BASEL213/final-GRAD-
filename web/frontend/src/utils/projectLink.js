/** Normalize MongoDB / string IDs for comparison */
export const normalizeId = (id) => (id == null ? '' : String(id).trim());

/** Find a project from list by application.projectId */
export const findProjectById = (projects, projectId) => {
  const pid = normalizeId(projectId);
  if (!pid) return null;
  return (
    projects.find(
      (p) => normalizeId(p._id) === pid || normalizeId(p.id) === pid
    ) || null
  );
};

/** Short display code (last 8 chars) with full ID in tooltip */
export const formatMongoIdShort = (id) => {
  const full = normalizeId(id);
  if (!full) return '—';
  if (full.length <= 10) return full;
  return full.slice(-8).toUpperCase();
};

/** Enrich one application with project + applicant fields from MongoDB */
export const enrichApplication = (app, projects = []) => {
  const mongoId = normalizeId(app._id || app.id);
  const project = app.projectDetails
    ? {
        _id: app.projectMongoId || app.projectDetails?._id,
        name: app.projectName,
        location: app.projectLocation || app.projectDetails?.location,
        status: app.projectStatus || app.projectDetails?.status,
      }
    : findProjectById(projects, app.projectId);

  const projectLinked =
    app.projectLinked === true ||
    (!!project && !!normalizeId(app.projectId));

  const applicantName =
    (app.applicantName && app.applicantName.trim()) ||
    (app.name && app.name.trim()) ||
    (app.email ? app.email.split('@')[0] : 'Unknown User');

  return {
    ...app,
    id: mongoId,
    _id: mongoId,
    applicantName,
    applicantEmail: app.applicantEmail || app.email || '',
    applicantPhone: app.applicantPhone || app.phone || '',
    nationalId: app.nationalId || '',
    projectId: normalizeId(app.projectId),
    projectMongoId: normalizeId(project?._id || app.projectMongoId),
    projectName: project?.name || app.projectName || 'Unknown Project',
    projectLocation: project?.location || app.projectLocation || '',
    projectLinked,
    submittedDate: app.createdAt || app.submittedDate || app.submittedAt,
  };
};

export const enrichApplications = (applications, projects) =>
  (applications || []).map((app) => enrichApplication(app, projects));

/** Keep only applications linked to a project in MongoDB */
export const filterLinkedApplications = (applications) =>
  (applications || []).filter((app) => app.projectLinked === true);
