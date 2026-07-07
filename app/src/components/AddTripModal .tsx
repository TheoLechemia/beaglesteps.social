import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { IconX } from '@tabler/icons-react';
import { useUserTrip } from '../context/UserTripContext';

interface AddTripModalProps {
  onClose: () => void;
}

export function AddTripModal({ onClose }: AddTripModalProps) {
  const { createTrip } = useUserTrip();
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsPosting(true);
    setError(null);

    try {
      await createTrip({
        $type: 'app.beaglesteps.trip',
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        startDate: formData.get('startDate') as string,
        createdAt: new Date().toISOString(),
      });
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
          <h2 className="font-voice text-[17px]">Create a trip</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-1 hover:text-ink"
          >
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input name="title" type="text" />
          <textarea
            name="description"
            autoFocus
            placeholder="What you travel is about !"
            rows={4}
            maxLength={300}
            className="w-full resize-none rounded-lg border-[0.5px] border-line bg-surface-1 p-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <input name="startDate" type="date" />


          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-[0.5px] border-line px-4 py-2 text-[13px] hover:bg-surface-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPosting}
              className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-surface-0 hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
            >
             {isPosting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
