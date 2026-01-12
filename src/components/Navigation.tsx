import React, { useState, useEffect } from 'react';
import { Home, Calendar, Lock, Menu, X, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isPublisherLoggedIn, setIsPublisherLoggedIn] = useState(false);

  const languages = [
    { code: 'ta', label: '🇮🇳 TAMIL தமிழ்' },
    { code: 'hi', label: '🇮🇳 HINDI हिंदी' },
    { code: 'te', label: '🇮🇳 TELUGU తెలుగు' },
    { code: 'ka', label: '🇮🇳 KANNADA ಕನ್ನಡ' },
    { code: 'ml', label: '🇮🇳 MALAYALAM മലയാളം' },
    { code: 'pu', label: '🇮🇳 PUNJABI ਪੰਜਾਬੀ' },
    { code: 'en', label: '🇬🇧 English' },
  ];

  useEffect(() => {
    const checkAuth = () => {
      setIsAdminLoggedIn(!!localStorage.getItem('admin_session'));
      setIsPublisherLoggedIn(!!localStorage.getItem('magazine_admin_session'));
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    window.addEventListener('storage', checkAuth);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: t('navigation.home'), path: '/', icon: Home, visible: true },
    { name: t('navigation.magazine'), path: '/magazine', icon: BookOpen, visible: true },
    { name: t('navigation.calendar'), path: '/calendar', icon: Calendar, visible: true },
    { name: t('navigation.publisher'), path: '/magazine-admin', icon: Lock, visible: isPublisherLoggedIn },
    { name: "Church Registry", path: '/members', icon: Users, visible: true },
    { name: t('navigation.admin'), path: '/admin', icon: Lock, visible: isAdminLoggedIn },
  ].filter(link => link.visible);

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold flex items-center space-x-2">
            <span className={`transition-colors duration-300 ${isScrolled || location.pathname !== '/' ? 'text-spiritual-blue' : 'text-white'}`}>
              Athumanesar India
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button 
                  variant="ghost" 
                  className={`rounded-full px-4 hover:bg-spiritual-gold/20 ${
                    isScrolled || location.pathname !== '/' 
                      ? 'text-gray-700 hover:text-spiritual-blue' 
                      : 'text-white hover:text-white'
                  } ${location.pathname === link.path ? 'bg-spiritual-gold/20 font-semibold' : ''}`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Button>
              </Link>
            ))}
            
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value as any)}
              className={`ml-2 bg-transparent border text-sm rounded-full px-2 py-1 focus:outline-none cursor-pointer ${
                 isScrolled || location.pathname !== '/' 
                 ? 'border-gray-300 text-gray-700' 
                 : 'border-white/30 text-white option:text-black'
              }`}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value as any)}
              className={`bg-transparent border text-xs rounded-full px-1 py-1 focus:outline-none cursor-pointer w-[140px] ${
                 isScrolled || location.pathname !== '/' 
                 ? 'border-gray-300 text-gray-700' 
                 : 'border-white/30 text-white'
              }`}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.label}
                </option>
              ))}
            </select>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={isScrolled || location.pathname !== '/' ? 'text-gray-800' : 'text-white'}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden animate-fade-in">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                  <div className="bg-spiritual-blue/10 p-2 rounded-full">
                    <link.icon className="w-6 h-6 text-spiritual-blue" />
                  </div>
                  <span className="text-lg font-medium text-gray-800">{link.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
