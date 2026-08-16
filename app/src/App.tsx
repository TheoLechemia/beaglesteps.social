import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, Link } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { DiscoverPage } from './pages/DiscoverPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { StepDetailPage } from './pages/StepDetailPage';
import { LoginPage } from './pages/LoginPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AddStepModal } from './components/AddStepModal';
import { AddTripModal } from './components/AddTripModal ';
import { IconHome, IconLogout, IconMap, IconMapPin, IconPlus, IconSearch, IconUser } from '@tabler/icons-react';
import { useAuth } from './context/AuthContext';




function App() {
  const { pathname } = useLocation();
  const { profile, isAuthenticated, logout } = useAuth()
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAddMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  if (pathname === '/login') {
    return (
      <div className="h-screen overflow-hidden bg-surface-0 font-sans text-[14px] text-ink">
        <LoginPage />
      </div>
    );
  }

  return (
    <div>

      <div className="flex h-screen justify-center overflow-hidden bg-surface-0 font-sans text-[14px] text-ink">
        <div className="flex h-full w-full max-w-6xl overflow-hidden">
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <SideNav />
            <div className="flex min-w-0 flex-1 overflow-hidden border-r-[0.5px] border-line">
              <Routes>
                <Route path="/" element={<DiscoverPage />} />
                <Route path="/profile/:handle/trip/:rkey" element={<TripDetailPage />} />
                <Route path="/profile/:handle/step/:rkey" element={<StepDetailPage />} />
                <Route path="/profile/:handle" element={<UserProfilePage />} />
              </Routes>
            </div>
            {/* Reserved for a map, shown on large screens only */}
            <div className="hidden w-60 shrink-0 lg:block" aria-hidden />
          </div>
        </div>

      </div>
            <nav className='fixed inset-x-0 bottom-4 z-50 flex justify-center md:hidden'>
              <div className='flex items-center gap-1 rounded-full bg-gray-200/65 px-2 py-2 backdrop-blur-2xl'>
                <Link
                  to="/"
                  className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
                    pathname === '/' ? 'bg-ink/10 text-ink' : 'text-ink'
                  }`}
                >
                  <IconHome size={22} stroke={2.2} />
                </Link>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-2.5 text-ink transition-colors hover:text-ink"
                >
                  <IconSearch size={22} stroke={2.2} />
                </button>
                {isAuthenticated && (
                  <div className="relative" ref={userMenuRef}>
                    {isUserMenuOpen && (
                      <div className="absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 overflow-hidden rounded-2xl bg-gray-200/65 backdrop-blur-2xl">
                        <div className="truncate px-4 py-3 text-[14px] font-bold text-ink">@{profile?.handle}</div>
                        <div className="h-px bg-black/10" />
                        <Link
                          to={`/profile/${profile?.handle}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-ink hover:bg-ink/5"
                        >
                          <IconUser size={18} />
                          Go to profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-ink hover:bg-ink/5"
                        >
                          <IconLogout size={18} />
                          Logout
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                      className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
                        pathname.startsWith(`/profile/${profile?.handle}`) ? 'bg-ink/10 text-ink' : 'text-ink'
                      }`}
                    >
                      <IconUser size={22} stroke={2.2} />
                    </button>
                  </div>
                )}
                {isAuthenticated && (
                  <div className="relative" ref={addMenuRef}>
                    {isAddMenuOpen && (
                      <div className="absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 overflow-hidden rounded-2xl bg-gray-200/65 backdrop-blur-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setIsAddTripOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-ink hover:bg-ink/5"
                        >
                          <IconMap size={18} />
                          Create a trip
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setIsAddStepOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-ink hover:bg-ink/5"
                        >
                          <IconMapPin size={18} />
                          Add a step
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAddMenuOpen((open) => !open)}
                      className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
                        isAddMenuOpen ? 'bg-ink/10 text-ink' : 'text-ink'
                      }`}
                    >
                      <IconPlus size={22} stroke={2.2} />
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {isAddStepOpen && <AddStepModal onClose={() => setIsAddStepOpen(false)} />}
            {isAddTripOpen && <AddTripModal onClose={() => setIsAddTripOpen(false)} />}
    </div>
  );
}

export default App;
