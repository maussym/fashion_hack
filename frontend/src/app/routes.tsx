import { useEffect } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router";
import { Navigation } from "./components/Navigation";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { useT } from "./lib/i18n";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Stylist from "./pages/Stylist";
import TryOn from "./pages/TryOn";
import Product from "./pages/Product";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import SizeChart from "./pages/SizeChart";
import Privacy from "./pages/Privacy";
import Offer from "./pages/Offer";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Root() {
  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      <Navigation />
      <div className="h-14 sm:h-16" />
      <Outlet />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

function NotFound() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-4">
          404
        </p>
        <h1 className="font-serif text-stone-900" style={{ fontSize: "2rem", fontWeight: 400 }}>
          {t("notfound")}
        </h1>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "stylist", Component: Stylist },
      { path: "tryon", Component: TryOn },
      { path: "product/:id", Component: Product },
      { path: "wishlist", Component: Wishlist },
      { path: "cart", Component: Cart },
      { path: "about", Component: About },
      { path: "sizes", Component: SizeChart },
      { path: "privacy", Component: Privacy },
      { path: "offer", Component: Offer },
      { path: "sign-in/*", Component: SignIn },
      { path: "sign-up/*", Component: SignUp },
      { path: "*", Component: NotFound },
    ],
  },
]);
