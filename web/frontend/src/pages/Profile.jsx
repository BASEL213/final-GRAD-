import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/dataService';

const Profile = () => {
    const { user, updateUser } = useAuth();

    const buildForm = (u) => ({
        name:  u?.name  || '',
        phone: u?.phone || '',
        email: u?.email || '',
        role:  u?.role  || '',
        profile: {
            address:       u?.profile?.address       || '',
            dateOfBirth:   u?.profile?.dateOfBirth
                ? new Date(u.profile.dateOfBirth).toISOString().split('T')[0] : '',
            occupation:    u?.profile?.occupation    || '',
            familySize:    u?.profile?.familySize    || '',
            monthlyIncome: u?.profile?.monthlyIncome || '',
        },
    });

    const [formData, setFormData]   = useState(buildForm(user));
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { setFormData(buildForm(user)); }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('profile.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const updated = dataService.updateUser(user.id, {
                name:    formData.name,
                phone:   formData.phone,
                profile: formData.profile,
            });
            if (updated) {
                updateUser(updated);
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError('Failed to update profile');
            }
        } catch {
            setError('Error updating profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
        setFormData(buildForm(user));
    };

    if (!user) return (
        <div className="page-loading" style={{ minHeight: 300 }}>
            <div className="spinner-border text-primary" role="status" />
        </div>
    );

    const readOnly = (label, value, note) => (
        <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>{label}</label>
            <input type="text" className="form-control form-control-sm bg-light" value={value || '—'} disabled readOnly />
            {note && <small className="text-muted">{note}</small>}
        </div>
    );

    const field = (label, id, type, name, value, placeholder, extra = {}) => (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold" style={{ fontSize: 12 }}>{label}</label>
            <input
                type={type}
                className="form-control form-control-sm"
                id={id}
                name={name}
                value={value}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={isEditing ? placeholder : undefined}
                {...extra}
            />
        </div>
    );

    return (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* ── Header ─────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h2>My Profile</h2>
                    <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: 13 }}>
                        View and manage your account information
                    </p>
                </div>
                {!isEditing && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => { setIsEditing(true); setSuccess(''); }}>
                        <i className="bi bi-pencil-square me-1" />Edit Profile
                    </button>
                )}
            </div>

            {/* ── Alerts ─────────────────────────────────── */}
            {error   && <div className="alert alert-danger   alert-dismissible mb-4"><i className="bi bi-exclamation-circle me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}
            {success && <div className="alert alert-success  mb-4"><i className="bi bi-check-circle me-2" />{success}</div>}

            <form onSubmit={handleSubmit}>
                {/* ── Account section ────────────────────── */}
                <div className="card mb-4">
                    <div className="card-header">
                        <span className="fw-semibold" style={{ fontSize: 14 }}>
                            <i className="bi bi-person-badge me-2 text-primary" />Account Information
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                {field('Full Name', 'name', 'text', 'name', formData.name, 'Enter your full name', { required: true })}
                            </div>
                            <div className="col-md-6">
                                {readOnly('Email Address', user.email, 'Email cannot be changed')}
                            </div>
                            <div className="col-md-6">
                                {field('Phone Number', 'phone', 'tel', 'phone', formData.phone, 'e.g. 01XXXXXXXXX')}
                            </div>
                            <div className="col-md-6">
                                {readOnly('National ID', user.nationalId, 'National ID cannot be changed')}
                            </div>
                            <div className="col-md-6">
                                {readOnly('Account Type', user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')}
                            </div>
                            <div className="col-md-6">
                                {readOnly('Account Status', user.isVerified ? 'Verified ✓' : 'Not Verified')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Additional info section ─────────────── */}
                <div className="card mb-4">
                    <div className="card-header">
                        <span className="fw-semibold" style={{ fontSize: 14 }}>
                            <i className="bi bi-card-list me-2 text-primary" />Additional Information
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-12">
                                {field('Address', 'address', 'text', 'profile.address', formData.profile.address, 'Enter your address')}
                            </div>
                            <div className="col-md-6">
                                {field('Date of Birth', 'dateOfBirth', 'date', 'profile.dateOfBirth', formData.profile.dateOfBirth, '')}
                            </div>
                            <div className="col-md-6">
                                {field('Occupation', 'occupation', 'text', 'profile.occupation', formData.profile.occupation, 'e.g. Engineer')}
                            </div>
                            <div className="col-md-6">
                                {field('Family Size', 'familySize', 'number', 'profile.familySize', formData.profile.familySize, 'Number of members', { min: 1 })}
                            </div>
                            <div className="col-md-6">
                                {field('Monthly Income (EGP)', 'monthlyIncome', 'number', 'profile.monthlyIncome', formData.profile.monthlyIncome, 'e.g. 5000', { min: 0 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Save / Cancel ───────────────────────── */}
                {isEditing && (
                    <div className="d-flex gap-2 mb-4">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                : <><i className="bi bi-check-circle me-2" />Save Changes</>
                            }
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                            <i className="bi bi-x-circle me-2" />Cancel
                        </button>
                    </div>
                )}
            </form>

            {/* ── Footer meta ─────────────────────────────── */}
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                <i className="bi bi-info-circle me-1" />
                Account created {new Date(user.createdAt).toLocaleDateString()}
                {user.updatedAt && user.updatedAt !== user.createdAt && (
                    <> · Last updated {new Date(user.updatedAt).toLocaleDateString()}</>
                )}
            </div>
        </div>
    );
};

export default Profile;
