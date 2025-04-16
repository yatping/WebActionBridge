import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// Type definition for the Chrome browser extension API
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        id?: string;
      };
    };
  }
}

export default function NotFound() {
  const [_, setLocation] = useLocation();
  
  // Check if we're in an extension environment
  const isExtensionEnvironment = window.location.pathname.includes("popup.html") || 
    (window.chrome?.runtime?.id !== undefined);
  
  // Event handlers to navigate  
  const handleGoHome = () => {
    setLocation('/');
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 text-center">
            {isExtensionEnvironment 
              ? "This URL is not available in the extension. Please go back to the extension popup."
              : "The page you requested could not be found. It might have been removed or you might have mistyped the URL."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pb-6">
          <Button onClick={handleGoHome}>
            Go to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
