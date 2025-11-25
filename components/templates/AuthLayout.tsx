import { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';
import PageBackground from '@/components/ui/PageBackground';

export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated gradient background */}
      <PageBackground />

      {/* Auth Card */}
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" showTagline />
        </div>

        {/* Glass Card with enhanced effect */}
        <div className="glass-card p-8 rounded-3xl shadow-2xl">
          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-white/80">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          <div>{children}</div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/70 mt-6 font-medium">
          © {new Date().getFullYear()} WanderWise. All rights reserved.
        </p>
      </div>
    </div>
  );
}