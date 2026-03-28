import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

export default function SignIn() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <ClerkSignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
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
