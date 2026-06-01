import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiList, FiPlusCircle, FiUsers, FiLogOut, FiDollarSign,
} from 'react-icons/fi';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💰</div>
          <h2>ExpenseTrack</h2>
          <p>Company Expense Manager</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiGrid className="nav-icon" /> Dashboard
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiList className="nav-icon" /> All Expenses
          </NavLink>
          <NavLink to="/expenses/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiPlusCircle className="nav-icon" /> Add Expense
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-title">Admin</div>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiUsers className="nav-icon" /> Manage Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
