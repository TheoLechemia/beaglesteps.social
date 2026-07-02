import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DiscoverPage } from './pages/DiscoverPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { LoginPage } from './pages/LoginPage';


function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-0 font-sans text-[14px] text-ink">
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
