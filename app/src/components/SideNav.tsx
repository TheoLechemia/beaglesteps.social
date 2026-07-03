import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconSearch, IconUser } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';


export function SideNav() {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth()

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r-[0.5px] border-line p-4">
      <div className="relative mb-4" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-voice text-[13px] font-medium text-primary"
        >
          BS
        </button>
        {isMenuOpen && (
          <div className="absolute left-0 top-11 z-10 w-44 overflow-hidden rounded-md border-[0.5px] border-line bg-surface-0 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-[14px] text-ink hover:bg-surface-1"
            >
              My profil
            </button>
            <button
              type="button"
              onClick={logout}
              className="block w-full px-3 py-2 text-left text-[14px] text-ink hover:bg-surface-1"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      <Link
        to="/"
        className={`flex items-center gap-3 rounded-full px-3 py-2 text-[17px] hover:bg-surface-1 ${
          pathname === '/' ? 'font-medium text-ink' : 'text-ink-secondary'
        }`}
      >
        <IconHome size={40} />
        Accueil
      </Link>

      <button
        type="button"
        className="flex items-center gap-3 rounded-full px-3 py-2 text-left text-[17px] text-ink-secondary hover:bg-surface-1"
      >
        <IconSearch size={40} />
        Rechercher
      </button>

      <button
        type="button"
        className="flex items-center gap-3 rounded-full px-3 py-2 text-left text-[17px] text-ink-secondary hover:bg-surface-1"
      >
        <IconUser size={40} />
        Profil
      </button>
    </nav>
  );
}
