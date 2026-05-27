import { useState } from 'react';
import { loginWithGoogle } from '../services/auth';

export default function Login() {
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    setMessage('Starting Google login...');
    try {
      await loginWithGoogle();
      setMessage('Google login flow started.');
    } catch (error) {
      setMessage('Unable to initiate login.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Dormitory Login</h1>
        <p className="mt-4 text-slate-600">Authenticate using Google to receive your access and refresh tokens.</p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          Sign in with Google
        </button>
        {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
      </div>
    </main>
  );
}
