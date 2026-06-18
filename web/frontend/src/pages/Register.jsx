import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        nationalId: '',
        role: 'citizen'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const { name, email, password, confirmPassword, phone, nationalId } = formData;

        if (!name.trim() || name.length < 3) {
            setError('Name must be at least 3 characters long');
            return false;
        }

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }

        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            setError('Password must contain an uppercase letter, a lowercase letter, and a digit');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (!phone || !/^01[0-9]{9}$/.test(phone)) {
            setError('Phone number must start with 01 and be 11 digits');
            return false;
        }

        if (!nationalId || !/^[0-9]{14}$/.test(nationalId)) {
            setError('National ID must be exactly 14 digits');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    nationalId: formData.nationalId,
                    role: formData.role
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Registration successful! Redirecting to login...');

                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.data.user));

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">
                                    <i className="bi bi-house-door-fill me-2"></i>
                                    Findoor Registration
                                </h2>
                                <p className="text-muted">
                                    Create your account to apply for government housing
                                </p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <div className="mt-1">
                                        <Form.Text className={`d-block ${formData.password.length >= 6 ? 'text-success' : 'text-danger'}`}>
                                            {formData.password.length >= 6 ? '✓' : '✗'} At least 6 characters
                                        </Form.Text>
                                        <Form.Text className={`d-block ${/[A-Z]/.test(formData.password) ? 'text-success' : 'text-danger'}`}>
                                            {/[A-Z]/.test(formData.password) ? '✓' : '✗'} One uppercase letter (A–Z)
                                        </Form.Text>
                                        <Form.Text className={`d-block ${/[a-z]/.test(formData.password) ? 'text-success' : 'text-danger'}`}>
                                            {/[a-z]/.test(formData.password) ? '✓' : '✗'} One lowercase letter (a–z)
                                        </Form.Text>
                                        <Form.Text className={`d-block ${/\d/.test(formData.password) ? 'text-success' : 'text-danger'}`}>
                                            {/\d/.test(formData.password) ? '✓' : '✗'} One digit (0–9)
                                        </Form.Text>
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="01xxxxxxxxx"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Must start with 01 and be 11 digits
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>National ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nationalId"
                                        value={formData.nationalId}
                                        onChange={handleChange}
                                        placeholder="14-digit National ID"
                                        maxLength="14"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Must be exactly 14 digits
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Account Type</Form.Label>
                                    <div>
                                        <Form.Check
                                            type="radio"
                                            label="Citizen"
                                            name="role"
                                            value="citizen"
                                            checked={formData.role === 'citizen'}
                                            onChange={handleChange}
                                            inline
                                        />
                                        <Form.Check
                                            type="radio"
                                            label="Admin"
                                            name="role"
                                            value="admin"
                                            checked={formData.role === 'admin'}
                                            onChange={handleChange}
                                            inline
                                        />
                                    </div>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-person-plus-fill me-2"></i>
                                            Create Account
                                        </>
                                    )}
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p className="mb-0">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary text-decoration-none">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
