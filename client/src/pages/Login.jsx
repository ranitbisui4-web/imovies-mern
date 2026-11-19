import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { setCredentials } from '../store/authSlice';

const Login = () => {
  const [email, setEmail] = useState('admin@imovies.com');
  const [password, setPassword] = useState('password123');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '420px' }}>
      <div className="card bg-black text-light border-secondary p-4">
        <h3 className="fw-bold mb-3">Sign In to IMovies</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control bg-dark text-light border-secondary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control bg-dark text-light border-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-danger w-100 fw-bold">
            Login
          </button>
        </form>
        <p className="small text-secondary mt-3 mb-0">
          New to IMovies? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
