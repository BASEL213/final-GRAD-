import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        const token = data.data.token;
        const user = data.data.user;
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        login(user, token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Cannot connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ── shared style tokens ── */
  const W = 'rgba(255,255,255,';
  const inputBase = {
    background: `${W}0.10)`,
    border: `1px solid ${W}0.22)`,
    color: '#fff',
    fontSize: 14,
    borderRadius: 0,
  };
  const iconBase = {
    background: `${W}0.08)`,
    border: `1px solid ${W}0.22)`,
    color: `${W}0.65)`,
    borderRadius: 0,
  };
  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: `${W}0.60)`,
    marginBottom: 7,
  };

  const features = [
    { icon: 'bi-file-earmark-check-fill', label: 'Applications', desc: 'Review & approve' },
    { icon: 'bi-building-fill',           label: 'Projects',     desc: 'Manage inventory' },
    { icon: 'bi-people-fill',             label: 'Employees',    desc: 'User management'  },
    { icon: 'bi-graph-up-arrow',          label: 'Reports',      desc: 'Analytics & logs' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(145deg, #061528 0%, #0a2d5e 28%, #1059a8 58%, #1b7cd8 82%, #3a9ae8 100%)',
    }}>

      {/* ── Decorative background orbs ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27,124,216,0.35) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-8%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(58,154,232,0.28) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '38%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }} />
      </div>

      {/* ══════════════════════════════════════
          LEFT — branding panel
      ══════════════════════════════════════ */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between"
        style={{ flex: '0 0 45%', padding: '52px 56px', color: '#fff', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 46, height: 46,
            background: `${W}0.14)`,
            border: `1px solid ${W}0.22)`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)',
          }}>
            <i className="bi bi-building-fill" style={{ fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.01em' }}>Findoor</div>
            <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 1 }}>
              Admin Portal
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${W}0.10)`,
            border: `1px solid ${W}0.18)`,
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${W}0.75)`,
            marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Secure Government Portal
          </div>

          <h1 style={{
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            Find the right<br />door for every<br />
            <span style={{ color: '#7dd3fc' }}>resident.</span>
          </h1>

          <p style={{
            opacity: 0.65,
            fontSize: 14.5,
            lineHeight: 1.75,
            maxWidth: 360,
            marginBottom: 36,
          }}>
            Findoor streamlines housing applications, manages social projects, and
            delivers efficient services — all from one unified platform.
          </p>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 380 }}>
            {features.map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: `${W}0.07)`,
                border: `1px solid ${W}0.14)`,
                borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{
                  width: 34, height: 34, flexShrink: 0,
                  background: `${W}0.12)`,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize: 15 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11.5, opacity: 0.40, letterSpacing: '0.02em' }}>
          © {new Date().getFullYear()} Findoor — All rights reserved
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — login card
      ══════════════════════════════════════ */}
      <div
        className="d-flex align-items-center justify-content-center flex-grow-1 p-4"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div style={{
          width: '100%',
          maxWidth: 430,
          background: `${W}0.09)`,
          border: `1px solid ${W}0.18)`,
          borderRadius: 20,
          padding: '44px 40px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.30)',
        }}>

          {/* Mobile brand */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-5">
            <i className="bi bi-building-fill" style={{ fontSize: 18, color: '#fff' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '0.01em' }}>
              Findoor
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontWeight: 800,
              fontSize: 26,
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              Welcome back
            </h2>
            <p style={{ color: `${W}0.55)`, fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Sign in to access the administration portal
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 10,
              padding: '11px 14px',
              marginBottom: 24,
              fontSize: 13,
              color: '#fca5a5',
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="email" style={labelStyle}>Email Address</label>
              <div className="input-group" style={{ borderRadius: 10, overflow: 'hidden' }}>
                <span className="input-group-text" style={iconBase}>
                  <i className="bi bi-envelope" style={{ fontSize: 14 }} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="form-control login-input"
                  style={inputBase}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{
                  fontSize: 12,
                  color: `${W}0.55)`,
                  textDecoration: 'none',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-group" style={{ borderRadius: 10, overflow: 'hidden' }}>
                <span className="input-group-text" style={iconBase}>
                  <i className="bi bi-lock" style={{ fontSize: 14 }} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control login-input"
                  style={{ ...inputBase, borderRight: 'none' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group-text"
                  style={{ ...iconBase, borderLeft: 'none', cursor: 'pointer' }}
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              className="btn w-100"
              style={{
                padding: '13px',
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: '0.02em',
                background: '#fff',
                color: '#1059a8',
                border: 'none',
                borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              disabled={loading}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'; }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"
                    style={{ borderColor: '#1059a8', borderRightColor: 'transparent' }} />
                  Signing in…
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
