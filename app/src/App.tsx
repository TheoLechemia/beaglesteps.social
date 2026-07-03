import { Route, Routes } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DiscoverPage } from './pages/DiscoverPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';


function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex h-screen justify-center overflow-hidden bg-surface-0 font-sans text-[14px] text-ink">
      <div className="flex h-full w-full max-w-400 overflow-hidden">
        <div className="flex min-w-0 flex-1 overflow-hidden">
        {isAuthenticated && <SideNav />}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DiscoverPage />} />
              <Route path="/trips/:id" element={<TripDetailPage />} />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
