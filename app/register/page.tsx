import { Metadata } from 'next';
import AuthLayout from '@/components/templates/AuthLayout';
import RegistrationForm from '@/components/organisms/RegistrationForm';

export const metadata: Metadata = {
  title: 'Create Account | WanderWise',
  description: 'Create your WanderWise account to start planning your trips',
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start planning your travels with WanderWise"
    >
      <RegistrationForm />
    </AuthLayout>
  );
}