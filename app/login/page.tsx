import { Metadata } from 'next';
import AuthLayout from '@/components/templates/AuthLayout';
import LoginForm from '@/components/organisms/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | WanderWise',
  description: 'Sign in to your WanderWise account',
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your travel planning"
    >
      <LoginForm />
    </AuthLayout>
  );
}