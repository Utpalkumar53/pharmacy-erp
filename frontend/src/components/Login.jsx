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
      // ← was: btoa + /auth/verify with Basic header
      // Now: POST credentials, get JWT back
      const res = await api.post('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });

      // res.data = { token, username, roles: ["ADMIN"] }
      onLoginSuccess(res.data);

    } catch (err) {
      if (err.response?.status === 401) setError('Invalid Username or Password');
      else if (err.response?.status === 403) setError('Access Denied: Insufficient permissions');
      else setError('Connection Failed: Check if Backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // keep your existing JSX exactly as is — only handleSubmit changed
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', width: '380px', border: '1px solid #334155' }}>
        <h2 style={{ textAlign: 'center', color: '#60a5fa', marginBottom: '0.5rem' }}>PHARMA-ERP</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' }}>Login</p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '12px', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Username</label>
          <input type="text" required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Password</label>
          <input type="password" required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
        </div>

        <button type="submit" disabled={isLoading}
          style={{ width: '100%', padding: '14px', background: isLoading ? '#334155' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default Login;