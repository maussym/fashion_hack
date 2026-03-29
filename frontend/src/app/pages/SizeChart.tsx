import { useT } from "../lib/i18n";

const SIZES = [
  { size: "XS (40)", bust: "80-83", waist: "62-65", hips: "88-91" },
  { size: "S (42)", bust: "84-87", waist: "66-69", hips: "92-95" },
  { size: "M (44)", bust: "88-91", waist: "70-73", hips: "96-99" },
  { size: "L (46)", bust: "92-95", waist: "74-77", hips: "100-103" },
  { size: "XL (48)", bust: "96-99", waist: "78-81", hips: "104-107" },
  { size: "2XL (50)", bust: "100-103", waist: "82-85", hips: "108-111" },
  { size: "3XL (52)", bust: "104-107", waist: "86-89", hips: "112-115" },
];

const PLUS = [
  { size: "4XL (54)", bust: "108-111", waist: "90-93", hips: "116-119" },
  { size: "5XL (56)", bust: "112-115", waist: "94-97", hips: "120-123" },
  { size: "6XL (58)", bust: "116-119", waist: "98-101", hips: "124-127" },
];

function Table({ rows, label }: { rows: typeof SIZES; label: string }) {
  const t = useT();
  return (
    <div className="mb-10">
      <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-4">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans border border-stone-200">
          <thead>
            <tr className="bg-stone-50 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-500 border-b border-stone-200">cm</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-500 border-b border-stone-200">{t("size.bust")}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-500 border-b border-stone-200">{t("size.waist")}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-stone-500 border-b border-stone-200">{t("size.hips")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-b border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{r.size}</td>
                <td className="px-4 py-3 text-stone-500">{r.bust}</td>
                <td className="px-4 py-3 text-stone-500">{r.waist}</td>
                <td className="px-4 py-3 text-stone-500">{r.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SizeChart() {
  const t = useT();
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-2">AVISHU</p>
        <h1 className="font-serif text-stone-900 text-3xl sm:text-5xl mb-4" style={{ fontWeight: 300 }}>
          {t("size.title")}
        </h1>
        <p className="font-sans text-sm text-stone-400 leading-relaxed mb-10 max-w-xl">{t("size.desc")}</p>
        <Table rows={SIZES} label={t("size.base")} />
        <Table rows={PLUS} label={t("size.plus")} />
        <div className="border border-stone-200 p-5 sm:p-6">
          <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-3">{t("size.custom_title")}</p>
          <p className="font-sans text-sm text-stone-500 leading-relaxed">{t("size.custom_desc")}</p>
        </div>
      </section>
    </main>
  );
}
