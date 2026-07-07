import { useCallback, useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { IconCalendar, IconHeart, IconMapPin, IconMessageCircle, IconPhoto, IconTrash } from '@tabler/icons-react';
import { AppBskyFeedDefs } from '@atproto/api';
import type { ComAtprotoRepoListRecords } from '@atproto/api';
import type { StepRecord } from '../types/trip';
import { useAuth } from '../context/AuthContext';

export type StepEntry = ComAtprotoRepoListRecords.Record & { value: StepRecord };

interface StepProps {
  step: StepEntry;
  authorHandle: string;
  onDelete?: (step: StepEntry) => void;
  /** Render already expanded (used by the /profile/:handle/step/:rkey permalink). */
  defaultExpanded?: boolean;
}

export function Step({ step, onDelete, defaultExpanded = false }: StepProps) {
  const { title, body, date, location, photos, crossPostRef } = step.value;
  const { agent } = useAuth();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [postView, setPostView] = useState<AppBskyFeedDefs.PostView | null>(null);
  const [replies, setReplies] = useState<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const locationLabel = location?.latitude && location.longitude
      ? `${location.latitude}, ${location.longitude}`
      : null;

  const loadThread = useCallback(() => {
    if (!agent || !crossPostRef) return;
    setIsLoadingThread(true);
    agent
      .getPostThread({ uri: crossPostRef.uri, depth: 50 })
      .then(({ data }) => {
        if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setPostView(null);
          setReplies([]);
          return;
        }
        setPostView(data.thread.post);
        setReplies((data.thread.replies ?? []).filter(AppBskyFeedDefs.isThreadViewPost));
      })
      .finally(() => setIsLoadingThread(false));
  }, [agent, crossPostRef]);

  useEffect(() => {
    if (isExpanded && crossPostRef && postView === null) {
      loadThread();
    }
  }, [isExpanded, crossPostRef, postView, loadThread]);

  async function handleToggleLike() {
    if (!agent || !postView) return;
    if (postView.viewer?.like) {
      const likeUri = postView.viewer.like;
      setPostView((p) => p && { ...p, likeCount: Math.max(0, (p.likeCount ?? 1) - 1), viewer: { ...p.viewer, like: undefined } });
      await agent.deleteLike(likeUri);
    } else {
      const { uri } = await agent.like(postView.uri, postView.cid);
      setPostView((p) => p && { ...p, likeCount: (p.likeCount ?? 0) + 1, viewer: { ...p.viewer, like: uri } });
    }
  }

  async function handleSubmitComment(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agent || !postView || !commentText.trim()) return;
    setIsCommenting(true);
    try {
      const ref = { uri: postView.uri, cid: postView.cid };
      await agent.post({ text: commentText.slice(0, 300), reply: { root: ref, parent: ref } });
      setCommentText('');
      loadThread();
    } finally {
      setIsCommenting(false);
    }
  }

  return (
    <div className="border-b-[0.5px] border-line px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-voice text-[16px] leading-tight">
            {title || 'Sans titre'}
          </div>
          {body && (
            <div className="mb-2 text-[13px] leading-normal text-ink-secondary">
              {body}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
            {date && (
              <span className="flex items-center gap-1">
                <IconCalendar size={11} /> {date}
              </span>
            )}
            {locationLabel && (
              <span className="flex items-center gap-1">
                <IconMapPin size={11} /> {locationLabel}
              </span>
            )}
            {photos && photos.length > 0 && (
              <span className="flex items-center gap-1">
                <IconPhoto size={11} /> {photos.length}
              </span>
            )}
          </div>
          {crossPostRef && (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className={`mt-2 flex cursor-pointer items-center gap-1 text-[15px] ${
                isExpanded ? 'text-primary' : 'text-ink-muted hover:text-primary'
              }`}
            >
              <IconMessageCircle size={18} />
              Comment
            </button>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(step)}
            className="cursor-pointer text-ink-muted hover:text-red-500"
            aria-label="Supprimer le step"
          >
            <IconTrash size={16} />
          </button>
        )}
      </div>

      {isExpanded && crossPostRef && (
        <div className="mt-3 border-t-[0.5px] border-line pt-3 bg-surface-1 p-2">
          <div className="mb-3 flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={!postView}
              className={`flex cursor-pointer items-center gap-1 text-[13px] disabled:pointer-events-none disabled:opacity-50 ${
                postView?.viewer?.like ? 'text-red-500' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <IconHeart size={16} fill={postView?.viewer?.like ? 'currentColor' : 'none'} />
              {postView?.likeCount ? postView.likeCount : 'Like'}
            </button>
            <span className="text-[13px] text-ink-muted">
              {postView?.replyCount ? `${postView.replyCount} comments` : 'No comments yet'}
            </span>
          </div>

          <form onSubmit={handleSubmitComment} className="mb-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-lg border-[0.5px] border-line bg-white p-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
                className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-surface-0 hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {isCommenting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>

          {isLoadingThread && replies.length === 0 ? (
            <div className="text-[13px] text-ink-muted">Loading comments...</div>
          ) : (  
            replies.map((reply) => {
              const record = reply.post.record as { text?: string };
              return (
                <div key={reply.post.uri} className="flex items-start gap-2.5 border-t-[0.5px] border-line py-2.5 first:border-t-0">
                  {reply.post.author.avatar && (
                    <img src={reply.post.author.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <span className="font-medium">{reply.post.author.displayName || reply.post.author.handle}</span>
                      <span className="text-ink-muted">@{reply.post.author.handle}</span>
                    </div>
                    <div className="text-[13px] text-ink-secondary">{record.text}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
