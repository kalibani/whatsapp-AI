'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePackages, Package } from '@/hooks/use-packages';
import { formatPrice, getAnnualPrice, getAnnualMonthlyDisplay } from '@/lib/format-price';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { clientApi } from '@/lib/api';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

function RegisterSubscribeContent() {
  const searchParams = useSearchParams();
  const { packages, loading, error } = usePackages();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signUp, setActive } = useSignUp();

  const packageId = searchParams.get('package_id');
  const billingCycle = searchParams.get('billing') as 'monthly' | 'annual' || 'monthly';
  const amount = searchParams.get('amount');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (packages.length > 0 && packageId) {
      const pkg = packages.find(p => p.package_id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
      }
    }
  }, [packages, packageId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!packageId) {
      toast.error('Package ID is missing');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create subscription (this will also register the user)
      const subscriptionResponse = await clientApi.createSubscriptionRegister({
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email,
        package_id: packageId,
        sub_type: billingCycle,
      });

      // Step 2: Store form data and subscription info for post-payment registration
      localStorage.setItem('pendingRegistration', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        packageId: packageId,
        billingCycle: billingCycle,
        clientKey: subscriptionResponse?.client_key || null,
      }));

      // Step 3: Redirect to payment immediately with special flag
      if (subscriptionResponse?.data?.url) {
        toast.success('Redirecting to payment...');

        // Add query parameter to payment URL to identify this as register flow
        const paymentUrl = new URL(subscriptionResponse.data.url);
        paymentUrl.searchParams.append('from', 'register_subscribe');

        window.location.href = paymentUrl.toString();
      } else {
        // Fallback if no payment URL
        toast.error('No payment URL received');
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600">Error loading package: {error}</p>
          <Link href="/" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Package not found</h1>
          <p className="text-gray-600 mb-8">The selected package could not be found.</p>
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Subscribe & Pay</h1>
          <p className="text-gray-600 mt-2">Create your account and complete payment in one step</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Clerk CAPTCHA widget */}
                <div id="clerk-captcha"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe & Pay Now'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subscription Summary</span>
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

                <div className="bg-green-50 p-4 rounded-lg mt-4">
                  <p className="text-green-800 text-sm">
                    🚀 Your account will be created and you'll be redirected to payment immediately.
                    Complete your payment to activate your subscription instantly!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RegisterSubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-4xl mx-auto text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4">Loading registration...</p></div></div>}>
      <RegisterSubscribeContent />
    </Suspense>
  );
}