import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageBackground from '@/components/ui/PageBackground';

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
        
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
          
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}