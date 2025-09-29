'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setClientKeyCookie } from '@/lib/auth-utils';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';

export default function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        unsafeMetadata: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep(2);
    } catch (err: any) {
      console.error('Error during sign-up:', err);
      toast.error(err.errors?.[0]?.message || 'An error occurred during sign-up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        // Create user in database
        await createUserInDatabase({
          clerkId: completeSignUp.createdUserId!,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        });

        // Call your API to register the user and get the response
        const apiResponse = await registerWithAPI({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
        });

        console.log('API Response:', apiResponse);

        // Update user with BerryLabs data
        if (apiResponse && apiResponse.status === 'success' && apiResponse.data) {
          const { user_id, client_key } = apiResponse.data;
          if (user_id && client_key) {
            console.log('Updating user with BerryLabs data:', {
              clerkId: completeSignUp.createdUserId!,
              user_id,
              client_key
            });
            await updateUserWithBerryLabsData(completeSignUp.createdUserId!, apiResponse.data);

            // Set client_key as cookie
            setClientKeyCookie(client_key);
          } else {
            console.error('Missing user_id or client_key in API response data:', apiResponse.data);
          }
        } else {
          console.error('Invalid API response structure:', apiResponse);
        }

        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error during verification:', err);
      toast.error(err.errors?.[0]?.message || 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const createUserInDatabase = async (userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user in database');
      }
    } catch (error) {
      console.error('Error creating user in database:', error);
      throw error;
    }
  };

  const registerWithAPI = async (userData: { name: string; email: string; phone: string }) => {
    try {
      const apiData = await clientApi.register(userData);
      toast.success('Account created successfully!');
      return apiData;
    } catch (error) {
      console.error('Error registering with API:', error);
      toast.error('Account created but failed to register with API');
      return null;
    }
  };

  const updateUserWithBerryLabsData = async (clerkId: string, berryLabsData: {
    user_id: string;
    client_key: string;
  }) => {
    try {
      console.log('Sending update request with:', {
        clerkId,
        userId: berryLabsData.user_id,
        clientKey: berryLabsData.client_key,
      });

      const response = await fetch('/api/users/update-berrylabs-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId,
          userId: berryLabsData.user_id,
          clientKey: berryLabsData.client_key,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to update user with BerryLabs data: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update successful:', result);
    } catch (error) {
      console.error('Error updating user with BerryLabs data:', error);
    }
  };

  if (step === 1) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="clerk-captcha"></div>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Verify Email</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          We've sent a verification code to {formData.email}. Please enter it below.
        </p>
        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              placeholder="Enter 6-digit code"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}