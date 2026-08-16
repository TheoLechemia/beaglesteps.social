import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconChevronDown,
  IconHome,
  IconMap,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { AddStepModal } from './AddStepModal';
import { AddTripModal } from './AddTripModal ';


export function SideNav() {
  const { pathname } = useLocation();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const { logout, profile, isAuthenticated } = useAuth()


  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

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

  if (!isAuthenticated) {
    return (
      <nav className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r border-line bg-surface-0 p-4">
        <div className="mb-6 px-1 font-voice text-[20px] leading-tight">
          BeagleSteps<span className="text-primary">.social</span>
        </div>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-[15px] font-semibold text-surface-0 hover:bg-primary-700"
        >
          Log in
        </Link>
        <Link
          to="/login"
          className="mt-2 flex items-center justify-center gap-2 rounded-full border border-line py-2.5 text-[15px] font-semibold text-ink hover:bg-ink hover:text-surface-0"
        >
          Create account
        </Link>
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface-0 p-4">
      <div className="mb-6 px-1 font-voice text-[20px] leading-tight">
        BeagleSteps<span className="text-primary">.social</span>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          to="/"
          className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-[16px] transition-colors ${
            pathname === '/' ? 'bg-ink/5 font-semibold text-ink' : 'text-ink-secondary hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <IconHome size={24} />
          Home
        </Link>

        <button
          type="button"
          className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[16px] text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <IconSearch size={24} />
          Search
        </button>

        <Link
          to={`/profile/${profile?.handle}`}
          className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-[16px] transition-colors ${
            pathname.startsWith(`/profile/${profile?.handle}`) ? 'bg-ink/5 font-semibold text-ink' : 'text-ink-secondary hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <IconUser size={24} />
          Profile
        </Link>
      </div>

      <div className="relative mt-4" ref={addMenuRef}>
        {isAddMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-line bg-surface-0 shadow-lg shadow-black/10">
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-[15px] font-semibold text-surface-0 hover:bg-primary-700"
        >
          <IconPlus size={20} />
          Post
        </button>
      </div>

      <div className="flex-1" />

      <div className="relative" ref={accountMenuRef}>
        {isAccountMenuOpen && (
          <div className="absolute left-0 bottom-full z-10 mb-2 w-full overflow-hidden rounded-md border border-line bg-surface-0 shadow-lg shadow-black/10">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-[14px] cursor-pointer hover:bg-ink/5"
            >
              My profile
            </button>
            <button
              type="button"
              onClick={logout}
              className="block w-full px-3 py-2 text-left text-[14px] cursor-pointer hover:bg-ink/5"
            >
              Log out
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsAccountMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-full py-2 pl-1 pr-2 cursor-pointer transition-colors hover:bg-ink/5"
        >
          <img className="h-9 w-9 shrink-0 rounded-full" src={profile?.avatar} alt="" />
          <span className="min-w-0 flex-1 truncate text-left text-[14px] font-bold">@{profile?.handle}</span>
          <IconChevronDown size={16} className="shrink-0 text-ink-secondary" />
        </button>
      </div>

      {isAddStepOpen && <AddStepModal onClose={() => setIsAddStepOpen(false)} />}
      {isAddTripOpen && <AddTripModal onClose={() => setIsAddTripOpen(false)} />}
    </nav>
  );
}
