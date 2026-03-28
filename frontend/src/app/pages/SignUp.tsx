import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

export default function SignUp() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <ClerkSignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-stone-200",
            headerTitle: "font-serif font-normal",
            headerSubtitle: "font-sans text-stone-500",
            formButtonPrimary: "bg-stone-900 hover:bg-stone-800 text-xs uppercase tracking-widest",
            footerActionLink: "text-stone-900 hover:text-stone-700",
          },
        }}
      />
    </main>
  );
}
