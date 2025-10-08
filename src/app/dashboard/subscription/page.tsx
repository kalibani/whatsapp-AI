import { PricingSection } from "@/components/pricing-section";
import { ClientKeyGuard } from "@/components/client-key-guard";

import { getClientKeyFromCookie } from "@/lib/auth-utils";

export default function SubscriptionPage() {
  const clientKey = getClientKeyFromCookie();
  return (
    <ClientKeyGuard>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-full">
        {/* Header Section */}
        {clientKey && (
          <div className="py-8 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Select the perfect plan for your business needs. Upgrade or
                downgrade anytime.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Section */}
        <PricingSection />
      </div>
    </ClientKeyGuard>
  );
}
