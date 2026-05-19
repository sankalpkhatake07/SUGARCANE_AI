import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { House, ClockCounterClockwise, BookOpen, UserGear, SignOut, Translate } from '@phosphor-icons/react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLangMenu, setShowLangMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#DDE3DA] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2D5A27] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">SC</span>
              </div>
              <span className="text-xl font-bold text-[#1A201C]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                SugarCane AI
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                data-testid="nav-dashboard"
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-[#E8ECE5] text-[#2D5A27]'
                    : 'text-[#5C6B61] hover:bg-[#F9F8F6]'
                }`}
              >
                <House size={20} weight={isActive('/dashboard') ? 'fill' : 'regular'} />
                <span>{t('dashboard')}</span>
              </Link>
              <Link
                to="/history"
                data-testid="nav-history"
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  isActive('/history')
                    ? 'bg-[#E8ECE5] text-[#2D5A27]'
                    : 'text-[#5C6B61] hover:bg-[#F9F8F6]'
                }`}
              >
                <ClockCounterClockwise size={20} weight={isActive('/history') ? 'fill' : 'regular'} />
                <span>{t('history')}</span>
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/diseases"
                  data-testid="nav-diseases"
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    isActive('/diseases')
                      ? 'bg-[#E8ECE5] text-[#2D5A27]'
                      : 'text-[#5C6B61] hover:bg-[#F9F8F6]'
                  }`}
                >
                  <BookOpen size={20} weight={isActive('/diseases') ? 'fill' : 'regular'} />
                  <span>{t('diseases')}</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  data-testid="nav-admin"
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    isActive('/admin')
                      ? 'bg-[#E8ECE5] text-[#2D5A27]'
                      : 'text-[#5C6B61] hover:bg-[#F9F8F6]'
                  }`}
                >
                  <UserGear size={20} weight={isActive('/admin') ? 'fill' : 'regular'} />
                  <span>{t('admin')}</span>
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  data-testid="language-toggle"
                  className="p-2 rounded-lg text-[#5C6B61] hover:bg-[#F9F8F6] transition-colors flex items-center space-x-2"
                >
                  <Translate size={20} />
                  <span className="text-sm font-medium uppercase">{currentLanguage}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-[#DDE3DA] py-1">
                    <button
                      onClick={() => { changeLanguage('en'); setShowLangMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#F9F8F6] transition-colors"
                    >
                      English
                    </button>
                    <button
                      onClick={() => { changeLanguage('hi'); setShowLangMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#F9F8F6] transition-colors"
                    >
                      हिन्दी
                    </button>
                    <button
                      onClick={() => { changeLanguage('mr'); setShowLangMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#F9F8F6] transition-colors"
                    >
                      मराठी
                    </button>
                  </div>
                )}
              </div>

              {/* User Info & Logout */}
              <div className="flex items-center space-x-3 border-l border-[#DDE3DA] pl-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[#1A201C]">{user?.name || user?.username}</p>
                  <p className="text-xs text-[#5C6B61]">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="p-2 rounded-lg text-[#D9534F] hover:bg-[#FDF0EF] transition-colors"
                  title={t('logout')}
                >
                  <SignOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
