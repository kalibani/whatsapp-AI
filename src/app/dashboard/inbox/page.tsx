import { Inbox } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function InboxPage() {
  return (
    <ComingSoon
      title="Inbox Management"
      description="A powerful inbox system to manage all your WhatsApp conversations in one place."
      icon={<Inbox className="h-16 w-16 text-blue-600" />}
    />
  );
}