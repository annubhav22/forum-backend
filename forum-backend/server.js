import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';
export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/register', 'POST', { username, password });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} required onChange={(e)=>setUsername(e.target.value)} style={{width: '100%', marginBottom: 10, padding: 8}}/>
        <input type="password" placeholder="Password" value={password} required onChange={(e)=>setPassword(e.target.value)} style={{width: '100%', marginBottom: 10, padding: 8}}/>
        <button type="submit" style={{ width: '100%', padding: 8, backgroundColor: '#0078D4', color: 'white', border: 'none', borderRadius: 4 }}>Register</button>
      </form>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
