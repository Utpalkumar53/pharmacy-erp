import React, { useState } from 'react';
import api from '../api/axiosConfig';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });
      onLoginSuccess(res.data);
    } catch (err) {
      if (err.response?.status === 401) setError('Invalid Username or Password');
      else if (err.response?.status === 403) setError('Access Denied: Insufficient permissions');
      else setError('Connection Failed: Check if Backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-root {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #0f172a;
          padding: 16px;
        }
        .login-card {
          background: #1e293b;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
          width: 100%;
          max-width: 400px;
          border: 1px solid #334155;
        }
        .login-title {
          text-align: center;
          color: #60a5fa;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }
        .login-subtitle {
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 2rem;
        }
        .login-error {
          background-color: rgba(239,68,68,0.1);
          color: #f87171;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 13px;
          text-align: center;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .login-field {
          margin-bottom: 1.2rem;
        }
        .login-field label {
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          display: block;
          margin-bottom: 8px;
        }
        .login-field input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #334155;
          background-color: #0f172a;
          color: white;
          outline: none;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .login-field input:focus {
          border-color: #60a5fa;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.8rem;
          color: white;
        }
        .login-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        /* ── Mobile tweaks ── */
        @media (max-width: 480px) {
          .login-card {
            padding: 1.8rem 1.2rem;
            border-radius: 10px;
          }
          .login-title {
            font-size: 1.3rem;
          }
          .login-btn {
            padding: 13px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="login-root">
        <form onSubmit={handleSubmit} className="login-card">
          <h2 className="login-title">PHARMA-ERP</h2>
          <p className="login-subtitle">Login to your account</p>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Enter username"
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            />
          </div>

          <div className="login-field" style={{ marginBottom: '2rem' }}>
            <label>Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter password"
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="login-btn"
            style={{ background: isLoading ? '#334155' : '#2563eb', cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;