import type { SubmitEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage(){
    const auth = useAuth();

    function handleLogin(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const handle = formData.get("handle") as string;
        auth.login(handle);
    }
    return (
        <div className='flex'>
            <div className='w-64 bg-surface-3'>
                <h2>Login</h2>
            </div>
            <div>
                <form onSubmit={handleLogin}>
                    <input name="handle" type="text" placeholder='handle.bsky.social' />
                    <button type="submit" >Connect</button>
                </form>

            </div>
        </div>
    );
}