import { useEffect, useRef, useState } from 'react';
import { IconBell, IconSearch } from '@tabler/icons-react';

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <nav className="flex h-11 shrink-0 items-center gap-3 border-b-[0.5px] border-line bg-surface-2 px-4">
      <div className="font-voice text-[17px] shrink-0">openstep</div>
      <div className="ml-auto flex items-center gap-3">
        <IconSearch size={18} className="cursor-pointer text-ink-secondary" />
        <IconBell size={18} className="cursor-pointer text-ink-secondary" />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-accent text-[10px] font-medium text-ink-accent"
          >
            JL
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-md border-[0.5px] border-line bg-surface-0 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-surface-1"
              >
                See profile
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-surface-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
