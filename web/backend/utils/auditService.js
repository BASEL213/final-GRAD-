const AuditLog = require('../models/AuditLog');

const formatAppId = (id) => {
    if (!id) return 'N/A';
    const s = String(id);
    return s.length > 8 ? `APP-${s.slice(-6).toUpperCase()}` : s;
};

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.userName
 * @param {string} [opts.role]
 * @param {string} opts.action - enum value e.g. APPLICATION_APPROVED
 * @param {string} [opts.targetType] - application | user | project | system | auth
 * @param {string} [opts.targetId]
 * @param {string} opts.details
 * @param {string} [opts.status] - SUCCESS | FAILED
 * @param {string} [opts.previousStatus]
 * @param {string} [opts.newStatus]
 * @param {string} [opts.rejectionReason]
 * @param {object} [req] - express request for IP / user-agent
 */
exports.recordAudit = async (opts, req = null) => {
    try {
        const payload = {
            userId: String(opts.userId || 'system'),
            userName: opts.userName || 'System',
            role: opts.role || 'admin',
            action: opts.action,
            targetType: opts.targetType || 'system',
            targetId: opts.targetId ? String(opts.targetId) : undefined,
            ipAddress: opts.ipAddress || req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
            userAgent: opts.userAgent || req?.headers?.['user-agent'] || 'Housing System',
            details: (opts.details || '').slice(0, 500),
            status: opts.status || 'SUCCESS',
            previousStatus: opts.previousStatus,
            newStatus: opts.newStatus,
            rejectionReason: opts.rejectionReason,
        };

        return await AuditLog.create(payload);
    } catch (err) {
        console.error('Audit log failed:', err.message);
        return null;
    }
};

exports.logLogin = async (user, req, success = true) => {
    return exports.recordAudit(
        {
            userId: user?._id || user?.id || 'unknown',
            userName: user?.name || 'Unknown',
            role: user?.role || 'citizen',
            action: success ? 'LOGIN' : 'FAILED_LOGIN',
            targetType: 'auth',
            targetId: user?.email,
            details: success
                ? `${user?.name} logged in successfully`
                : `Failed login attempt for ${user?.email || 'unknown email'}`,
            status: success ? 'SUCCESS' : 'FAILED',
        },
        req
    );
};

exports.logApplicationStatusChange = async (application, previousStatus, reviewer, req) => {
    const status = application.status;
    const action =
        status === 'approved'
            ? 'APPLICATION_APPROVED'
            : status === 'rejected'
              ? 'APPLICATION_REJECTED'
              : 'APPLICATION_UPDATED';

    const appRef = formatAppId(application._id);
    const details =
        status === 'approved'
            ? `${reviewer?.name || reviewer || 'Admin'} approved application ${appRef} for ${application.name}`
            : status === 'rejected'
              ? `${reviewer?.name || reviewer || 'Admin'} rejected application ${appRef} for ${application.name}`
              : `Application ${appRef} status changed from ${previousStatus} to ${status}`;

    return exports.recordAudit(
        {
            userId: reviewer?.id || reviewer?.userId || 'admin',
            userName: typeof reviewer === 'string' ? reviewer : reviewer?.name || 'Admin',
            role: reviewer?.role || 'admin',
            action,
            targetType: 'application',
            targetId: application._id,
            details,
            previousStatus,
            newStatus: status,
            rejectionReason: application.rejectionReason,
            status: 'SUCCESS',
        },
        req
    );
};

exports.logApplicationCreated = async (application, req) => {
    const appRef = formatAppId(application._id);
    return exports.recordAudit(
        {
            userId: application._id,
            userName: application.name,
            role: 'citizen',
            action: 'APPLICATION_CREATED',
            targetType: 'application',
            targetId: application._id,
            details: `Citizen ${application.name} submitted application ${appRef} for ${application.projectName}`,
            newStatus: 'pending',
            status: 'SUCCESS',
        },
        req
    );
};

exports.logUserChange = async (action, user, actor, req) => {
    const targetRef = user._id ? `USER-${String(user._id).slice(-6)}` : user.email;
    const actorName = typeof actor === 'string' ? actor : actor?.name || 'Admin';
    return exports.recordAudit(
        {
            userId: actor?.id || actor?._id || 'admin',
            userName: actorName,
            role: actor?.role || 'admin',
            action,
            targetType: 'user',
            targetId: user._id,
            details: `${actorName} — ${action.replace(/_/g, ' ').toLowerCase()} on ${user.name} (${targetRef})`,
            newStatus: user.status,
            status: 'SUCCESS',
        },
        req
    );
};
