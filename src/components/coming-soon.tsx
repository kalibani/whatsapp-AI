import { ReactNode } from "react";
import { Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-blue-50 rounded-full">
            {icon}
          </div>
        </div>
        
        <Clock className="h-16 w-16 mx-auto text-amber-500 mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          {description}
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <p className="text-sm text-gray-600">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}