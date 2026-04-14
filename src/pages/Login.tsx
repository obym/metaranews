import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { user, login, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError('');
    try {
      await login();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Gagal login. Pastikan popup tidak diblokir oleh browser Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto flex items-center justify-center">
            <img 
              src="https://lh3.googleusercontent.com/d/1jrnekXXK3GARE-oM-LnhIw4tc6wOSLEt" 
              alt="Metaranews Logo" 
              className="h-24 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Metaranews.co
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistem Manajemen Surat & Invoice
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {isLoggingIn ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <LogIn className="h-5 w-5 text-red-500 group-hover:text-red-400" aria-hidden="true" />
              )}
            </span>
            {isLoggingIn ? 'Memproses...' : 'Login dengan Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
