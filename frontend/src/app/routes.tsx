import { useEffect } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router";
import { Navigation } from "./components/Navigation";
import Home from "./pages/Home";
import Stylist from "./pages/Stylist";
import TryOn from "./pages/TryOn";
import Product from "./pages/Product";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

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
      <Outlet />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-4">
          404
        </p>
        <h1 className="font-serif text-stone-900" style={{ fontSize: "2rem", fontWeight: 400 }}>
          Страница не найдена
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
      { path: "sign-in/*", Component: SignIn },
      { path: "sign-up/*", Component: SignUp },
      { path: "*", Component: NotFound },
    ],
  },
]);
