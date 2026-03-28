import { resolveAssetUrl } from "../lib/api";
import { CatalogItem } from "../lib/types";

interface Props {
  product: CatalogItem;
  images: string[];
  activeImage: number;
  setActiveImage: (i: number) => void;
}

export function ProductGallery({ product, images, activeImage, setActiveImage }: Props) {
  return (
    <div className="flex gap-0.5 sm:gap-1">
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-0.5 sm:gap-1 w-16 sm:w-20 shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`aspect-[3/4] overflow-hidden border-b-2 transition-colors ${
                activeImage === i ? "border-stone-900" : "border-transparent"
              }`}
            >
              <img src={resolveAssetUrl(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 aspect-[3/4] overflow-hidden relative">
        <img
          src={resolveAssetUrl(images[activeImage])}
          alt={product.name_ru}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2.5 py-1.5">
          <div
            className="w-3 h-3 rounded-full border border-stone-200"
            style={{ backgroundColor: product.color.hex }}
          />
          <span className="text-[10px] sm:text-xs text-stone-600 font-sans">{product.color.name_ru}</span>
        </div>

        {images.length > 1 && (
          <div className="sm:hidden absolute bottom-3 right-3 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeImage === i ? "bg-stone-900" : "bg-stone-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
