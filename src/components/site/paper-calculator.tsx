"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { TIERS, inr, priceFor, type TierCode } from "@/lib/plans";

/**
 * Landing-page paper calculator.
 *
 * Every factor below is an explicitly labelled estimate so the numbers can be
 * defended in a sales conversation. Textbooks are counted to show the paper
 * footprint, but they are NOT claimed as a saving — EduSphere replaces the
 * paper the school itself prints and stores, which is the `printCost` line.
 */
const FACTORS = {
  booksPerStudent: 10, // textbooks + notebooks
  paperKgPerStudent: 8, // all paper a student goes through in a year
  bookCostPerStudent: 2500, // ₹, what a family spends on books/notebooks
  printKgPerStudent: 1.2, // registers, report cards, circulars, receipts
  printCostPerStudent: 180, // ₹, what the school spends on that printing
  kgPaperPerTree: 45, // a mature tree yields roughly 8,300 A4 sheets
} as const;

const MIN_STUDENTS = 50;
const MAX_STUDENTS = 5000;

const tierFor = (students: number): TierCode =>
  students <= TIERS.STARTER.students ? "STARTER" : students <= TIERS.STANDARD.students ? "STANDARD" : "LARGE";

const count = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

const money = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} crore`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)} lakh`;
  return inr(Math.round(n));
};

const TreeGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 6.5 10h3L5 16h14l-4.5-6h3z" />
    <path d="M12 16v5" />
  </svg>
);

const Stat = ({ icon, value, label, note }: { icon: React.ReactNode; value: string; label: string; note: string }) => (
  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>
    <div className="mt-3 text-2xl font-extrabold tracking-tight text-brand-950 tabular-nums">{value}</div>
    <div className="text-sm font-semibold text-slate-700">{label}</div>
    <div className="mt-0.5 text-xs leading-snug text-slate-500">{note}</div>
  </div>
);

export function PaperCalculator() {
  const [students, setStudents] = useState(700);
  const [raw, setRaw] = useState("700");

  const numbers = useMemo(() => {
    const tier = tierFor(students);
    const plan = priceFor(tier, "YEAR", 0); // annual price, 28% package discount
    const subscription = plan.amount;
    const trees = (students * FACTORS.paperKgPerStudent) / FACTORS.kgPaperPerTree;
    const printKg = students * FACTORS.printKgPerStudent;
    const printCost = students * FACTORS.printCostPerStudent;
    const bookCost = students * FACTORS.bookCostPerStudent;
    const saving = printCost - subscription;
    const pct = printCost > 0 ? Math.max(0, Math.round((saving / printCost) * 100)) : 0;
    return {
      tier,
      tierLabel: TIERS[tier].label,
      subscription,
      perStudent: subscription / students,
      trees,
      printTrees: printKg / FACTORS.kgPaperPerTree,
      books: students * FACTORS.booksPerStudent,
      paperKg: students * FACTORS.paperKgPerStudent,
      bookCost,
      printKg,
      printCost,
      saving,
      pct,
    };
  }, [students]);

  const commit = (value: string) => {
    const clean = value.replace(/[^\d]/g, "").slice(0, 4);
    setRaw(clean);
    // Recalculate as soon as the typed value is usable, so the numbers move while typing.
    const n = Number(clean);
    if (clean && n >= MIN_STUDENTS && n <= MAX_STUDENTS) setStudents(n);
  };
  const normalise = () => {
    const n = Math.min(MAX_STUDENTS, Math.max(MIN_STUDENTS, Number(raw) || MIN_STUDENTS));
    setStudents(n);
    setRaw(String(n));
  };
  const setBoth = (n: number) => {
    setStudents(n);
    setRaw(String(n));
  };

  return (
    <section id="paper" className="scroll-mt-20 border-y border-emerald-100 bg-emerald-50/50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Save paper, save trees</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl">
          How much paper does your school use in a year?
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Enter your student count. We will show the books, paper and trees behind one academic year — and what the
          school spends on the paper it prints itself, compared with an EduSphere subscription.
        </p>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* INPUT + STATS */}
          <div className="card p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <label htmlFor="paper-students" className="text-sm font-bold text-brand-950">
                  Students in your school
                </label>
                <p className="mt-0.5 text-xs text-slate-500">Between {MIN_STUDENTS} and {count(MAX_STUDENTS)} students</p>
              </div>
              <input
                id="paper-students"
                type="number"
                inputMode="numeric"
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                value={raw}
                onChange={(e) => commit(e.target.value)}
                onBlur={normalise}
                onKeyDown={(e) => {
                  if (e.key === "Enter") normalise();
                }}
                className="input w-28 text-right text-lg font-extrabold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-describedby="paper-students-hint"
              />
            </div>
            <p id="paper-students-hint" className="sr-only">
              Type a number or use the slider. Results update as you type.
            </p>
            <input
              type="range"
              min={MIN_STUDENTS}
              max={MAX_STUDENTS}
              step={10}
              value={students}
              onChange={(e) => setBoth(Number(e.target.value))}
              className="mt-5 w-full accent-emerald-600"
              aria-label="Students in your school"
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
              <span>{MIN_STUDENTS}</span><span>{count(MAX_STUDENTS)}</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Stat
                icon={<TreeGlyph />}
                value={`${count(numbers.trees)} trees`}
                label="Cut every year"
                note={`${count(numbers.paperKg)} kg of paper, at ${FACTORS.kgPaperPerTree} kg per tree`}
              />
              <Stat
                icon={<Icon name="book" className="h-5 w-5" />}
                value={`${count(numbers.books)}`}
                label="Books & notebooks"
                note={`${FACTORS.booksPerStudent} per student, every year`}
              />
              <Stat
                icon={<Icon name="notebook" className="h-5 w-5" />}
                value={`${count(numbers.paperKg)} kg`}
                label="Paper in total"
                note="Textbooks, notebooks and printing"
              />
              <Stat
                icon={<Icon name="wallet" className="h-5 w-5" />}
                value={money(numbers.bookCost)}
                label="Families spend"
                note={`About ₹${count(FACTORS.bookCostPerStudent)} per student on books`}
              />
            </div>

            <details className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold text-brand-950">Where these numbers come from</summary>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
                <li>• {FACTORS.booksPerStudent} textbooks and notebooks per student per year.</li>
                <li>• {FACTORS.paperKgPerStudent} kg of paper per student per year, including printing.</li>
                <li>• {FACTORS.kgPaperPerTree} kg of paper from one mature tree (about 8,300 A4 sheets).</li>
                <li>• ₹{count(FACTORS.bookCostPerStudent)} per student for books — a private-school estimate.</li>
                <li>• ₹{FACTORS.printCostPerStudent} per student for what the <b>school</b> prints: registers, report cards, circulars, receipts and worksheets.</li>
              </ul>
              <p className="mt-3 text-[13px] leading-relaxed">These are conservative estimates for an Indian school. Your actual usage will differ.</p>
            </details>
          </div>

          {/* COMPARISON */}
          <div className="flex flex-col rounded-3xl bg-brand-950 p-6 text-white sm:p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">The cost comparison</p>
            <h3 className="mt-2 text-xl font-extrabold leading-snug">Paper the school pays for, versus one subscription.</h3>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <dt className="font-semibold text-white">Books & notebooks</dt>
                  <dd className="mt-0.5 text-xs text-brand-200">Paid by families — EduSphere does not replace these</dd>
                </div>
                <span className="whitespace-nowrap font-bold tabular-nums text-brand-100">{money(numbers.bookCost)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <dt className="font-semibold text-white">Registers, report cards, circulars</dt>
                  <dd className="mt-0.5 text-xs text-brand-200">{count(numbers.printKg)} kg of paper the school buys — replaced</dd>
                </div>
                <span className="whitespace-nowrap font-bold tabular-nums text-brand-100">{money(numbers.printCost)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl bg-white/10 p-3">
                <div>
                  <dt className="font-semibold text-white">EduSphere {numbers.tierLabel}</dt>
                  <dd className="mt-0.5 text-xs text-brand-200">Annual plan · ₹{numbers.perStudent.toFixed(0)} per student per year</dd>
                </div>
                <span className="whitespace-nowrap font-extrabold tabular-nums text-sun-400">{money(numbers.subscription)}</span>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl bg-emerald-500/15 p-4 ring-1 ring-emerald-400/30">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Kept by the school</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-white">{money(numbers.saving)}</p>
              <p className="mt-1 text-sm text-emerald-100">
                a year, about {numbers.pct}% less than paper — and {count(numbers.printTrees)} trees not cut for school printing.
              </p>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-brand-300">
              The saving compares only paper the school prints and stores. Textbooks and notebooks stay — that is why we
              count them in the footprint but not in the saving.
            </p>

            <div className="mt-auto pt-6">
              <Link href="/contact" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-brand-800 hover:bg-brand-50">
                See it with your school’s numbers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
