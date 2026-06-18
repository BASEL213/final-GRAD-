import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterWorking = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        nationalId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            // Get existing users from localStorage
            const existingUsers = JSON.parse(localStorage.getItem('housingUsers') || '[]');
            
            // Check if user already exists
            if (existingUsers.find(user => user.email === formData.email)) {
                setError('User with this email already exists');
                setLoading(false);
                return;
            }

            // Create new user
            const newUser = {
                id: `user_${Date.now()}`,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                nationalId: formData.nationalId,
                role: 'citizen',
                isVerified: true,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            existingUsers.push(newUser);
            localStorage.setItem('housingUsers', JSON.stringify(existingUsers));

            // Auto login
            const token = btoa(JSON.stringify({ email: formData.email, timestamp: Date.now() }));
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            login(newUser, token);

            setSuccess('Registration successful! Redirecting to dashboard...');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            setError('Registration failed. Please try again.');
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
                            <i className="bi bi-building-gov me-2"></i>
                            Create Account
                        </h2>
                        <p className="text-muted">Register for the Housing System</p>
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
                            <label htmlFor="name" className="form-label">Full Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email Address *</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password *</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="nationalId" className="form-label">National ID</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nationalId"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="mb-0">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary text-decoration-none">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterWorking;
