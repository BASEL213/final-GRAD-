import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordWorking = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!email) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        // Simulate password reset (in a real app, this would send an email)
        try {
            // Check if user exists
            const existingUsers = JSON.parse(localStorage.getItem('housingUsers') || '[]');
            const user = existingUsers.find(u => u.email === email);
            
            if (!user) {
                setError('No account found with this email address');
                setLoading(false);
                return;
            }

            // Simulate sending reset email
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setSuccess('Password reset instructions have been sent to your email address.');
            setEmail('');
        } catch (err) {
            setError('Failed to send reset instructions. Please try again.');
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
                            <i className="bi bi-lock me-2"></i>
                            Forgot Password
                        </h2>
                        <p className="text-muted">Enter your email to reset your password</p>
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

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <small className="text-muted">We'll send password reset instructions to this email</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Instructions'
                            )}
                        </button>
                    </form>

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

export default ForgotPasswordWorking;
