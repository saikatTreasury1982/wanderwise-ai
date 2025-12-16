'use client';

import { useState } from 'react';
import Input from './Input';
import CircleIconButton from './CircleIconButton';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string, confirmPassword?: string) => Promise<void>;
  title: string;
  description?: string;
  passwordRequirements?: string;
  isLoading?: boolean;
  error?: string;
  mode: 'login' | 'create'; // New prop
  successMessage?: string; // New prop
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  passwordRequirements,
  isLoading = false,
  error,
  mode,
  successMessage,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'create') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (!password || !confirmPassword) {
        setLocalError('Both fields are required');
        return;
      }
    }

    await onSubmit(password, confirmPassword);
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setLocalError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-card p-6 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-white/80 mb-4">{description}</p>
        )}

        {successMessage ? (
          // Success state
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-white">
              <p className="font-semibold mb-1">Success!</p>
              <p className="text-sm text-white/90">{successMessage}</p>
            </div>
            <div className="flex justify-center">
              <CircleIconButton
                type="button"
                onClick={handleClose}
                variant="primary"
                title="Close"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
            </div>
          </div>
        ) : (
          // Form state
          <>
            {passwordRequirements && (
              <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-white/90 text-sm mb-4">
                <p className="font-semibold mb-1">Password Requirements:</p>
                <p>{passwordRequirements}</p>
              </div>
            )}

            {(error || localError) && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm mb-4">
                {error || localError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="password"
                type="password"
                label={mode === 'create' ? 'New Password' : 'Password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="glass"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                required
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              {mode === 'create' && (
                <Input
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  variant="glass"
                  autoComplete="new-password"
                  required
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              )}

              <div className="flex justify-center gap-4">
                <CircleIconButton
                  type="button"
                  onClick={handleClose}
                  variant="default"
                  title="Cancel"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                />
                <CircleIconButton
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  title={mode === 'create' ? 'Create' : 'Continue'}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  }
                />
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}