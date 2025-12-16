'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/app/components/ui/Input';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import Link from 'next/link';
import PasswordModal from '@/app/components/ui/PasswordModal';

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordModalMode, setPasswordModalMode] = useState<'login' | 'create'>('login');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

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

  const checkUserAuthMethods = async (userEmail: string) => {
    try {
      const response = await fetch('/api/auth/check-auth-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { hasPasskey: false, hasPassword: false };
    } catch (error) {
      return { hasPasskey: false, hasPassword: false };
    }
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
        body: JSON.stringify({ email }),
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

  const handlePasswordAction = async (password: string) => {
    setPasswordError('');
    setPasswordSuccessMessage('');
    setIsLoading(true);
    
    if (passwordModalMode === 'create') {
      // Create password
      try {
        const response = await fetch('/api/auth/password/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create password');
        }

        setPasswordSuccessMessage('Password created successfully! Please login with your new password.');
      } catch (error: any) {
        setPasswordError(error.message || 'Failed to create password');
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login with password
      try {
        const response = await fetch('/api/auth/password/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Login failed');
        }

        // Keep loading spinner while navigating
        router.push('/dashboard');
      } catch (error: any) {
        setPasswordError(error.message || 'Login failed');
        setIsLoading(false);
        throw error;
      }
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

        <div className="flex justify-center gap-4">
          <CircleIconButton
            onClick={() => { setShowPasskeySetup(false); setUserId(null); }}
            variant="default"
            title="Back"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          />
          <CircleIconButton
            onClick={createPasskey}
            variant="primary"
            isLoading={isLoading}
            title="Create Passkey"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.general && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
          {errors.general}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
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
        </div>
        
        {/* Two buttons side by side */}
        <CircleIconButton
          onClick={async () => {
            if (!validateEmail()) return;
            
            setIsLoading(true);
            setErrors({});

            try {
              const checkRes = await fetch('/api/auth/passkey/login-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });

              if (checkRes.status === 404) {
                const error = await checkRes.json();
                
                if (error.error.includes('No passkeys') && error.userId) {
                  setUserId(error.userId);
                  setShowPasskeySetup(true);
                  setIsLoading(false);
                  return;
                }
                
                throw new Error('User not found. Please register first.');
              }

              if (!checkRes.ok) throw new Error('Failed to check user');

              setIsLoading(false);
              await loginWithPasskey();
            } catch (error: any) {
              setErrors({ general: error.message || 'An error occurred' });
              setIsLoading(false);
            }
          }}
          variant="primary"
          isLoading={isLoading}
          title="Continue with Passkey"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          }
        />
        <CircleIconButton
          onClick={async () => {
            if (!validateEmail()) return;
            
            setIsCheckingAuth(true);

            // Check if user has password
            const authMethods = await checkUserAuthMethods(email);
            
            if (authMethods.hasPassword) {
              setPasswordModalMode('login');
            } else {
              setPasswordModalMode('create');
            }
            
            // Fetch password requirements
            const res = await fetch('/api/auth/password/requirements');
            const data = await res.json();
            setPasswordRequirements(data.description);
            setPasswordSuccessMessage('');
            
            setIsCheckingAuth(false);
            setShowPasswordModal(true);
          }}
          variant="default"
          isLoading={isCheckingAuth}
          title="Continue with Password"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
      </div>

      <div className="text-center pt-4 border-t border-white/20">
        <p className="text-sm text-white/90">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-purple-300 hover:text-purple-200 transition-colors underline">
            Create one
          </Link>
        </p>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError('');
          setPasswordSuccessMessage('');
        }}
        onSubmit={handlePasswordAction}
        title="Password"
        description={passwordModalMode === 'create' 
          ? "You haven't set up a password yet. Create one to continue."
          : "Sign in to continue your travel planning"
        }
        passwordRequirements={passwordRequirements}
        isLoading={isLoading}
        error={passwordError}
        mode={passwordModalMode}
        successMessage={passwordSuccessMessage}
      />
    </div>
  );
}