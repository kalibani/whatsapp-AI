import { Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact Management"
      description="Organize and manage all your WhatsApp contacts efficiently with advanced tools."
      icon={<Users className="h-16 w-16 text-blue-600" />}
    />
  );
}