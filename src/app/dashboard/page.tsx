import AgentsTable from "@/components/agents-table";
import { ClientKeyGuard } from "@/components/client-key-guard";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <ClientKeyGuard>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI Chatbot Management
            </h2>
            <p className="text-gray-600">
              Manage your WhatsApp AI agents and chatbots from the
              <Link
                href="https://docs.berrylabs.io/docs/api/wa-agent/agents/list-agents/"
                className="text-blue-400 ml-1"
              >
                BerryLabs API
              </Link>
            </p>
          </div>

          {/* Agents Table */}
          <AgentsTable />
        </div>
      </div>
    </ClientKeyGuard>
  );
}