import { Metadata } from 'next';
import PageBackground from '@/components/ui/PageBackground';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Dashboard | WanderWise',
  description: 'Your travel dashboard',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen relative p-6">
      <PageBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to WanderWise
          </h1>
          <p className="text-white/80 text-lg">
            Your travel dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="glass" padding="lg" className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">My Trips</h2>
            <p className="text-white/70">No trips yet. Create your first trip!</p>
          </Card>

          <Card variant="glass" padding="lg" className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Budget</h2>
            <p className="text-white/70">Track your travel expenses</p>
          </Card>

          <Card variant="glass" padding="lg" className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
            <p className="text-white/70">Manage your preferences</p>
          </Card>
        </div>
      </div>
    </div>
  );
}