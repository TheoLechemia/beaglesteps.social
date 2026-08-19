import type { SubmitEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Map } from '../components/Map';

const loginSky = {
    'sky-color': '#05060a',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#1a1d2e',
    'horizon-fog-blend': 0.5,
    'fog-color': '#1a1d2e',
    'fog-ground-blend': 0.5,
    'atmosphere-blend': 0.8,
} as const;

export function LoginPage(){
    const auth = useAuth();

    function handleLogin(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const handle = formData.get("handle") as string;
        auth.login(handle);
    }
    return (
        <div className='flex h-full shrink-0'>
            <div className='hidden md:flex relative w-2xl shrink-0 flex-col items-center overflow-hidden bg-[#05060a]'>
                <Map
                    className='absolute! inset-0 h-full w-full'
                    style='https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                    zoom={1.4}
                    sky={loginSky}
                />
                <div className='relative z-10 flex flex-col items-center px-8 pt-16 text-center'>
                    <h2 className='font-voice text-6xl font-extrabold text-white'>Welcome</h2>
                    <h5 className='mt-2 text-[15px] text-white/70'>Explore trips in the athmosphere !</h5>
                </div>
            </div>

            <div className='relative flex flex-1 flex-col items-center justify-center px-10'>
                <h2 className='md:hidden absolute inset-x-0 top-20 text-center font-voice text-4xl font-extrabold'>Login</h2>
                <div className='flex w-full max-w-sm flex-col gap-6'>
                    <div className='flex flex-col gap-1 items-center justify-center'>
                        <h1 className='font-brand text-2xl font-extrabold tracking-tighter text-ink'>beagle<span className='inline-block border-b-4 border-primary pb-0 leading-none'>steps</span><span className='text-primary'>.social</span></h1>
                        <p className='text-[14px] text-ink-secondary'>Sign in with your Athmosphere account to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                        <div className='flex flex-col gap-1.5'>
                            <input
                                id='handle'
                                name='handle'
                                type='text'
                                placeholder='handle.bsky.social / handle.eurosky.socail...'
                                autoComplete='username'
                                className='rounded-full border-[1.5px] border-line px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-muted focus:border-primary'
                            />
                        </div>
                        <button
                            type='submit'
                            className='mt-2 rounded-full bg-primary py-2.5 text-[15px] font-semibold text-white hover:bg-primary-700'
                        >
                            Connect
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}