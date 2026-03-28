import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { searchCatalog } from "../lib/api";
import { CatalogItem } from "../lib/types";
import { useCartCount, useWishlist } from "../lib/store";
import { AuthButton } from "./AuthButton";
import { SearchOverlay } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";

export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const cartCount = useCartCount();
  const [wishlist] = useWishlist();
  const navLinks = [{ to: "/", label: "Главная" }, { to: "/stylist", label: "AI-стилист" }, { to: "/tryon", label: "Примерка" }];

  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults((await searchCatalog({ q: searchQuery.trim() })).slice(0, 8)); }
      catch { setSearchResults([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => { setSearchOpen(false); setSearchQuery(""); setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, searchOpen]);

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo-avishu.png" alt="AVISHU" className="h-5 sm:h-6 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className={`text-xs uppercase tracking-widest transition-colors ${location.pathname === link.to ? "text-stone-900" : "text-stone-400 hover:text-stone-900"}`}>{link.label}</Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-5">
              <button onClick={() => setSearchOpen(!searchOpen)} className="text-stone-400 hover:text-stone-900 transition-colors p-1" title="Поиск"><Search size={18} /></button>
              <Link to="/wishlist" className="text-stone-400 hover:text-stone-900 transition-colors relative p-1" title="Избранное">
                <Heart size={18} fill={wishlist.length > 0 ? "currentColor" : "none"} />
                {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">{wishlist.length}</span>}
              </Link>
              <Link to="/cart" className="text-stone-400 hover:text-stone-900 transition-colors relative p-1" title="Корзина">
                <ShoppingBag size={18} />
                {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">{cartCount}</span>}
              </Link>
              <AuthButton />
            </div>
            <div className="flex md:hidden items-center gap-3">
              <button onClick={() => setSearchOpen(true)} className="text-stone-500 p-1.5"><Search size={20} /></button>
              <Link to="/wishlist" className="text-stone-500 p-1.5 relative">
                <Heart size={20} fill={wishlist.length > 0 ? "currentColor" : "none"} />
                {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-stone-900 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-sans">{wishlist.length}</span>}
              </Link>
              <button className="text-stone-900 p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
            </div>
          </div>
        </div>
        {mobileOpen && <MobileMenu navLinks={navLinks} pathname={location.pathname} wishlistCount={wishlist.length} cartCount={cartCount} onClose={() => setMobileOpen(false)} />}
      </nav>
      {searchOpen && <SearchOverlay searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} searching={searching} onClose={closeSearch} />}
    </>
  );
}
