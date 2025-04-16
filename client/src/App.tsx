import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ExtensionPopup from "@/components/ExtensionPopup";

// Chrome extension API type definition
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        id?: string;
      };
    };
  }
}

// Check if we're in a browser extension environment
const isExtension = () => {
  return window.location.pathname.includes("popup.html") || 
         (window.chrome?.runtime?.id !== undefined);
};

function Router() {
  const [location] = useLocation();
  
  // If this is the extension popup, redirect to the extension component
  if (isExtension()) {
    return <ExtensionPopup />;
  }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
