'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

type PaymentStatus = 'success_payment' | 'pending' | 'failed_payment' | 'loading';

interface OrderStatusResponse {
  status: string;
  data: {
    order_id: string;
    status: PaymentStatus;
    amount?: number;
    plan?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromRegister, setIsFromRegister] = useState(false);

  const orderId = searchParams.get('order_id');
  const plan = searchParams.get('plan');
  const fromParam = searchParams.get('from');

  // Check if this is coming from registration flow
  useEffect(() => {
    if (fromParam === 'register_subscribe') {
      setIsFromRegister(true);
    }
  }, [fromParam]);

  const saveOrderToDatabase = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to save order to database');
      }

      const result = await response.json();
      console.log('Order saved successfully:', result);
    } catch (error) {
      console.error('Error saving order to database:', error);
      // Don't throw error here to avoid disrupting the payment status check
    }
  };

  const handlePostPaymentRegistration = async () => {
    try {
      // Get stored registration data
      const pendingData = localStorage.getItem('pendingRegistration');
      if (!pendingData) {
        console.log('No pending registration data found');
        return;
      }

      const registrationData = JSON.parse(pendingData);

      // Redirect to complete registration page
      router.push('/complete-registration');
    } catch (error) {
      console.error('Error handling post-payment registration:', error);
    }
  };

  const checkPaymentStatus = async (showRefreshLoader = false) => {
    if (!orderId) {
      setError('Order ID is missing');
      setPaymentStatus('failed_payment');
      return;
    }

    if (showRefreshLoader) {
      setIsRefreshing(true);
    } else {
      setPaymentStatus('loading');
    }

    try {
      const response: OrderStatusResponse = await clientApi.getOrderStatus(orderId);

      if (response?.data?.status && response.data) {
        setPaymentStatus(response.data.status);
        setOrderData(response.data);
        setError(null);

        // Save order data to database if payment is successful
        if (response.data.status === 'success_payment') {
          await saveOrderToDatabase(response.data);

          // Handle registration flow after successful payment
          if (isFromRegister) {
            await handlePostPaymentRegistration();
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check payment status');
      setPaymentStatus('failed_payment');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkPaymentStatus();
  }, [orderId]);

  // Auto-refresh for pending payments
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStatus === 'pending') {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [paymentStatus, orderId]);

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'success_payment':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'failed_payment':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'success_payment':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed_payment':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'loading':
        return <Badge className="bg-blue-500">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: PaymentStatus) => {
    switch (status) {
      case 'success_payment':
        return {
          title: 'Payment Successful!',
          description: 'Your subscription has been activated successfully. You can now access all features.',
        };
      case 'pending':
        return {
          title: 'Payment Pending',
          description: 'Your payment is being processed. This may take a few minutes. We\'ll refresh automatically.',
        };
      case 'failed_payment':
        return {
          title: 'Payment Failed',
          description: 'There was an issue with your payment. Please try again or contact support.',
        };
      case 'loading':
        return {
          title: 'Checking Payment Status',
          description: 'Please wait while we verify your payment...',
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine payment status.',
        };
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-8">Order ID is missing from the URL.</p>
          <Button asChild>
            <Link href="/dashboard/subscription">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(paymentStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon(paymentStatus)}
            </div>
            <CardTitle className="text-2xl mb-2">{statusInfo.title}</CardTitle>
            <p className="text-gray-600">{statusInfo.description}</p>
            <div className="flex justify-center mt-4">
              {getStatusBadge(paymentStatus)}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Details */}
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                {plan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span>{plan}</span>
                  </div>
                )}
                {orderData?.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span>Rp {orderData.amount.toLocaleString()}</span>
                  </div>
                )}
                {orderData?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(orderData.created_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Auto-refresh info for pending payments */}
            {paymentStatus === 'pending' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 text-sm">
                  ⏱️ Auto-refreshing every 10 seconds...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {paymentStatus === 'success_payment' && (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              )}

              {paymentStatus === 'failed_payment' && (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/dashboard/subscription">Try Again</Link>
                </Button>
              )}

              {(paymentStatus === 'pending' || paymentStatus === 'failed_payment') && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => checkPaymentStatus(true)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/subscription">Back to Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}