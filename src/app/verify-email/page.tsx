'use client';

import { useState, Suspense } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

function VerifyEmailContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success('Email verified successfully!');
        router.push(redirectUrl);
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to verify email');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast.success('Verification code sent!');
    } catch (err: any) {
      console.error('Resend error:', err);
      toast.error('Failed to resend verification code');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              We've sent a verification code to your email address. Please enter it below to complete your registration.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              {/* Clerk CAPTCHA widget */}
              <div id="clerk-captcha"></div>
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !verificationCode}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-md mx-auto text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4">Loading verification...</p></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}