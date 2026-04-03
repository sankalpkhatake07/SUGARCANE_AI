import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { SignIn, User, Lock } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{
      backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/26816054-55c0-4c2e-8815-3fcc93057a4f/images/0e70b52a55c7418044b640e18aec8a044be14a540f264246400fe573ee75bd1f.png)'
    }}>
      <div className="absolute inset-0 bg-black/40"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SC</span>
            </div>
            <h1 className="text-3xl font-bold text-[#1A201C]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {t('login')}
            </h1>
            <p className="text-[#5C6B61] mt-2">SugarCane Disease Analysis</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#1A201C] mb-2">
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9D77]" size={20} />
                <input
                  id="username"
                  type="text"
                  data-testid="login-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#DDE3DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A201C] mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9D77]" size={20} />
                <input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#DDE3DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div data-testid="login-error" className="bg-[#FDF0EF] border border-[#D9534F] text-[#D9534F] px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-[#2D5A27] hover:bg-[#24481F] text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>{t('loading')}</span>
              ) : (
                <>
                  <SignIn size={20} />
                  <span>{t('loginButton')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#5C6B61] text-sm">
              {t('dontHaveAccount')}{' '}
              <Link to="/register" className="text-[#2D5A27] hover:underline font-medium">
                {t('registerButton')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
