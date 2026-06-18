import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const getStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 6)            score++;
  if (pw.length >= 10)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[a-z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[!@#$%^&*_\-]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak',   color: '#ef4444', pct: 33  };
  if (score <= 4) return { label: 'Medium', color: '#f59e0b', pct: 66  };
  return             { label: 'Strong', color: '#22c55e', pct: 100 };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email,           setEmail]           = useState('');
  const [code,            setCode]            = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!code || !/^\d{6}$/.test(code)) {
      setError('Reset code must be exactly 6 digits.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must contain an uppercase letter, a lowercase letter, and a digit.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Simulate code verification and update password in localStorage
      const users = JSON.parse(localStorage.getItem('housingUsers') || '[]');
      const idx = users.findIndex(u => u.email === email);
      if (idx === -1) {
        setError('No account found with this email address.');
        return;
      }
      await new Promise(r => setTimeout(r, 1200));
      users[idx].password = newPassword;
      localStorage.setItem('housingUsers', JSON.stringify(users));
      setSuccess('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'var(--gray-50)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-200)', borderRadius: 16 }}>
        <div className="card-body p-4">

          {/* Header */}
          <div className="text-center mb-4">
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(37,99,235,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <i className="bi bi-lock-fill text-primary" style={{ fontSize: 22 }} />
            </div>
            <h4 style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>Reset Password</h4>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: 0 }}>
              Enter the 6-digit code from your email and set a new password
            </p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
              <i className="bi bi-check-circle-fill" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>
                Email Address
              </label>
              <input type="email" className="form-control" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your registered email" required />
            </div>

            {/* 6-digit code */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>
                Reset Code
              </label>
              <input
                type="text"
                className="form-control text-center font-monospace"
                style={{ fontSize: 22, letterSpacing: '0.5em', fontWeight: 700 }}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
              />
              <small style={{ fontSize: 11, color: 'var(--gray-400)' }}>Check your email for the 6-digit code</small>
            </div>

            {/* New password */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>
                New Password
              </label>
              <div className="input-group">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  style={{ borderRight: 'none' }}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 chars, uppercase, lowercase, digit"
                  required
                />
                <button type="button" className="input-group-text" style={{ background: 'var(--gray-50)', cursor: 'pointer' }}
                  onClick={() => setShowNew(s => !s)} tabIndex={-1}>
                  <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'} text-muted`} style={{ fontSize: 14 }} />
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</small>
                    <small style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      {[
                        [/[A-Z]/.test(newPassword), 'A–Z'],
                        [/[a-z]/.test(newPassword), 'a–z'],
                        [/\d/.test(newPassword), '0–9'],
                      ].map(([ok, lbl]) => (
                        <span key={lbl} style={{ marginLeft: 6, color: ok ? '#22c55e' : 'var(--gray-300)' }}>
                          <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-circle'}`} /> {lbl}
                        </span>
                      ))}
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="mb-4">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>
                Confirm Password
              </label>
              <div className="input-group">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    borderRight: 'none',
                    borderColor: passwordsMatch ? '#22c55e' : passwordsMismatch ? '#ef4444' : undefined,
                  }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
                <button type="button" className="input-group-text" style={{ background: 'var(--gray-50)', cursor: 'pointer' }}
                  onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
                  <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'} text-muted`} style={{ fontSize: 14 }} />
                </button>
              </div>
              {passwordsMatch   && <small style={{ fontSize: 11, color: '#22c55e' }}><i className="bi bi-check-circle-fill me-1" />Passwords match</small>}
              {passwordsMismatch && <small style={{ fontSize: 11, color: '#ef4444' }}><i className="bi bi-x-circle-fill me-1" />Passwords do not match</small>}
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3"
              style={{ fontWeight: 600, padding: '11px' }}
              disabled={loading || !!success}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Resetting Password…</>
              ) : (
                <><i className="bi bi-check-lg me-2" />Reset Password</>
              )}
            </button>
          </form>

          <div className="text-center" style={{ fontSize: 13 }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none', marginRight: 16 }}>
              <i className="bi bi-arrow-left me-1" />Resend code
            </Link>
            <Link to="/login" style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
