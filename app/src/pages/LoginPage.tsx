import type { SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage(){
    const auth = useAuth();
    const navigate = useNavigate();

    function handleLogin(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get("login");
        console.log("login", username);
        auth.login();
        navigate("/");
    }
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input name="login" type="text" placeholder='Login' />
                <input name="password" type="password" placeholder='Password' />
                <button type="submit" >Connect</button>
            </form>
        </div>
    );
}