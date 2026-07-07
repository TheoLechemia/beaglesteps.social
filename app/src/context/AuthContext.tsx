import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserOAuthClient, buildAtprotoLoopbackClientId, type OAuthSession } from '@atproto/oauth-client-browser'
import { Agent, type AppBskyActorDefs } from '@atproto/api'

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: AppBskyActorDefs.ProfileViewDetailed | null;
  agent: Agent | null;
  login: (handle: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<BrowserOAuthClient | null>(null);
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let client: BrowserOAuthClient | undefined;

    BrowserOAuthClient.load({
      clientId: import.meta.env.DEV
        ? buildAtprotoLoopbackClientId({
            scope: 'atproto transition:generic',
            redirect_uris: [
              `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/`,
            ],
          })
        : 'https://beaglesteps.app/client-metadata.json',
      handleResolver: 'https://eurosky.social',
      // handleResolver: 'https://bsky.social',
    }).then(async (loadedClient) => {
      if (cancelled) {
        loadedClient.dispose();
        return;
      }
      client = loadedClient;
      clientRef.current = loadedClient;
      // Restores an existing session, or processes the redirect back from the PDS.
      const result = await loadedClient.init();
      if (cancelled) return;
      setSession(result?.session ?? null);
      setIsLoading(false);

      if (result?.session) {
        const sessionAgent = new Agent(result.session);
        setAgent(sessionAgent);
        const { data } = await sessionAgent.getProfile({ actor: result.session.sub });
        if (cancelled) return;
        setProfile(data);
        console.log("??", data);


      }
    });

    return () => {
      cancelled = true;
      client?.dispose();
    };
  }, []);

  async function login(handle: string) {
    if (!clientRef.current) return;
    // Redirects the browser to the user's PDS to authorize the app.
    await clientRef.current.signIn(handle);
  }

  function logout() {
    if (session) {
      clientRef.current?.revoke(session.sub);
    }
    setSession(null);
    setAgent(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!session, isLoading, profile, agent, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
