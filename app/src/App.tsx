import { Route, Routes, useLocation } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { DiscoverPage } from './pages/DiscoverPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { StepDetailPage } from './pages/StepDetailPage';
import { LoginPage } from './pages/LoginPage';
import { UserProfilePage } from './pages/UserProfilePage';


function App() {
  const { pathname } = useLocation();

  if (pathname === '/login') {
    return (
      <div className="h-screen overflow-hidden bg-surface-0 font-sans text-[14px] text-ink">
        <LoginPage />
      </div>
    );
  }

  return (
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
  );
}

export default App;
