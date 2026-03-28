import { ClerkProvider } from "@clerk/clerk-react";
import { ruRU } from "@clerk/localizations";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { SplashScreen } from "./components/SplashScreen";
import { router } from "./routes";

const clerkKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  const toaster = (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",
          borderRadius: "0",
          border: "1px solid #e7e5e4",
        },
      }}
    />
  );

  const content = (
    <SplashScreen>
      <RouterProvider router={router} />
      {toaster}
    </SplashScreen>
  );

  if (!clerkKey) return content;

  return (
    <ClerkProvider publishableKey={clerkKey} localization={ruRU}>
      {content}
    </ClerkProvider>
  );
}
