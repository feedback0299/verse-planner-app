import React, { useState, useEffect } from 'react';
import { Home, Calendar, Lock, Menu, X, BookOpen, Users, Globe, Building2, ChevronDown, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/dbService/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isPublisherLoggedIn, setIsPublisherLoggedIn] = useState(false);
  const [isBranchAdminLoggedIn, setIsBranchAdminLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    // Check initial session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const checkAuth = () => {
      setIsAdminLoggedIn(!!localStorage.getItem('admin_session'));
      setIsPublisherLoggedIn(!!localStorage.getItem('magazine_admin_session'));
      setIsBranchAdminLoggedIn(!!localStorage.getItem('branch_admin_session'));
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
      subscription.unsubscribe();
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handlePublicLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAdminLoggedIn(false);
    navigate('/');
  };

  const handlePublisherLogout = () => {
    localStorage.removeItem('magazine_admin_session');
    setIsPublisherLoggedIn(false);
    navigate('/');
  };

  const handleBranchAdminLogout = () => {
    localStorage.removeItem('branch_admin_session');
    setIsBranchAdminLoggedIn(false);
    navigate('/');
  };

  const navLinks = [
    { name: t('navigation.home'), path: '/', icon: Home, visible: true },
    { name: "Verse Planner", path: '/planner', icon: Calendar, visible: !!user },
    { name: t('navigation.magazine'), path: '/magazine', icon: BookOpen, visible: true },
    { name: t('navigation.calendar'), path: '/calendar', icon: Calendar, visible: true },
    { name: "World Map", path: '/map', icon: Globe, visible: true },
    { name: "Login", path: '/login', icon: Lock, visible: !user && !isAdminLoggedIn && !isPublisherLoggedIn && !isBranchAdminLoggedIn },
  ].filter(link => link.visible);

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || location.pathname !== '/' ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold flex items-center space-x-2">
            <span className={`transition-colors duration-300 ${isScrolled || location.pathname !== '/' ? 'text-spiritual-blue' : 'text-white'}`}>
              Athumanesar India
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button 
                  variant="ghost" 
                  className={`rounded-full px-3 py-1.5 h-auto text-xs lg:text-sm hover:bg-spiritual-gold/20 transition-all duration-200 ${
                    isScrolled || location.pathname !== '/' 
                      ? 'text-slate-600 hover:text-spiritual-blue' 
                      : 'text-white hover:text-white'
                  } ${location.pathname === link.path ? 'bg-spiritual-gold/20 font-bold text-spiritual-blue shadow-sm' : ''}`}
                >
                  <link.icon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  {link.name}
                </Button>
              </Link>
            ))}

            {/* Admin Portal Dropdown */}
            {(isAdminLoggedIn || isPublisherLoggedIn || isBranchAdminLoggedIn || (!user && !isAdminLoggedIn && !isPublisherLoggedIn && !isBranchAdminLoggedIn)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`rounded-full px-3 py-1.5 h-auto text-xs lg:text-sm hover:bg-spiritual-gold/20 transition-all duration-200 ${
                      isScrolled || location.pathname !== '/' 
                        ? 'text-slate-600 hover:text-spiritual-blue' 
                        : 'text-white hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                    Admin Portal
                    <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {!isAdminLoggedIn && !isPublisherLoggedIn && !isBranchAdminLoggedIn && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Lock className="w-4 h-4 mr-2" />
                          Church Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/magazine-admin" className="cursor-pointer">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Magazine Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/branches" className="cursor-pointer">
                          <Building2 className="w-4 h-4 mr-2" />
                          Branch Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/members" className="cursor-pointer">
                          <Users className="w-4 h-4 mr-2" />
                          Church Registry
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {(isAdminLoggedIn || isPublisherLoggedIn || isBranchAdminLoggedIn) && (
                    <>
                      {isAdminLoggedIn && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <Lock className="w-4 h-4 mr-2" />
                            Church Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isPublisherLoggedIn && (
                        <DropdownMenuItem asChild>
                          <Link to="/magazine-admin" className="cursor-pointer">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Magazine Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isBranchAdminLoggedIn && (
                        <DropdownMenuItem asChild>
                          <Link to="/branches" className="cursor-pointer">
                            <Building2 className="w-4 h-4 mr-2" />
                            Branch Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/members" className="cursor-pointer">
                          <Users className="w-4 h-4 mr-2" />
                          Church Registry
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isAdminLoggedIn && (
                        <DropdownMenuItem onClick={handleAdminLogout} className="cursor-pointer text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          Admin Logout
                        </DropdownMenuItem>
                      )}
                      {isPublisherLoggedIn && (
                        <DropdownMenuItem onClick={handlePublisherLogout} className="cursor-pointer text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          Publisher Logout
                        </DropdownMenuItem>
                      )}
                      {isBranchAdminLoggedIn && (
                        <DropdownMenuItem onClick={handleBranchAdminLogout} className="cursor-pointer text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          Branch Logout
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Public User Logout */}
            {user && (
              <Button 
                variant="ghost" 
                className={`rounded-full px-3 py-1.5 h-auto text-xs lg:text-sm ${isScrolled || location.pathname !== '/' ? 'text-red-500 hover:text-red-600' : 'text-red-300 hover:text-white'} hover:bg-red-50/10 transition-all duration-200`}
                onClick={handlePublicLogout}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            )}
            
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value as any)}
              className={`ml-2 bg-transparent border text-xs rounded-full px-3 py-1.5 focus:outline-none cursor-pointer transition-all duration-200 ${
                 isScrolled || location.pathname !== '/' 
                 ? 'border-slate-200 text-slate-600 hover:border-spiritual-blue/30 bg-white/50' 
                 : 'border-white/30 text-white option:text-black hover:bg-white/10'
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
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden animate-fade-in overflow-y-auto">
          <div className="flex flex-col space-y-4 pb-8">
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

            {/* Admin Portal Section */}
            {(isAdminLoggedIn || isPublisherLoggedIn || isBranchAdminLoggedIn || (!user && !isAdminLoggedIn && !isPublisherLoggedIn && !isBranchAdminLoggedIn)) && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-3">Admin Portal</p>
                
                {!isAdminLoggedIn && !isPublisherLoggedIn && !isBranchAdminLoggedIn && (
                  <>
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                        <div className="bg-red-50 p-2 rounded-full">
                          <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800">Church Admin</span>
                      </div>
                    </Link>
                    <Link to="/magazine-admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                        <div className="bg-orange-50 p-2 rounded-full">
                          <BookOpen className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800">Magazine Admin</span>
                      </div>
                    </Link>
                    <Link to="/branches" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                        <div className="bg-green-50 p-2 rounded-full">
                          <Building2 className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800">Branch Admin</span>
                      </div>
                    </Link>
                    <div className="border-t my-2"></div>
                    <Link to="/members" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                        <div className="bg-blue-50 p-2 rounded-full">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800">Church Registry</span>
                      </div>
                    </Link>
                  </>
                )}

                {(isAdminLoggedIn || isPublisherLoggedIn || isBranchAdminLoggedIn) && (
                  <>
                    {isAdminLoggedIn && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                          <div className="bg-red-50 p-2 rounded-full">
                            <Lock className="w-6 h-6 text-red-600" />
                          </div>
                          <span className="text-lg font-medium text-gray-800">Church Admin Dashboard</span>
                        </div>
                      </Link>
                    )}
                    {isPublisherLoggedIn && (
                      <Link to="/magazine-admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                          <div className="bg-orange-50 p-2 rounded-full">
                            <BookOpen className="w-6 h-6 text-orange-600" />
                          </div>
                          <span className="text-lg font-medium text-gray-800">Magazine Dashboard</span>
                        </div>
                      </Link>
                    )}
                    {isBranchAdminLoggedIn && (
                      <Link to="/branches" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                          <div className="bg-green-50 p-2 rounded-full">
                            <Building2 className="w-6 h-6 text-green-600" />
                          </div>
                          <span className="text-lg font-medium text-gray-800">Branch Dashboard</span>
                        </div>
                      </Link>
                    )}
                    <div className="border-t my-2"></div>
                    <Link to="/members" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-100">
                        <div className="bg-blue-50 p-2 rounded-full">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800">Church Registry</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Logout Buttons */}
            {(user || isAdminLoggedIn || isPublisherLoggedIn || isBranchAdminLoggedIn) && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-3">Logout</p>
                
                {user && (
                  <button onClick={() => { handlePublicLogout(); setIsMobileMenuOpen(false); }} className="w-full">
                    <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50">
                      <div className="bg-red-100 p-2 rounded-full">
                        <LogOut className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-lg font-medium text-red-600">Sign Out</span>
                    </div>
                  </button>
                )}
                
                {isAdminLoggedIn && (
                  <button onClick={() => { handleAdminLogout(); setIsMobileMenuOpen(false); }} className="w-full">
                    <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50">
                      <div className="bg-red-100 p-2 rounded-full">
                        <LogOut className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-lg font-medium text-red-600">Admin Logout</span>
                    </div>
                  </button>
                )}
                
                {isPublisherLoggedIn && (
                  <button onClick={() => { handlePublisherLogout(); setIsMobileMenuOpen(false); }} className="w-full">
                    <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50">
                      <div className="bg-red-100 p-2 rounded-full">
                        <LogOut className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-lg font-medium text-red-600">Publisher Logout</span>
                    </div>
                  </button>
                )}
                
                {isBranchAdminLoggedIn && (
                  <button onClick={() => { handleBranchAdminLogout(); setIsMobileMenuOpen(false); }} className="w-full">
                    <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50">
                      <div className="bg-red-100 p-2 rounded-full">
                        <LogOut className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-lg font-medium text-red-600">Branch Logout</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
