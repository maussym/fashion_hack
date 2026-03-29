import { Link } from "react-router";
import { User } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useT } from "../lib/i18n";

const clerkKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_CLERK_PUBLISHABLE_KEY;

function AuthButtonInner({ mobile }: { mobile?: boolean }) {
  const { isSignedIn } = useUser();
  const t = useT();

  if (isSignedIn) {
    return (
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-7 h-7",
          },
        }}
      />
    );
  }

  if (mobile) {
    return (
      <Link
        to="/sign-in"
        className="flex items-center gap-3 text-sm text-stone-500"
      >
        <User size={16} />
        {t("nav.signin")}
      </Link>
    );
  }

  return (
    <Link
      to="/sign-in"
      className="text-stone-400 hover:text-stone-900 transition-colors p-1"
      title={t("nav.signin")}
    >
      <User size={18} />
    </Link>
  );
}

export function AuthButton({ mobile }: { mobile?: boolean }) {
  if (!clerkKey) return null;
  return <AuthButtonInner mobile={mobile} />;
}
