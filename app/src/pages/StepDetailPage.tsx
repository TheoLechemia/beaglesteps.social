import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { Step, type StepEntry } from '../components/Step';
import { getRepoAgent, publicAgent } from '../lib/atproto';

export function StepDetailPage() {
  const { handle, rkey } = useParams<{ handle: string; rkey: string }>();
  const { agent } = useAuth();
  const readAgent = agent ?? publicAgent;
  const [step, setStep] = useState<StepEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!handle || !rkey) return;
    let cancelled = false;
    setIsLoading(true);

    readAgent.com.atproto.identity
      .resolveHandle({ handle })
      .then(async ({ data }) => {
        const repoAgent = await getRepoAgent(data.did);
        return repoAgent.com.atproto.repo.getRecord({ repo: data.did, collection: 'app.beaglesteps.step', rkey });
      })
      .then(({ data }) => {
        if (cancelled) return;
        setStep(data as StepEntry);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setStep(null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readAgent, handle, rkey]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-ink-muted">
        <p className="text-[13px]">Loading step...</p>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-ink-muted">
        <p className="text-[13px]">Step not found.</p>
        <Link to="/" className="text-[13px] text-primary">
          Back to Discover
        </Link>
      </div>
    );
  }

  const backHref = `/profile/${handle}/trip/${step.value.tripRef.uri.split('/').pop()}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Link
        to={backHref}
        className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-line bg-surface-2 px-4 py-2.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <IconArrowLeft size={14} /> Back to trip
      </Link>
      <div className="flex-1 overflow-y-auto">
        <Step step={step} authorHandle={handle ?? ''} defaultExpanded />
      </div>
    </div>
  );
}
