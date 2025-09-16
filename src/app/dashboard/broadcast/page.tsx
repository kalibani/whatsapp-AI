import { Radio } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function BroadcastPage() {
  return (
    <ComingSoon
      title="Broadcast Messaging"
      description="Send targeted messages to thousands of contacts at once with advanced broadcasting tools."
      icon={<Radio className="h-16 w-16 text-blue-600" />}
    />
  );
}