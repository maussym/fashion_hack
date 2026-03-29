import { Link } from "react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useT } from "../lib/i18n";
import { AuthButton } from "./AuthButton";

interface NavLink {
  to: string;
  label: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  pathname: string;
  wishlistCount: number;
  cartCount: number;
  onClose: () => void;
}

export function MobileMenu({ navLinks, pathname, wishlistCount, cartCount, onClose }: MobileMenuProps) {
  const t = useT();
  return (
    <div className="md:hidden fixed inset-0 top-14 bg-white z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col h-full">
        <div className="flex-1 px-6 py-8 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`block text-2xl font-serif py-3 transition-colors ${pathname === link.to ? "text-stone-900" : "text-stone-400"}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-stone-100 pt-6 mt-6 space-y-4">
            <Link to="/wishlist" onClick={onClose} className="flex items-center gap-3 text-sm text-stone-500">
              <Heart size={16} />
              {t("nav.favorites")}
              {wishlistCount > 0 && (
                <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">{wishlistCount}</span>
              )}
            </Link>
            <Link to="/cart" onClick={onClose} className="flex items-center gap-3 text-sm text-stone-500">
              <ShoppingBag size={16} />
              {t("nav.cart")}
              {cartCount > 0 && (
                <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </Link>
            <AuthButton mobile />
          </div>
        </div>
      </div>
    </div>
  );
}
