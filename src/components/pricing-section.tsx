"use client";

import { useState } from "react";
import {
  Check,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePackages } from "@/hooks/use-packages";
import { useCurrentSubscription } from "@/hooks/use-current-subscription";
import {
  formatPrice,
  getAnnualPrice,
  getAnnualMonthlyDisplay,
} from "@/lib/format-price";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { getClientKeyFromCookie } from "@/lib/auth-utils";

export function PricingSection() {
  const { packages, loading, error, errorStatus } = usePackages();
  const { subscription: currentSubscription, loading: subscriptionLoading } =
    useCurrentSubscription();
  const { isSignedIn, isLoaded } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const router = useRouter();

  const handleSelectPackage = (pkg: any) => {
    const isCustomPrice =
      parseFloat(pkg.price) <= 0 || isNaN(parseFloat(pkg.price));

    if (isCustomPrice) {
      // For custom pricing, could redirect to contact page or handle differently
      alert("Please contact our sales team for custom pricing");
      return;
    }

    // Calculate the amount based on billing cycle
    let amount: string;
    if (billingCycle === "annual") {
      // Remove currency formatting to get clean number for annual price
      const monthlyPrice = parseFloat(pkg.price);
      const annualPrice = monthlyPrice * 12 * 0.85; // 15% discount
      amount = annualPrice.toString();
    } else {
      amount = pkg.price;
    }

    // Create query parameters
    const params = new URLSearchParams({
      package_id: pkg.package_id,
      billing: billingCycle,
      amount: amount,
    });

    // Check if user is authenticated
    if (isLoaded && isSignedIn) {
      // User is authenticated, go to regular checkout
      router.push(`/checkout?${params.toString()}`);
    } else {
      // User is not authenticated, go to register + subscribe flow
      router.push(`/register-subscribe?${params.toString()}`);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mx-auto mb-8"></div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const clientKey = getClientKeyFromCookie();

  if (error) {
    // Check if it's a 401 error (reseller access required)
    const is401Error = errorStatus === 401 && !clientKey;

    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card
            className={
              is401Error
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                : "border-red-200 bg-red-50"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {is401Error ? (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              <CardTitle
                className={`text-center text-2xl ${
                  is401Error ? "text-blue-900" : "text-red-900"
                }`}
              >
                {is401Error
                  ? "Reseller Access Required"
                  : "Error Loading Pricing"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {is401Error ? (
                <div className="space-y-4 text-center">
                  <p className="text-blue-800">
                    This subscription page is exclusively for BerryLabs Reseller
                    Partners. Join our Partner Program to access reseller
                    pricing and features.
                  </p>
                  <div className="bg-white border border-blue-200 rounded-lg p-4 text-left">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      💰 Benefits of Becoming a Reseller Partner:
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          Access to special reseller pricing and margins
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Earn commissions on client subscriptions</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          White-label AI agent solutions for your clients
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Priority support and technical resources</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Marketing and sales enablement tools</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button
                      size="lg"
                      onClick={() =>
                        window.open(
                          "https://berrylabs.io/mitra/daftar",
                          "_blank"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply for Partnership
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "https://docs.berrylabs.io/docs/api/wa-agent/authentication#reseller-authentication",
                          "_blank"
                        )
                      }
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-red-700">Error loading pricing: {error}</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => router.push("/dashboard")}
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your business needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "annual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annual
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  Save 15%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => {
            const isCustomPrice =
              parseFloat(pkg.price) <= 0 || isNaN(parseFloat(pkg.price));
            const isPopular = pkg.package_name.toLowerCase() === "pro"; // Make Pro the popular option
            const isCurrentPackage =
              currentSubscription?.packageId === pkg.package_id;

            let displayPrice: string;
            let billingText: string = "";

            if (isCustomPrice) {
              displayPrice = "Custom";
            } else if (billingCycle === "annual") {
              displayPrice = getAnnualMonthlyDisplay(pkg.price);
              billingText = `Billed annually (${getAnnualPrice(pkg.price)})`;
            } else {
              displayPrice = formatPrice(pkg.price);
              billingText = "/month";
            }

            return (
              <Card
                key={pkg.package_id}
                className={`border-2 relative ${
                  isCurrentPackage
                    ? "border-green-500 bg-green-50"
                    : isPopular
                    ? "border-blue-500"
                    : "border-gray-200"
                }`}
              >
                {isCurrentPackage && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                    Current Plan
                  </Badge>
                )}
                {!isCurrentPackage && isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pkg.package_name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {displayPrice}
                    {!isCustomPrice && (
                      <span className="text-lg text-gray-500">
                        {billingCycle === "annual" ? "/month" : "/month"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "annual" && !isCustomPrice && (
                    <div className="text-sm text-gray-500">{billingText}</div>
                  )}
                  <CardDescription className="whitespace-pre-line">
                    {pkg.description.trim()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={
                      isCurrentPackage
                        ? "secondary"
                        : isPopular
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleSelectPackage(pkg)}
                    disabled={isCurrentPackage}
                  >
                    {isCurrentPackage
                      ? "Current Plan"
                      : isCustomPrice
                      ? "Contact Sales"
                      : isLoaded && isSignedIn
                      ? "Get Started"
                      : "Sign Up & Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
