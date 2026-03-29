import { formatPrice } from "../lib/fashion";
import { clearCart } from "../lib/store";
import { useT } from "../lib/i18n";
import { toast } from "sonner";

interface CartSummaryProps {
  totalPrice: number;
}

export default function CartSummary({ totalPrice }: CartSummaryProps) {
  const t = useT();
  return (
    <div className="mt-8 sm:mt-12 border-t border-stone-900 pt-6 sm:pt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-sm text-stone-500">{t("cart.total")}</p>
        <p className="font-serif text-xl sm:text-2xl text-stone-900" style={{ fontWeight: 400 }}>
          {formatPrice(totalPrice)}
        </p>
      </div>

      <button
        onClick={() => toast.success(t("cart.ordered"))}
        className="w-full bg-stone-900 text-white text-xs uppercase tracking-widest py-4 hover:bg-stone-800 transition-colors"
      >
        {t("cart.checkout")}
      </button>

      <button
        onClick={() => {
          clearCart();
          toast(t("cart.cleared"));
        }}
        className="w-full mt-3 border border-stone-200 text-stone-400 text-xs uppercase tracking-widest py-3.5 hover:border-stone-900 hover:text-stone-900 transition-colors"
      >
        {t("cart.clear")}
      </button>
    </div>
  );
}
