"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { clientApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { setClientKeyCookie } from "@/lib/auth-utils";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

type PaymentStatus =
  | "success_payment"
  | "pending"
  | "failed_payment"
  | "loading";

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

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading");
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromRegister, setIsFromRegister] = useState(false);
  const [isSettingUpClientKey, setIsSettingUpClientKey] = useState(false);
  const [clientKeySetupComplete, setClientKeySetupComplete] = useState(false);

  const orderId = searchParams.get("order_id");
  const plan = searchParams.get("plan");
  const fromParam = searchParams.get("from");
  const accessId = searchParams.get("access_id");

  // Check if this is coming from registration flow
  useEffect(() => {
    if (fromParam === "register_subscribe") {
      setIsFromRegister(true);
    }
  }, [fromParam]);

  // Handle access_id parameter to fetch and set client_key
  useEffect(() => {
    const setupClientKeyFromAccessId = async () => {
      if (!accessId) {
        // No access_id means regular flow, mark as complete
        setClientKeySetupComplete(true);
        return;
      }

      if (!user) return;

      setIsSettingUpClientKey(true);
      try {
        console.log("Setting up client key from access_id:", accessId);

        // Get client key from access_id
        const response = await clientApi.getClientKey(accessId);
        if (response?.data?.client_key) {
          // Set client key in cookies
          setClientKeyCookie(response.data.client_key);

          // Update user's clientKey in database
          await updateUserClientKey(
            user.id,
            response.data.client_key,
            response.data.user_id
          );

          console.log("Client key set successfully from access_id");
          toast.success("Account setup completed!");
          setClientKeySetupComplete(true);
        } else {
          console.error("No client_key found in response");
          setError("Failed to setup account access");
        }
      } catch (error) {
        console.error("Error fetching client key:", error);
        setError("Failed to setup account access");
        toast.error("Failed to setup account access");
      } finally {
        setIsSettingUpClientKey(false);
      }
    };

    setupClientKeyFromAccessId();
  }, [accessId, user]);

  const updateUserClientKey = async (
    clerkId: string,
    clientKey: string,
    berryLabsUserId: string
  ) => {
    try {
      const response = await fetch("/api/users/update-client-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId,
          clientKey,
          berryLabsUserId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user client key");
      }

      return response.json();
    } catch (error) {
      console.error("Error updating user client key:", error);
      throw error;
    }
  };

  const saveOrderToDatabase = async (orderData: any) => {
    try {
      const response = await fetch("/api/orders/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to save order to database");
      }

      const result = await response.json();
      console.log("Order saved successfully:", result);
    } catch (error) {
      console.error("Error saving order to database:", error);
      // Don't throw error here to avoid disrupting the payment status check
    }
  };

  const handlePostPaymentRegistration = async () => {
    try {
      // Get stored registration data
      const pendingData = localStorage.getItem("pendingRegistration");
      if (!pendingData) {
        console.log("No pending registration data found");
        return;
      }

      const registrationData = JSON.parse(pendingData);

      // Redirect to complete registration page
      router.push("/complete-registration");
    } catch (error) {
      console.error("Error handling post-payment registration:", error);
    }
  };

  const checkPaymentStatus = async (showRefreshLoader = false) => {
    if (!orderId) {
      setError("Order ID is missing");
      setPaymentStatus("failed_payment");
      return;
    }

    if (showRefreshLoader) {
      setIsRefreshing(true);
    } else {
      setPaymentStatus("loading");
    }

    try {
      const response: OrderStatusResponse = await clientApi.getOrderStatus(
        orderId
      );

      if (response?.data?.status && response.data) {
        setPaymentStatus(response.data.status);
        setOrderData(response.data);
        setError(null);

        // Save order data to database if payment is successful
        if (response.data.status === "success_payment") {
          await saveOrderToDatabase(response.data);

          // Handle registration flow after successful payment
          if (isFromRegister) {
            await handlePostPaymentRegistration();
          }
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check payment status"
      );
      setPaymentStatus("failed_payment");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial payment status check - wait for client key setup if needed
  useEffect(() => {
    // Only start checking payment status if:
    // 1. We have orderId
    // 2. Either no access_id OR client key setup is complete
    if (orderId && (!accessId || clientKeySetupComplete)) {
      checkPaymentStatus();
    }
  }, [orderId, accessId, clientKeySetupComplete]);

  // Auto-refresh for pending payments
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStatus === "pending") {
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
      case "success_payment":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "pending":
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case "failed_payment":
        return <XCircle className="w-16 h-16 text-red-500" />;
      case "loading":
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "success_payment":
        return <Badge className="bg-green-500">Success</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "failed_payment":
        return <Badge className="bg-red-500">Failed</Badge>;
      case "loading":
        return <Badge className="bg-blue-500">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: PaymentStatus) => {
    switch (status) {
      case "success_payment":
        return {
          title: "Payment Successful!",
          description:
            "Your subscription has been activated successfully. You can now access all features.",
        };
      case "pending":
        return {
          title: "Payment Pending",
          description:
            "Your payment is being processed. This may take a few minutes. We'll refresh automatically.",
        };
      case "failed_payment":
        return {
          title: "Payment Failed",
          description:
            "There was an issue with your payment. Please try again or contact support.",
        };
      case "loading":
        return {
          title: "Checking Payment Status",
          description: "Please wait while we verify your payment...",
        };
      default:
        return {
          title: "Unknown Status",
          description: "Unable to determine payment status.",
        };
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Request
          </h1>
          <p className="text-gray-600 mb-8">
            Order ID is missing from the URL.
          </p>
          <Button asChild>
            <Link href="/dashboard/subscription">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while setting up client key
  if (accessId && isSettingUpClientKey) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Setting up your account
              </h1>
              <p className="text-gray-600">
                Please wait while we configure your account access...
              </p>
            </CardContent>
          </Card>
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
                    <span>
                      {new Date(orderData.created_at).toLocaleString()}
                    </span>
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
            {paymentStatus === "pending" && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 text-sm">
                  ⏱️ Auto-refreshing every 10 seconds...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {paymentStatus === "success_payment" && (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              )}

              {paymentStatus === "failed_payment" && (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/dashboard/subscription">Try Again</Link>
                </Button>
              )}

              {(paymentStatus === "pending" ||
                paymentStatus === "failed_payment") && (
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

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
