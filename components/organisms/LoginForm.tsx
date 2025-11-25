'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface FormErrors {
  email?: string;
  general?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [email, setEmail] = useState('');
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const validateEmail = (): boolean => {
    if (!email) {
      setErrors({ email: 'Email is required' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return false;
    }
    return true;
  };

  const createPasskey = async () => {
    if (!userId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { startRegistration } = await import('@simplewebauthn/browser');

      // Get registration options
      const optionsRes = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!optionsRes.ok) throw new Error('Failed to get registration options');
      
      const options = await optionsRes.json();

      // Create passkey
      const credential = await startRegistration(options);

      // Verify and store
      const verifyRes = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credential, challenge: options.challenge }),
      });

      if (!verifyRes.ok) throw new Error('Failed to verify passkey');

      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create passkey' });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');

      // Get auth options
      const optionsRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) throw new Error('Failed to get login options');
      
      const options = await optionsRes.json();

      // Authenticate
      const credential = await startAuthentication(options);

      // Verify
      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, challenge: options.challenge }),
      });

      if (!verifyRes.ok) throw new Error('Authentication failed');

      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Check if user exists and has passkey
      const checkRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (checkRes.status === 404) {
        const error = await checkRes.json();
        
        if (error.error.includes('No passkeys') && error.userId) {
          // User exists but needs passkey - userId already returned
          setUserId(error.userId);
          setShowPasskeySetup(true);
          setIsLoading(false);
          return;
        }
        
        throw new Error('User not found. Please register first.');
      }

      if (!checkRes.ok) throw new Error('Failed to check user');

      // User has passkey, proceed with login
      setIsLoading(false);
      await loginWithPasskey();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
      setIsLoading(false);
    }
  };

  if (showPasskeySetup) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-purple-500/20 border border-purple-500/30 text-white">
          <p className="font-semibold mb-2">Set up your passkey</p>
          <p className="text-sm text-white/80">
            Use your device's biometrics or PIN to create a secure passkey.
          </p>
        </div>

        {errors.general && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {errors.general}
          </div>
        )}

        <Button onClick={createPasskey} variant="primary" size="lg" fullWidth isLoading={isLoading}>
          Create Passkey
        </Button>

        <button
          onClick={() => { setShowPasskeySetup(false); setUserId(null); }}
          className="w-full text-sm text-white/70 hover:text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
          {errors.general}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChange={handleEmailChange}
        error={errors.email}
        variant="glass"
        autoComplete="email"
        required
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} className="mt-6">
        Continue
      </Button>

      <div className="text-center pt-4 border-t border-white/20">
        <p className="text-sm text-white/90">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-purple-300 hover:text-purple-200 transition-colors underline">
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}