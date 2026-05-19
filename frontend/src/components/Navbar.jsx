import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--accent)' }}>
            CC
          </div>
          <span className="font-display font-semibold text-lg hidden sm:block"
            style={{ color: 'var(--text-primary)' }}>
            Concept<span style={{ color: 'var(--accent)' }}>Clarity</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" active={pathname === '/'}>Explain</NavLink>
          <NavLink to="/history" active={pathname === '/history'}>History</NavLink>
        </nav>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{ background: 'var(--tag-bg)', color: 'var(--text-secondary)' }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      {children}
    </Link>
  );
}
