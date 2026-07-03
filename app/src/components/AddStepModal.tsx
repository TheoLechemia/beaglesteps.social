import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface AddStepModalProps {
  onClose: () => void;
}

export function AddStepModal({ onClose }: AddStepModalProps) {
  const { agent } = useAuth();
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent || !text.trim()) return;

    setIsPosting(true);
    setError(null);
    try {
      await agent.post({ text });
      onClose();
    } catch {
      setError("La publication a échoué. Réessaie.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[440px] rounded-2xl border-[0.5px] border-line bg-surface-0 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-voice text-[17px]">Ajouter une étape</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-1 hover:text-ink"
          >
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Raconte cette étape de ton voyage..."
            rows={4}
            maxLength={300}
            className="w-full resize-none rounded-lg border-[0.5px] border-line bg-surface-1 p-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
          />

          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-ink-muted">{text.length}/300</span>
            {error && <span className="text-[11px] text-red-500">{error}</span>}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-[0.5px] border-line px-4 py-2 text-[13px] hover:bg-surface-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isPosting}
              className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-surface-0 hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isPosting ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
