import Link from 'next/link';
import Logo from '@/app/components/ui/Logo';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import PageBackground from '@/app/components/ui/PageBackground';

export default function Home() {
return (
  <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
    <PageBackground />
    
    <div className="relative z-10 w-full max-w-2xl">
      <div className="glass-card p-12 rounded-3xl shadow-2xl text-center">
        <Logo size="xl" showTagline className="mb-20" />
        
        <h1 className="text-5xl font-bold text-white mb-4">
          Hi there!
        </h1>
        
        <p className="text-xl text-white/90 mb-12 leading-relaxed">
          I'm your smart travel companion for planning trips and managing budgets.
        </p>
        
        <div className="flex gap-6 justify-center">
          <Link href="/register">
            <CircleIconButton
              variant="primary"
              title="Get Started"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
          </Link>
          
          <Link href="/login">
            <CircleIconButton
              variant="default"
              title="Sign In"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              }
            />
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}