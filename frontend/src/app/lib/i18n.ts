import { useCallback, useSyncExternalStore } from "react";

export type Lang = "ru" | "kz" | "en";

let currentLang: Lang = (localStorage.getItem("avishu_lang") as Lang) || "ru";
const listeners = new Set<() => void>();

function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("avishu_lang", lang);
  listeners.forEach((l) => l());
}

function subscribeLang(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getLang() { return currentLang; }

export function useI18n() {
  const lang = useSyncExternalStore(subscribeLang, getLang);
  return { lang, setLang };
}

const translations: Record<string, Record<Lang, string>> = {
  "nav.home": { ru: "Главная", kz: "Басты", en: "Home" },
  "nav.stylist": { ru: "AI-стилист", kz: "AI-стилист", en: "AI Stylist" },
  "nav.tryon": { ru: "Примерка", kz: "Киіп көру", en: "Try-On" },
  "nav.search": { ru: "Поиск", kz: "Іздеу", en: "Search" },
  "nav.favorites": { ru: "Избранное", kz: "Таңдаулылар", en: "Favorites" },
  "nav.cart": { ru: "Корзина", kz: "Себет", en: "Cart" },
  "nav.signin": { ru: "Войти", kz: "Кіру", en: "Sign In" },

  "hero.subtitle": { ru: "Clothing Manufacturer · 2015", kz: "Clothing Manufacturer · 2015", en: "Clothing Manufacturer · 2015" },
  "hero.title1": { ru: "AI-стилист", kz: "AI-стилист", en: "AI Stylist" },
  "hero.title2": { ru: "и виртуальная", kz: "және виртуалды", en: "& Virtual" },
  "hero.title3": { ru: "примерка", kz: "киіп көру", en: "Try-On" },
  "hero.desc": { ru: "Собирайте готовые комплекты, примеряйте на себе и покупайте уверенно.", kz: "Дайын жиынтықтарды жинаңыз, өзіңізге киіп көріңіз және сенімді сатып алыңыз.", en: "Build complete outfits, try them on yourself, and shop with confidence." },
  "hero.stylist_btn": { ru: "AI-стилист", kz: "AI-стилист", en: "AI Stylist" },
  "hero.tryon_btn": { ru: "Примерить", kz: "Киіп көру", en: "Try On" },

  "catalog.title": { ru: "Каталог", kz: "Каталог", en: "Catalog" },
  "catalog.subtitle": { ru: "Товары для комплектов", kz: "Жиынтыққа арналған тауарлар", en: "Items for Outfits" },

  "outfits.title": { ru: "AI-образы", kz: "AI-бейнелер", en: "AI Outfits" },
  "outfits.subtitle": { ru: "Под конкретный сценарий", kz: "Нақты сценарий үшін", en: "For a Specific Scenario" },
  "outfits.open": { ru: "Открыть стилиста", kz: "Стилистті ашу", en: "Open Stylist" },
  "outfits.loading": { ru: "Подбираем образы…", kz: "Бейнелер жиналуда…", en: "Building outfits…" },
  "outfits.error": { ru: "Проверьте, что backend запущен", kz: "Backend іске қосылғанын тексеріңіз", en: "Check that backend is running" },
  "outfits.empty": { ru: "Для этого сценария пока не найдено комплектов.", kz: "Бұл сценарий үшін жиынтықтар табылмады.", en: "No outfits found for this scenario." },

  "stylist.title": { ru: "Опишите желаемый образ", kz: "Қалаған бейнені сипаттаңыз", en: "Describe Your Desired Look" },
  "stylist.placeholder": { ru: "Например: повседневный образ для девушки на весну", kz: "Мысалы: қызға арналған көктемгі күнделікті бейне", en: "E.g.: casual spring look for a woman" },
  "stylist.loading": { ru: "Подбираем образ…", kz: "Бейне жиналуда…", en: "Building outfit…" },
  "stylist.error": { ru: "Не удалось подобрать образ", kz: "Бейнені жинау мүмкін болмады", en: "Failed to build outfit" },
  "stylist.service_error": { ru: "Убедитесь что AI Stylist сервис запущен.", kz: "AI Stylist сервисі іске қосылғанын тексеріңіз.", en: "Make sure AI Stylist service is running." },
  "stylist.hint": { ru: "Опишите желаемый образ или выберите подсказку", kz: "Қалаған бейнені сипаттаңыз немесе кеңесті таңдаңыз", en: "Describe your desired look or pick a suggestion" },
  "stylist.s1": { ru: "повседневный образ для девушки", kz: "қызға арналған күнделікті бейне", en: "casual look for a woman" },
  "stylist.s2": { ru: "деловой стиль для мужчины", kz: "ер адамға арналған іскерлік стиль", en: "business style for a man" },
  "stylist.s3": { ru: "спортивный лук на выходные", kz: "демалыс күнге спорттық бейне", en: "sporty weekend look" },
  "stylist.s4": { ru: "вечерний образ на мероприятие", kz: "іс-шараға арналған кешкі бейне", en: "evening look for an event" },

  "tryon.subtitle": { ru: "Virtual Try-On", kz: "Virtual Try-On", en: "Virtual Try-On" },
  "tryon.title": { ru: "Примерьте на фото", kz: "Фотода киіп көріңіз", en: "Try On Your Photo" },
  "tryon.desc": { ru: "Загрузите фото в полный рост. AI определит силуэт и наложит одежду с учетом пропорций.", kz: "Толық бойлы фото жүктеңіз. AI силуэтті анықтап, пропорцияны ескере отырып киім салады.", en: "Upload a full-body photo. AI will detect your silhouette and overlay clothing with proper proportions." },
  "tryon.single": { ru: "Одна вещь", kz: "Бір зат", en: "Single Item" },
  "tryon.outfit": { ru: "Образ", kz: "Бейне", en: "Outfit" },
  "tryon.run": { ru: "Запустить примерку", kz: "Киіп көруді бастау", en: "Run Try-On" },
  "tryon.processing": { ru: "Обрабатываем…", kz: "Өңделуде…", en: "Processing…" },
  "tryon.reset": { ru: "Начать заново", kz: "Қайта бастау", en: "Start Over" },
  "tryon.result": { ru: "Результат AI", kz: "AI нәтижесі", en: "AI Result" },
  "tryon.trying": { ru: "Примеряем…", kz: "Киіп көруде…", en: "Trying on…" },
  "tryon.result_label": { ru: "Результат", kz: "Нәтиже", en: "Result" },
  "tryon.will_appear": { ru: "появится здесь", kz: "мұнда пайда болады", en: "will appear here" },
  "tryon.your_photo": { ru: "Ваше фото", kz: "Сіздің фото", en: "Your Photo" },
  "tryon.upload": { ru: "Загрузите фото", kz: "Фото жүктеңіз", en: "Upload Photo" },
  "tryon.fullbody": { ru: "в полный рост", kz: "толық бойлы", en: "full body" },
  "tryon.tips_title": { ru: "Для лучшего результата", kz: "Жақсы нәтиже үшін", en: "For Best Results" },
  "tryon.tip1": { ru: "Фото в полный рост, хорошее освещение", kz: "Толық бойлы фото, жақсы жарық", en: "Full-body photo, good lighting" },
  "tryon.tip2": { ru: "Стойте лицом к камере, не слишком объемная одежда", kz: "Камераға бетпе-бет тұрыңыз, тым көлемді емес киім", en: "Face the camera, not too bulky clothing" },
  "tryon.tip3": { ru: "Нейтральный фон для точного определения силуэта", kz: "Силуэтті дәл анықтау үшін бейтарап фон", en: "Neutral background for accurate silhouette detection" },
  "tryon.catalog_error": { ru: "Не удалось загрузить каталог", kz: "Каталогты жүктеу мүмкін болмады", en: "Failed to load catalog" },
  "tryon.error": { ru: "Не удалось выполнить примерку", kz: "Киіп көруді орындау мүмкін болмады", en: "Try-on failed" },

  "product.not_found": { ru: "Товар не найден", kz: "Тауар табылмады", en: "Product Not Found" },
  "product.to_home": { ru: "На главную", kz: "Басты бетке", en: "Go Home" },
  "product.loading": { ru: "Загружаем…", kz: "Жүктелуде…", en: "Loading…" },
  "product.load_error": { ru: "Не удалось загрузить товар", kz: "Тауарды жүктеу мүмкін болмады", en: "Failed to load product" },
  "product.added_cart": { ru: "Добавлено в корзину", kz: "Себетке қосылды", en: "Added to cart" },
  "product.added_fav": { ru: "Добавлено в избранное", kz: "Таңдаулыларға қосылды", en: "Added to favorites" },
  "product.removed_fav": { ru: "Удалено из избранного", kz: "Таңдаулылардан жойылды", en: "Removed from favorites" },
  "product.size": { ru: "Размер", kz: "Өлшем", en: "Size" },
  "product.choose_size": { ru: "Выберите размер", kz: "Өлшемді таңдаңыз", en: "Choose Size" },
  "product.details": { ru: "Детали", kz: "Мәліметтер", en: "Details" },
  "product.added": { ru: "Добавлено", kz: "Қосылды", en: "Added" },
  "product.add_cart": { ru: "В корзину", kz: "Себетке", en: "Add to Cart" },
  "product.in_fav": { ru: "В избранном", kz: "Таңдаулыларда", en: "In Favorites" },
  "product.to_fav": { ru: "В избранное", kz: "Таңдаулыларға", en: "To Favorites" },
  "product.try_virtual": { ru: "Примерить виртуально", kz: "Виртуалды киіп көру", en: "Virtual Try-On" },
  "product.recommendations": { ru: "Рекомендации", kz: "Ұсыныстар", en: "Recommendations" },
  "product.worn_with": { ru: "С этим носят", kz: "Бұнымен киеді", en: "Worn With" },
  "product.build_outfit": { ru: "Собери образ", kz: "Бейне жина", en: "Build Outfit" },
  "product.outfits": { ru: "Образы", kz: "Бейнелер", en: "Outfits" },
  "product.how_to_wear": { ru: "Как это носить", kz: "Қалай кию керек", en: "How to Wear" },
  "product.similar": { ru: "Похожие", kz: "Ұқсас", en: "Similar" },
  "product.you_may_like": { ru: "Вам может понравиться", kz: "Сізге ұнауы мүмкін", en: "You May Like" },
  "product.removed_cart": { ru: "Товар удалён из корзины", kz: "Тауар себеттен жойылды", en: "Removed from cart" },

  "cart.title": { ru: "Корзина", kz: "Себет", en: "Cart" },
  "cart.subtitle": { ru: "Ваши товары", kz: "Сіздің тауарлар", en: "Your Items" },
  "cart.empty": { ru: "Корзина пуста", kz: "Себет бос", en: "Cart is Empty" },
  "cart.add_items": { ru: "Добавьте товары из каталога", kz: "Каталогтан тауарлар қосыңыз", en: "Add items from catalog" },
  "cart.to_catalog": { ru: "В каталог", kz: "Каталогқа", en: "Go to Catalog" },
  "cart.total": { ru: "Итого", kz: "Барлығы", en: "Total" },
  "cart.checkout": { ru: "Оформить заказ", kz: "Тапсырыс беру", en: "Checkout" },
  "cart.ordered": { ru: "Заказ оформлен! (демо)", kz: "Тапсырыс берілді! (демо)", en: "Order placed! (demo)" },
  "cart.cleared": { ru: "Корзина очищена", kz: "Себет тазартылды", en: "Cart cleared" },
  "cart.clear": { ru: "Очистить корзину", kz: "Себетті тазарту", en: "Clear Cart" },

  "wishlist.title": { ru: "Избранное", kz: "Таңдаулылар", en: "Favorites" },
  "wishlist.subtitle": { ru: "Сохраненные вещи", kz: "Сақталған заттар", en: "Saved Items" },
  "wishlist.empty": { ru: "Вы пока ничего не сохранили", kz: "Сіз әлі ештеңе сақтаған жоқсыз", en: "You haven't saved anything yet" },
  "wishlist.hint": { ru: "Нажмите на сердечко, чтобы добавить", kz: "Қосу үшін жүрекшені басыңыз", en: "Click the heart to add" },

  "search.placeholder": { ru: "Найти товар, бренд, цвет…", kz: "Тауар, бренд, түс табу…", en: "Find product, brand, color…" },
  "search.searching": { ru: "Ищем…", kz: "Ізделуде…", en: "Searching…" },
  "search.empty": { ru: "Ничего не найдено", kz: "Ештеңе табылмады", en: "Nothing found" },
  "search.hint": { ru: "Начните вводить название товара, бренд или цвет", kz: "Тауар атауын, брендті немесе түсті теріңіз", en: "Start typing product name, brand or color" },

  "tryon_banner.title1": { ru: "Посмотрите,", kz: "Қараңыз,", en: "See" },
  "tryon_banner.title2": { ru: "как вещь сидит", kz: "зат қалай отырады", en: "how it fits" },
  "tryon_banner.title3": { ru: "именно на вас.", kz: "дәл сізге.", en: "on you." },
  "tryon_banner.desc": { ru: "Загрузите фото и получите 2D-примерку прямо в браузере.", kz: "Фото жүктеңіз және браузерде 2D-киіп көруді алыңыз.", en: "Upload a photo and get a 2D try-on right in your browser." },
  "tryon_banner.btn": { ru: "Запустить примерку", kz: "Киіп көруді бастау", en: "Start Try-On" },

  "notfound": { ru: "Страница не найдена", kz: "Бет табылмады", en: "Page Not Found" },

  "footer.catalog": { ru: "Каталог", kz: "Каталог", en: "Catalog" },
  "footer.products": { ru: "Товары", kz: "Тауарлар", en: "Products" },
  "footer.ai_outfits": { ru: "AI-образы", kz: "AI-бейнелер", en: "AI Outfits" },
  "footer.stylist": { ru: "Стилист", kz: "Стилист", en: "Stylist" },
  "footer.tryon": { ru: "Примерка", kz: "Киіп көру", en: "Try-On" },
  "footer.account": { ru: "Аккаунт", kz: "Аккаунт", en: "Account" },
  "footer.favorites": { ru: "Избранное", kz: "Таңдаулылар", en: "Favorites" },
  "footer.desc": { ru: "Бренд комфортной женской одежды для жизни, дома и отдыха. С 2015 года.", kz: "Өмір, үй және демалысқа арналған ыңғайлы әйелдер киімі бренді. 2015 жылдан.", en: "Comfortable women's clothing brand for life, home and leisure. Since 2015." },

  "cat.top": { ru: "Верх", kz: "Жоғарғы", en: "Top" },
  "cat.bottom": { ru: "Низ", kz: "Төменгі", en: "Bottom" },
  "cat.shoes": { ru: "Обувь", kz: "Аяқ киім", en: "Shoes" },
  "cat.accessory": { ru: "Аксессуар", kz: "Аксессуар", en: "Accessory" },
  "cat.accessories": { ru: "Аксессуары", kz: "Аксессуарлар", en: "Accessories" },
  "cat.all": { ru: "Все", kz: "Барлығы", en: "All" },

  "gender.male": { ru: "Мужской", kz: "Ер", en: "Male" },
  "gender.female": { ru: "Женский", kz: "Әйел", en: "Female" },
  "gender.unisex": { ru: "Унисекс", kz: "Унисекс", en: "Unisex" },

  "season.spring": { ru: "Весна", kz: "Көктем", en: "Spring" },
  "season.summer": { ru: "Лето", kz: "Жаз", en: "Summer" },
  "season.autumn": { ru: "Осень", kz: "Күз", en: "Autumn" },
  "season.winter": { ru: "Зима", kz: "Қыс", en: "Winter" },

  "scenario.work": { ru: "Для работы", kz: "Жұмысқа", en: "For Work" },
  "scenario.rest": { ru: "Для отдыха", kz: "Демалысқа", en: "For Leisure" },
  "scenario.travel": { ru: "Для поездки", kz: "Сапарға", en: "For Travel" },
  "scenario.date": { ru: "Для свидания", kz: "Кездесуге", en: "For a Date" },
  "scenario.event": { ru: "Для мероприятия", kz: "Іс-шараға", en: "For an Event" },
  "scenario.training": { ru: "Для тренировки", kz: "Жаттығуға", en: "For Training" },

  "outfit.ai_look": { ru: "AI-образ", kz: "AI-бейне", en: "AI Look" },
  "outfit.items": { ru: "вещей", kz: "зат", en: "items" },
  "outfit.try_on": { ru: "Примерить", kz: "Киіп көру", en: "Try On" },
  "outfit.select": { ru: "Выберите товар", kz: "Тауарды таңдаңыз", en: "Select Product" },
  "outfit.selected": { ru: "Выбрано", kz: "Таңдалды", en: "Selected" },

  "remove": { ru: "Убрать", kz: "Жою", en: "Remove" },
  "size_label": { ru: "Размер:", kz: "Өлшем:", en: "Size:" },
  "error.request": { ru: "Ошибка запроса", kz: "Сұрау қатесі", en: "Request error" },
  "error.tryon": { ru: "Ошибка примерки", kz: "Киіп көру қатесі", en: "Try-on error" },
  "error.cloth": { ru: "Не удалось загрузить изображение одежды", kz: "Киім суретін жүктеу мүмкін болмады", en: "Failed to load clothing image" },
};

export function t(key: string): string {
  return translations[key]?.[currentLang] ?? translations[key]?.["ru"] ?? key;
}

export function useT() {
  const lang = useSyncExternalStore(subscribeLang, getLang);
  return useCallback((key: string) => translations[key]?.[lang] ?? translations[key]?.["ru"] ?? key, [lang]);
}
