import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h1 className="sidebar-title">Nutrition Office Encoder</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} aria-current={isActive('/') ? 'page' : undefined}>
            Dashboard
          </Link>
          <Link to="/household-records" className={`nav-item ${isActive('/household-records') ? 'active' : ''}`} aria-current={isActive('/household-records') ? 'page' : undefined}>
            Household Records
          </Link>
          <Link to="/barangay-summary" className={`nav-item ${isActive('/barangay-summary') ? 'active' : ''}`} aria-current={isActive('/barangay-summary') ? 'page' : undefined}>
            Barangay Summary
          </Link>
          <Link to="/export-data" className={`nav-item ${isActive('/export-data') ? 'active' : ''}`} aria-current={isActive('/export-data') ? 'page' : undefined}>
            Export Data
          </Link>
          <Link to="/import-data" className={`nav-item ${isActive('/import-data') ? 'active' : ''}`} aria-current={isActive('/import-data') ? 'page' : undefined}>
            Import Data
          </Link>
          <Link to="/encode-record" className={`nav-item ${isActive('/encode-record') ? 'active' : ''}`} aria-current={isActive('/encode-record') ? 'page' : undefined}>
            Encode Record
          </Link>
        </nav>

        <div className="sidebar-user">
          {user && <span className="sidebar-user-name">{user.name}</span>}
          <button type="button" className="sidebar-logout" onClick={handleLogout}>Log out</button>
        </div>
        <footer className="sidebar-footer">
          ©Cabuyao Nutrition Office
        </footer>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
