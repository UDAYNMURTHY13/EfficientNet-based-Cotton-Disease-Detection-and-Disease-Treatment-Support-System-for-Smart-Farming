import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/login.css';

const LoginPage = () => {
  const [role, setRole] = useState(null);
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get role from session storage on mount, redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const selectedRole = sessionStorage.getItem('selectedRole');
    if (!selectedRole) {
      navigate('/');
      return;
    }
    setRole(selectedRole);
    
    // Set email based on role
    const emails = {
      farmer: 'farmer@cottondisease.com',
      expert: 'expert@cottondisease.com',
      admin: 'admin@cottondisease.com',
    };
    setEmail(emails[selectedRole] || '');
  }, [navigate, isAuthenticated]);

  // ============= EMAIL LOGIN =============
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo credentials for each role
      const demoCredentials = {
        farmer: { email: 'farmer@cottondisease.com', password: 'password' },
        expert: { email: 'expert@cottondisease.com', password: 'password' },
        admin: { email: 'admin@cottondisease.com', password: 'password' },
      };

      const demo = demoCredentials[role];
      if (email === demo.email && password === demo.password) {
        const result = await login(email, password, role);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || 'Invalid credentials');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============= PHONE + OTP =============
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      // Simulate OTP send
      console.log(`OTP sent to +91${cleanPhone}`);
      setShowOtpInput(true);
      setError('');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      // Simulate OTP verification
      if (otp === '123456') {
        const cleanPhone = phone.replace(/\D/g, '');
        const result = await login(`+91${cleanPhone}`, otp, role, 'phone');
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError('Verification failed. Please try again.');
        }
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============= GOOGLE OAUTH =============
  const handleGoogleLogin = () => {
    setError('');
    setLoading(true);
    try {
      // Simulate Google login
      console.log('Google login initiated for role:', role);
      setTimeout(() => {
        const result = login('user@google.com', 'google_token', role, 'google');
        if (result && result.success) {
          navigate('/dashboard');
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  // ============= UI HELPERS =============
  const getRoleBadge = () => {
    const badges = {
      farmer: { icon: '👨‍🌾', label: 'Farmer', color: '#4CAF50' },
      expert: { icon: '👨‍⚕️', label: 'Expert', color: '#2196F3' },
      admin: { icon: '👨‍💼', label: 'Administrator', color: '#FF9800' },
    };
    return badges[role] || {};
  };

  const getDemoCredentials = () => {
    const creds = {
      farmer: { email: 'farmer@cottondisease.com', password: 'password' },
      expert: { email: 'expert@cottondisease.com', password: 'password' },
      admin: { email: 'admin@cottondisease.com', password: 'password' },
    };
    return creds[role];
  };

  const badge = getRoleBadge();
  const demo = getDemoCredentials();

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Role Badge */}
        <div className="role-badge" style={{ backgroundColor: badge.color }}>
          <span className="role-badge-icon">{badge.icon}</span>
          <span className="role-badge-label">{badge.label} Login</span>
        </div>

        <div className="login-logo">
          <h1>🌾 CottonCare AI</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {/* Login Method Tabs */}
        <div className="login-tabs">
          <button
            className={`tab-button ${loginMethod === 'email' ? 'active' : ''}`}
            onClick={() => {
              setLoginMethod('email');
              setShowOtpInput(false);
              setError('');
            }}
          >
            📧 Email
          </button>
          <button
            className={`tab-button ${loginMethod === 'phone' ? 'active' : ''}`}
            onClick={() => {
              setLoginMethod('phone');
              setShowOtpInput(false);
              setError('');
            }}
          >
            📱 Phone
          </button>
          <button
            className={`tab-button ${loginMethod === 'google' ? 'active' : ''}`}
            onClick={() => {
              setLoginMethod('google');
              setShowOtpInput(false);
              setError('');
            }}
          >
            🔵 Google
          </button>
        </div>

        {/* ===== EMAIL LOGIN FORM ===== */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="demo-credentials">
              <p><strong>Demo Credentials:</strong></p>
              <p>Email: {demo?.email}</p>
              <p>Password: {demo?.password}</p>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '⏳ Signing in...' : '✓ Sign In'}
            </button>
          </form>
        )}

        {/* ===== PHONE + OTP LOGIN FORM ===== */}
        {loginMethod === 'phone' && (
          <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp}>
            {!showOtpInput ? (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="phone-input-group">
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit number"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>

                <div className="demo-credentials">
                  <p><strong>Demo Phone:</strong></p>
                  <p>9876543210</p>
                  <p>We'll send an OTP to verify your identity</p>
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? '⏳ Sending OTP...' : '📤 Send OTP'}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    required
                  />
                  <p className="otp-hint">OTP sent to +91 {phone}</p>
                </div>

                <div className="demo-credentials">
                  <p><strong>Demo OTP:</strong></p>
                  <p>123456</p>
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? '⏳ Verifying...' : '✓ Verify & Login'}
                </button>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setPhone('');
                    setOtp('');
                  }}
                >
                  ← Back
                </button>
              </>
            )}
          </form>
        )}

        {/* ===== GOOGLE LOGIN ===== */}
        {loginMethod === 'google' && (
          <div className="google-login-container">
            <p className="google-login-text">
              Sign in with your Google account to continue
            </p>

            <button
              type="button"
              className="google-login-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="google-icon">🔵</span>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="demo-credentials">
              <p><strong>Demo Google:</strong></p>
              <p>Use any Google account</p>
              <p>First-time users will be registered automatically</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <button
            type="button"
            className="change-role-button"
            onClick={() => {
              sessionStorage.removeItem('selectedRole');
              navigate('/');
            }}
          >
            Change Role
          </button>
          <p>Don't have an account? <strong>Contact your administrator</strong></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
