import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h1 className="sidebar-title">Nutrition Office Encoder</h1>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/" 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/barangay-summary" 
            className={`nav-item ${isActive('/barangay-summary') ? 'active' : ''}`}
          >
            Barangay Summary
          </Link>
          <Link 
            to="/export-data" 
            className={`nav-item ${isActive('/export-data') ? 'active' : ''}`}
          >
            Export Data
          </Link>
          <Link 
            to="/import-data" 
            className={`nav-item ${isActive('/import-data') ? 'active' : ''}`}
          >
            Import Data
          </Link>
          <Link 
            to="/encode-record" 
            className={`nav-item ${isActive('/encode-record') ? 'active' : ''}`}
          >
            Encode Record
          </Link>
        </nav>

        <footer className="sidebar-footer">
          City-wide barangay data ©Cabuyao Nutrition Office
        </footer>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
