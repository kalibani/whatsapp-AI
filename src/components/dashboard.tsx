"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Bot,
  ExternalLink,
  Cherry,
  Inbox,
  Radio,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserProfile } from "@/components/user-profile";
import AgentsTable from "@/components/agents-table";
import Link from "next/link";

const sidebarItems = [
  { icon: Bot, label: "AI Chatbot", href: "/" },
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: Radio, label: "Broadcast", href: "/broadcast" },
  { icon: Users, label: "Contact", href: "/contact" },
  { icon: CreditCard, label: "Subscription", href: "/subscription" },
];

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/">
          <h2 className="text-lg font-semibold cursor-pointer">WhatsApp AI</h2>
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Powered by BerryLabs */}
      <div className="border-t border-gray-200 px-4 py-4">
        <a
          href="https://berrylabs.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors group"
        >
          <Cherry className="h-6 w-6 text-[#FF6B81]" />
          <span>Powered by BerryLabs</span>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <h1 className="ml-4 text-xl font-semibold">AI Chatbot</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search..." className="pl-10 w-64" />
              </div>

              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  3
                </Badge>
              </Button>

              <UserProfile />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
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
        </main>
      </div>
    </div>
  );
}