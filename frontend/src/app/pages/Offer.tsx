export default function Offer() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-2">AVISHU</p>
        <h1 className="font-serif text-stone-900 text-3xl sm:text-4xl mb-8" style={{ fontWeight: 300 }}>
          Публичный договор-оферта
        </h1>
        <div className="font-sans text-sm text-stone-500 leading-relaxed space-y-5">
          <p>Настоящий договор является публичной офертой ТОО «AVISHU» (далее — Продавец) и определяет условия приобретения товаров через интернет-магазин avishu.kz.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">1. Общие положения</h2>
          <p>Документ является публичной офертой в соответствии со ст. 447 ГК РК. Договор считается заключенным с момента акцепта оферты Покупателем. Акцептом признается оформление заказа и/или его оплата.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">2. Предмет договора</h2>
          <p>Продавец обязуется передать товар, а Покупатель — принять и оплатить его. Наименование, ассортимент, цена и характеристики указываются на сайте.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">3. Оформление заказа</h2>
          <p>Заказ оформляется на сайте. Покупатель предоставляет: ФИО, адрес доставки, телефон и e-mail. Продавец подтверждает заказ уведомлением.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">4. Цена и оплата</h2>
          <p>Цены указаны в тенге РК. Цена оплаченного товара изменению не подлежит. Способы оплаты указаны на сайте.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">5. Доставка</h2>
          <p>Способы, сроки и стоимость доставки указаны на сайте. При международной доставке таможенные расходы несёт Покупатель.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">6. Возврат товара</h2>
          <p>Возврат надлежащего качества возможен при сохранении товарного вида и упаковки. Товары с индивидуальными свойствами возврату не подлежат.</p>
          <h2 className="font-serif text-stone-900 text-lg mt-8 mb-3">7. Реквизиты</h2>
          <div className="border border-stone-200 p-5">
            <p className="font-medium text-stone-900">ТОО "AVISHU"</p>
            <p className="mt-2">г. Караганда, ул. Ерубаева 31</p>
            <p>БИН: 080940010300</p>
            <p>ИИК: KZ104322203643E00850</p>
            <p>Банк: ДО АО Банк ВТБ (Казахстан)</p>
            <p>БИК: VTBAKZKZ</p>
            <p className="mt-2">
              <a href="mailto:info@avishu.kz" className="text-stone-900 underline">info@avishu.kz</a> · <a href="tel:+77025300023" className="text-stone-900 underline">+7 702 530 00 23</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
