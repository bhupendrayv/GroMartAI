import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { GrocerioLogo, GoogleIcon, AppleIcon, MicrosoftIcon } from './Assets';

const API_URL = 'http://localhost:5000/api';

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const normalizedEmail = email.toLowerCase();
    const payload = isLogin ? { email: normalizedEmail, password } : { username, email: normalizedEmail, password, groupName };

    try {
      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      onLogin(data);
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Cannot connect to the server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="auth-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GrocerioLogo />
      </div>

      <h1 className="vibrant-heading">{isLogin ? 'Welcome back!' : 'Join Grocerio'}</h1>
      <p className="subtext">
        {isLogin 
          ? 'Please sign in to manage your grocery inventory' 
          : 'Create an account to start collaborating with your family'}
      </p>

      {error && <div style={{ color: '#ff4d4d', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="input-group">
              <label className="input-label">Username</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Your Name" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Access Group Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Family or Group Name" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </>
        )}

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              className="glass-input" 
              placeholder="email@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label className="input-label">Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="glass-input" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
        </div>

        {isLogin && (
          <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer' }}>Forgot Password?</span>
          </div>
        )}

        <button type="submit" className="grocerio-btn">
          <LogIn size={22} />
          {isLogin ? 'Sign In' : 'Get Started'}
        </button>
      </form>

      <div className="divider">
        <span>or continue with</span>
      </div>

      <div className="social-cluster">
        <div className="social-box"><GoogleIcon /></div>
        <div className="social-box"><AppleIcon /></div>
        <div className="social-box"><MicrosoftIcon /></div>
      </div>

      <p style={{ marginTop: '3rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <span 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ color: '#8a2be2', cursor: 'pointer', fontWeight: '600' }}
        >
          {isLogin ? 'Create one' : 'Sign in instead'}
        </span>
      </p>
    </div>
  );
};

export default AuthForm;
