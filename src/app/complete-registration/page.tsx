'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { setClientKeyCookie } from '@/lib/auth-utils';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  packageId: string;
  billingCycle: string;
  clientKey: string | null;
}

export default function CompleteRegistrationPage() {
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'loading' | 'processing' | 'verification' | 'complete'>('loading');
  const router = useRouter();
  const { signUp, setActive } = useSignUp();

  useEffect(() => {
    // Get pending registration data
    const pendingData = localStorage.getItem('pendingRegistration');
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        setRegistrationData(data);
        setStep('processing');
        handleRegistration(data);
      } catch (error) {
        console.error('Error parsing registration data:', error);
        toast.error('Invalid registration data');
        router.push('/dashboard');
      }
    } else {
      toast.error('No registration data found');
      router.push('/dashboard');
    }
  }, [router]);

  const handleRegistration = async (data: RegistrationData) => {
    setIsProcessing(true);

    try {
      // Step 1: Create Clerk account
      if (!signUp) {
        throw new Error('Sign up not available');
      }

      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        unsafeMetadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });

      let clerkUserId = null;

      // Handle email verification
      if (signUp.status === 'missing_requirements') {
        setStep('verification');
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        clerkUserId = signUp.createdUserId;

        // For now, we'll redirect to email verification
        localStorage.setItem('postRegistrationData', JSON.stringify({
          clerkUserId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          clientKey: data.clientKey,
        }));

        router.push('/verify-email?redirect=/finalize-registration');
        return;
      } else if (signUp.status === 'complete') {
        // Sign-up completed successfully
        await setActive({ session: signUp.createdSessionId });
        clerkUserId = signUp.createdUserId;
      } else {
        clerkUserId = signUp.createdUserId || signUp.id;
      }

      // Step 2: Save user to database
      await saveUserToDatabase(clerkUserId as string, data);

      // Step 3: Set client key cookie
      if (data.clientKey) {
        setClientKeyCookie(data.clientKey);
      }

      // Step 4: Clean up localStorage
      localStorage.removeItem('pendingRegistration');

      setStep('complete');
      toast.success('Registration completed successfully!');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to complete registration');
      setStep('loading');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveUserToDatabase = async (clerkUserId: string, data: RegistrationData) => {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        clientKey: data.clientKey || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save user to database');
    }

    return response.json();
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading registration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {step === 'complete' ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 'processing' && 'Completing Registration'}
              {step === 'verification' && 'Email Verification Required'}
              {step === 'complete' && 'Registration Complete!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              {step === 'processing' && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Creating your account and setting up your subscription...
                  </p>
                  {registrationData && (
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                      <h3 className="font-semibold mb-2">Account Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {registrationData.firstName} {registrationData.lastName}</p>
                        <p><strong>Email:</strong> {registrationData.email}</p>
                        <p><strong>Phone:</strong> {registrationData.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'verification' && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Please check your email for a verification code to complete your registration.
                  </p>
                </div>
              )}

              {step === 'complete' && (
                <div>
                  <p className="text-gray-600 mb-4">
                    🎉 Your account has been created successfully! You can now access your dashboard.
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}