'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface Country {
  country_code: string;
  country_name: string;
  currency_code: string;
}

interface RegistrationFormData {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  residentCountry: string;
  homeCurrency: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  residentCountry?: string;
  general?: string;
}

export default function RegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    residentCountry: '',
    homeCurrency: '',
  });

  // Load countries on mount
  useEffect(() => {
    async function loadCountries() {
      try {
        const response = await fetch('/api/countries');
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        console.error('Failed to load countries:', error);
      }
    }
    loadCountries();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Auto-fill currency when country is selected
    if (name === 'residentCountry') {
      const selectedCountry = countries.find(c => c.country_code === value);
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        homeCurrency: selectedCountry?.currency_code || ''
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.residentCountry) {
      newErrors.residentCountry = 'Please select your country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  console.log('Form submitted with data:', formData);
  
  if (!validateForm()) return;

  setIsLoading(true);
  setErrors({});

  try {
    console.log('Calling registration API...');
    
    // ACTUAL API CALL HERE
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName,
        residentCountry: formData.residentCountry,
        homeCurrency: formData.homeCurrency,
      }),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    console.log('Registration successful, redirecting...');
    router.push('/login');
  } catch (error) {
    console.error('Registration error:', error);
    setErrors({
      general: error instanceof Error ? error.message : 'Registration failed. Please try again.',
    });
  } finally {
    setIsLoading(false);
  }
};

  const countryOptions = countries.map(country => ({
    value: country.country_code,
    label: country.country_name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 rounded-lg bg-error-light/20 border border-error-main/20 text-error-dark text-sm animate-slide-down">
          {errors.general}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
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

      <Input
        name="firstName"
        type="text"
        label="First Name"
        placeholder="John"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
        variant="glass"
        autoComplete="given-name"
        required
      />

      <Input
        name="middleName"
        type="text"
        label="Middle Name (Optional)"
        placeholder="Michael"
        value={formData.middleName}
        onChange={handleChange}
        variant="glass"
        autoComplete="additional-name"
      />

      <Input
        name="lastName"
        type="text"
        label="Last Name"
        placeholder="Smith"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
        variant="glass"
        autoComplete="family-name"
        required
      />

      <Select
        name="residentCountry"
        label="Country of Residence"
        placeholder="Select your country"
        options={countryOptions}
        value={formData.residentCountry}
        onChange={handleChange}
        error={errors.residentCountry}
        variant="glass"
        required
      />

      {/* Currency field - auto-populated */}
      <Input
        name="homeCurrency"
        type="text"
        label="Home Currency"
        placeholder="Currency will auto-fill"
        value={formData.homeCurrency}
        variant="glass"
        disabled
        readOnly
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        className="mt-6"
      >
        Create Account
      </Button>

      <div className="text-center pt-4 border-t border-white/20">
        <p className="text-sm text-white/90">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-purple-300 hover:text-purple-200 transition-colors underline">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}