import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { TimelineEntry } from "../types";
import { RELATIONSHIP_START_DATE } from "../appConfig";

const MONTHS_PER_WINDOW = 6;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function recentMonths(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, index) => monthKey(new Date(from.getFullYear(), from.getMonth() - index, 1)));
}

function olderMonths(loaded: string[]) {
  const first = [...loaded].sort()[0];
  if (!first) return recentMonths(MONTHS_PER_WINDOW);
  const [year, month] = first.split("-").map(Number);
  return Array.from({ length: MONTHS_PER_WINDOW }, (_, index) => monthKey(new Date(year, month - 2 - index, 1)));
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "日期未定";
  return new Intl.DateTimeFormat("zh-HK", { month: "short", day: "numeric", weekday: "short" }).format(date);
}

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function formatRelationshipStartDate() {
  const [year, month, day] = RELATIONSHIP_START_DATE.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

function relationshipDays() {
  const [year, month, day] = RELATIONSHIP_START_DATE.split("-").map(Number);
  const start = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - start) / 86400000) + 1;
}

function remarkPreview(entry: TimelineEntry) {
  const text = [entry.remarks.me, entry.remarks.gf].filter(Boolean).join(" · ").replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function TimelinePage() {
  const entries = useStore((state) => state.timelineEntries);
  const loadedMonths = useStore((state) => state.loadedTimelineMonths);
  const isLoading = useStore((state) => state.isLoadingTimeline);
  const loadTimelineWindow = useStore((state) => state.loadTimelineWindow);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set([String(new Date().getFullYear())]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([monthKey(new Date())]));
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const initialMonths = useMemo(() => recentMonths(MONTHS_PER_WINDOW), []);

  useEffect(() => {
    void loadTimelineWindow(initialMonths, true);
  }, [initialMonths, loadTimelineWindow]);

  const entriesByMonth = useMemo(() => {
    const grouped = new Map<string, TimelineEntry[]>();
    entries.forEach((entry) => {
      const key = entry.occurredAt.slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), entry]);
    });
    grouped.forEach((items) => items.sort((first, second) => {
      const firstDate = first.occurredAt.slice(0, 10);
      const secondDate = second.occurredAt.slice(0, 10);
      if (firstDate !== secondDate) return secondDate.localeCompare(firstDate);
      if (first.type !== second.type) return first.type === "calendar" ? -1 : 1;
      if (first.type === "calendar") return first.title.localeCompare(second.title, "zh-Hant");
      return second.occurredAt.localeCompare(first.occurredAt);
    }));
    return grouped;
  }, [entries]);

  const entriesByYear = useMemo(() => {
    const grouped = new Map<string, string[]>();
    [...entriesByMonth.keys()].sort().reverse().forEach((key) => {
      const year = key.slice(0, 4);
      grouped.set(year, [...(grouped.get(year) ?? []), key]);
    });
    return grouped;
  }, [entriesByMonth]);

  const rated = entries.filter((entry) => typeof entry.averageRating === "number");
  const averageRating = rated.length ? rated.reduce((sum, entry) => sum + (entry.averageRating ?? 0), 0) / rated.length : null;

  function toggleYear(year: string) {
    setExpandedYears((current) => {
      const next = new Set(current);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setExpandedMonths((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    if (!loadedMonths.includes(key)) void loadTimelineWindow([key]);
  }

  return (
    <div className="space-y-4 bg-surface text-gray-900" style={{ colorScheme: "light" }}>
      <section className="rounded-3xl border border-gray-100 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-gray-400">OUR STORY</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">我哋嘅足跡</h2>
            <p className="mt-2 text-sm text-gray-500">按完成時間，記低我哋一齊做過嘅事。</p>
            <p className="mt-2 text-xs font-semibold text-gray-500">由 {formatRelationshipStartDate()} 開始 · 我哋已經一齊咗 {relationshipDays()} 日</p>
          </div>
          <div className="flex gap-4 text-right">
            <div><div className="text-2xl font-black">{entries.length}</div><div className="text-[11px] text-gray-400">已載入紀錄</div></div>
            {averageRating !== null && <div><div className="text-2xl font-black text-amber-500">{averageRating.toFixed(1)}</div><div className="text-[11px] text-gray-400">已載入平均分</div></div>}
          </div>
        </div>
      </section>

      {entriesByYear.size === 0 && !isLoading ? (
        <section className="border-b border-gray-200 py-12 text-center"><div className="text-3xl">🌱</div><h3 className="mt-2 font-bold text-gray-700">呢段時間仲未有紀錄</h3><p className="mt-1 text-sm text-gray-400">試下載入更早月份，或者完成第一個願望。</p></section>
      ) : (
        <div className="space-y-3">
          {[...entriesByYear.entries()].map(([year, months]) => {
            const yearOpen = expandedYears.has(year);
            return <section key={year} className="border-b border-gray-200 pb-3">
              <button type="button" onClick={() => toggleYear(year)} className="flex w-full items-center justify-between py-2 text-left" aria-expanded={yearOpen}><span className="text-xl font-black">{year}</span><span className="text-lg text-gray-400">{yearOpen ? "−" : "+"}</span></button>
              {yearOpen && <div className="space-y-2 pl-3">{months.map((key) => {
                const items = entriesByMonth.get(key) ?? [];
                const open = expandedMonths.has(key);
                const month = Number(key.slice(5));
                return <div key={key} className="border-l-2 border-gray-200 pl-3">
                  <button type="button" onClick={() => toggleMonth(key)} className="flex w-full items-center justify-between py-2 text-left" aria-expanded={open}><span className="font-bold text-gray-800">{month}月</span>{open && <span className="text-xs font-semibold text-gray-400">{items.length} 次</span>}</button>
                  {open && <div className="relative ml-2 border-l-2 border-gray-200 pb-2">{items.map((entry) => {
                    const remarks = [entry.remarks.me, entry.remarks.gf].filter(Boolean);
                    const detailOpen = expandedEntryId === entry.id;
                    return <article key={entry.id} className="relative pb-6 pl-5 last:pb-2">
                      <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${entry.type === "calendar" ? "bg-pink-500" : "bg-blue-500"}`} />
                      <time className="text-xs font-bold text-gray-500">{formatDate(entry.occurredAt)}{entry.type === "calendar" && entry.endDate && entry.endDate !== entry.startDate ? ` 至 ${formatDateKey(entry.endDate)}` : ""}</time>
                      <h4 className="mt-1 break-words text-base font-black">{entry.title}</h4>
                      {entry.type === "calendar" && <p className="mt-1 text-xs font-semibold text-pink-600">📅 足跡活動</p>}
                      {entry.detail && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-gray-500">{entry.detail}</p>}
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">{entry.region && <span>📍 {entry.region}</span>}{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}{typeof entry.averageRating === "number" && <span className="font-bold text-amber-500">★ {entry.averageRating}/10</span>}</div>
                      {remarks.length > 0 && <button type="button" onClick={() => setExpandedEntryId(detailOpen ? null : entry.id)} className="mt-2 max-w-full text-left text-xs text-gray-500 hover:text-gray-900" aria-expanded={detailOpen}>{detailOpen ? <div className="space-y-2 border-l-2 border-gray-300 pl-3">{entry.remarks.me && <p className="whitespace-pre-wrap break-words"><strong className="font-bold text-gray-700">Remus：</strong>{entry.remarks.me}</p>}{entry.remarks.gf && <p className="whitespace-pre-wrap break-words"><strong className="font-bold text-gray-700">Nicole：</strong>{entry.remarks.gf}</p>}<span className="inline-block font-semibold">收起感想 ↑</span></div> : <span className="block max-w-full truncate">「{remarkPreview(entry)}」 <span className="font-semibold">查看 {remarks.length} 個感想 ↓</span></span>}</button>}
                    </article>;
                  })}</div>}
                </div>;
              })}</div>}
            </section>;
          })}
          <div className="pt-3 text-center"><button type="button" onClick={() => void loadTimelineWindow(olderMonths(loadedMonths))} disabled={isLoading} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:cursor-wait disabled:opacity-60">{isLoading ? "載入緊…" : "載入更早月份"}</button></div>
        </div>
      )}
    </div>
  );
}
