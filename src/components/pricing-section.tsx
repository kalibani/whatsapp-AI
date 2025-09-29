"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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

export function PricingSection() {
  const { packages, loading, error } = usePackages();
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

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600">Error loading pricing: {error}</p>
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
