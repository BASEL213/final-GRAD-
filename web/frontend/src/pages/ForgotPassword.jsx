import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [token, setToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [showNew,     setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Check if user exists in localStorage
            const existingUsers = JSON.parse(localStorage.getItem('housingUsers') || '[]');
            const user = existingUsers.find(u => u.email === email);
            
            if (!user) {
                setError('No account found with this email address');
                setLoading(false);
                return;
            }

            // Simulate sending reset email
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setSuccess('Instructions sent. Enter any token below to set your new password.');
            setShowToken(true);
            setIsResetting(true);
            setEmail('');
        } catch (err) {
            setError('Failed to send reset instructions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!token.trim()) {
            setError('Reset token is required');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Simulate password reset with localStorage
            const existingUsers = JSON.parse(localStorage.getItem('housingUsers') || '[]');
            
            // For demo purposes, accept any token and update password
            // In real app, you would validate the token
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setSuccess('Password reset successful! Redirecting to login...');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="card shadow-lg" style={{ width: '100%', maxWidth: '450px' }}>
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-primary">
                            <i className="bi bi-key-fill me-2"></i>
                            {isResetting ? 'Reset Password' : 'Forgot Password'}
                        </h2>
                        <p className="text-muted">
                            {isResetting 
                                ? 'Enter your reset token and new password'
                                : 'Enter your email to receive a password reset token'
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success" role="alert">
                            {success}
                        </div>
                    )}

                    {!isResetting ? (
                        <form onSubmit={handleForgotPassword}>
                            <div className="mb-4">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                                <small className="text-muted">We'll send a reset token to this email</small>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Sending Reset Token...
                                    </>
                                ) : (
                                    'Send Reset Token'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="mb-3">
                                <label htmlFor="token" className="form-label">Reset Token</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Enter the reset token from your email"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="newPassword" className="form-label">New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        className="form-control"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        style={{ borderRight: 'none' }}
                                        required
                                    />
                                    <button type="button" className="input-group-text"
                                        style={{ background: 'var(--gray-50)', cursor: 'pointer' }}
                                        onClick={() => setShowNew(s => !s)} tabIndex={-1}>
                                        <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'} text-muted`} style={{ fontSize: 14 }} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="form-control"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        style={{ borderRight: 'none',
                                            borderColor: confirmPassword.length > 0
                                                ? newPassword === confirmPassword ? '#22c55e' : '#ef4444'
                                                : undefined }}
                                        required
                                    />
                                    <button type="button" className="input-group-text"
                                        style={{ background: 'var(--gray-50)', cursor: 'pointer' }}
                                        onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
                                        <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'} text-muted`} style={{ fontSize: 14 }} />
                                    </button>
                                </div>
                                {confirmPassword.length > 0 && newPassword === confirmPassword && (
                                    <small style={{ fontSize: 11, color: '#22c55e' }}><i className="bi bi-check-circle-fill me-1" />Passwords match</small>
                                )}
                                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                    <small style={{ fontSize: 11, color: '#ef4444' }}><i className="bi bi-x-circle-fill me-1" />Passwords do not match</small>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-4">
                        <p className="mb-0">
                            <Link to="/login" className="text-primary text-decoration-none">
                                <i className="bi bi-arrow-left me-1"></i>
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
