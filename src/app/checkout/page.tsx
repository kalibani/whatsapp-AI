'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePackages, Package } from '@/hooks/use-packages';
import { formatPrice, getAnnualPrice, getAnnualMonthlyDisplay } from '@/lib/format-price';
import { clientApi } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { packages, loading, error } = usePackages();
  const { user } = useUser();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const router = useRouter();

  const packageId = searchParams.get('package_id');
  const billingCycle = searchParams.get('billing') as 'monthly' | 'annual' || 'monthly';
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (packages.length > 0 && packageId) {
      const pkg = packages.find(p => p.package_id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
      }
    }
  }, [packages, packageId]);

  const handleSubscribe = async () => {
    if (!packageId) {
      toast.error('Package ID is missing');
      return;
    }

    if (!user) {
      toast.error('User information not available');
      return;
    }

    setIsSubscribing(true);

    try {
      // Get user name from Clerk metadata or construct from firstName/lastName
      const userName = user.unsafeMetadata?.firstName && user.unsafeMetadata?.lastName
        ? `${user.unsafeMetadata.firstName} ${user.unsafeMetadata.lastName}`
        : user.fullName || 'User';

      const userPhone = user.unsafeMetadata?.phone as string || '';
      const userEmail = user.primaryEmailAddress?.emailAddress || '';

      if (!userEmail) {
        toast.error('Email address is required');
        return;
      }

      // Call subscription API using centralized client
      const response = await clientApi.createSubscription({
        package_id: packageId,
        sub_type: billingCycle,
      });

      // Handle successful subscription
      if (response?.data?.url) {
        toast.success('Redirecting to payment...');

        // Redirect to payment URL
        window.location.href = response?.data?.url;
      } else {
        // Fallback if no URL provided
        toast.success('Subscription created successfully!');
        router.push('/dashboard/subscription');
      }

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">Error loading package: {error}</p>
          <Link href="/dashboard/subscription" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Package not found</h1>
          <p className="text-gray-600 mb-8">The selected package could not be found.</p>
          <Link href="/dashboard/subscription" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  const isCustomPrice = parseFloat(selectedPackage.price) <= 0 || isNaN(parseFloat(selectedPackage.price));

  let displayPrice: string;
  let totalAmount: string;
  let billingText: string = '';

  if (isCustomPrice) {
    displayPrice = 'Custom';
    totalAmount = 'Contact Sales';
  } else if (billingCycle === 'annual') {
    displayPrice = getAnnualMonthlyDisplay(selectedPackage.price);
    totalAmount = getAnnualPrice(selectedPackage.price);
    billingText = 'Billed annually';
  } else {
    displayPrice = formatPrice(selectedPackage.price);
    totalAmount = formatPrice(selectedPackage.price);
    billingText = 'Billed monthly';
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/subscription" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to pricing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your subscription to get started</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Package Summary</span>
                <Badge variant="outline" className="capitalize">
                  {billingCycle}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedPackage.package_name}</h3>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">
                    {selectedPackage.description.trim()}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">
                      {billingCycle === 'annual' ? 'Monthly price:' : 'Price:'}
                    </span>
                    <span className="font-semibold">{displayPrice}</span>
                  </div>

                  {billingCycle === 'annual' && !isCustomPrice && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Annual total:</span>
                        <span className="font-semibold">{totalAmount}</span>
                      </div>
                      <div className="text-sm text-green-600">
                        Save 15% with annual billing
                      </div>
                    </>
                  )}

                  <div className="text-sm text-gray-500 mt-2">
                    {billingText}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Included features:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedPackage.features.slice(0, 5).map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                    {selectedPackage.features.length > 5 && (
                      <li className="text-blue-600">+ {selectedPackage.features.length - 5} more features</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Package Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold">
                      {isCustomPrice ? 'Custom' : totalAmount}
                    </span>
                  </div>
                  {!isCustomPrice && (
                    <div className="text-sm text-gray-600 mt-1">
                      {billingText}
                    </div>
                  )}
                </div>

                {/* Debug Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Order Details:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Package ID: {packageId}</div>
                    <div>Billing: {billingCycle}</div>
                    <div>Amount: {amount || 'N/A'}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isCustomPrice ? (
                    <Button className="w-full" size="lg">
                      Contact Sales Team
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                    >
                      {isSubscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to Payment...
                        </>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </Button>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/subscription">
                      Change Package
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="max-w-4xl mx-auto text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4">Loading checkout...</p></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}