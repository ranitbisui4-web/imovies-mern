import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary px-4 py-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-danger fs-4" to="/">
          🎬 IMovies
        </Link>
        <div className="d-flex align-items-center gap-3">
          <Link className="nav-link text-light" to="/">
            Movies
          </Link>
          {user ? (
            <>
              <Link className="nav-link text-light" to="/bookings">
                My Bookings
              </Link>
              {user.role === 'admin' && (
                <Link className="btn btn-warning btn-sm fw-semibold" to="/admin">
                  Admin Panel
                </Link>
              )}
              <span className="badge bg-secondary">{user.name} ({user.role})</span>
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-light btn-sm" to="/login">
                Login
              </Link>
              <Link className="btn btn-danger btn-sm" to="/register">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
