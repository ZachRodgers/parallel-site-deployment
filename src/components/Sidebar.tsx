import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useScrollToSection } from '../hooks/useScrollToSection';
import './Sidebar.css';

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSection, scrollToSection } = useScrollToSection();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const links = [
    { path: '/', label: 'Home', section: 'home' },
    { path: '/#mobile-app', label: 'App', section: 'mobile-app' },
    { path: '/#operator-portal', label: 'Operator', section: 'operator-portal' },
    { path: '/legal', label: 'Legal', section: null },
    { path: '/contact', label: 'Contact', section: null },
    { path: '/careers', label: 'Careers', section: null }
  ];

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLinkClick = (e: React.MouseEvent, link: typeof links[0]) => {
    if (link.section) {
      if (location.pathname === '/') {
        // Already on home page, just scroll to section
        e.preventDefault();
        scrollToSection(link.section);
      } else {
        // On different page, navigate to home and then scroll
        e.preventDefault();
        navigate('/');
        // Store the section to scroll to after navigation
        sessionStorage.setItem('scrollToSection', link.section);
      }
    }

    // Close sidebar on mobile after clicking a link
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const isActive = (link: typeof links[0]) => {
    if (link.section && location.pathname === '/') {
      return activeSection === link.section;
    }
    if (link.path === '/legal') {
      return location.pathname.startsWith('/legal');
    }
    return location.pathname === link.path;
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />
      )}

      {/* Fixed header that always stays visible */}
      <div className="sidebar-fixed-header">
        <img src="/assets/Logo_Parallel.svg" alt="Parallel Logo" className="sidebar-logo" />
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <img
            src={isCollapsed ? "/assets/SidebarOpened.svg" : "/assets/SidebarClosed.svg"}
            alt={isCollapsed ? "Expand" : "Collapse"}
            className="sidebar-toggle-icon"
          />
        </button>
      </div>

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <nav className="sidebar-nav">
          {location.pathname.startsWith('/legal') ? (
            // Show submenu when on legal pages
            <>
              <Link
                to="/"
                className="sidebar-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                ← Back
              </Link>
              <Link
                to="/legal/app/terms-of-service"
                className="sidebar-link"
                onClick={(e) => {
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                App Terms
              </Link>
              <Link
                to="/legal/app/privacy-policy"
                className="sidebar-link"
                onClick={(e) => {
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                App Privacy
              </Link>
              <Link
                to="/legal/operator/terms-of-service"
                className="sidebar-link"
                onClick={() => {
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                Operator Terms
              </Link>
              <Link
                to="/legal/operator/privacy-policy"
                className="sidebar-link"
                onClick={() => {
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                Operator Privacy
              </Link>
            </>
          ) : (
            // Show normal links when not on legal pages
            links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleLinkClick(e, link)}
                className={`sidebar-link ${isActive(link) ? 'active' : ''} ${link.path === '/legal' ? 'legal-nav-item' : ''}`}
              >
                {link.label}
                {link.path === '/legal' && <span className="legal-hover-arrow">→</span>}
              </Link>
            ))
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
