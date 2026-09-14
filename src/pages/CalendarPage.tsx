import React, { useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { CalendarEvent } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import ConfirmModal from "../components/ConfirmModal";

type Holiday = {
  date: string;
  title: string;
};

const holidays2026: Holiday[] = [
  { date: "2026-01-01", title: "一月一日" },
  { date: "2026-02-17", title: "農曆年初一" },
  { date: "2026-02-18", title: "農曆年初二" },
  { date: "2026-02-19", title: "農曆年初三" },
  { date: "2026-04-03", title: "耶穌受難節" },
  { date: "2026-04-04", title: "耶穌受難節翌日" },
  { date: "2026-04-06", title: "復活節星期一" },
  { date: "2026-04-07", title: "清明節翌日" },
  { date: "2026-05-01", title: "勞動節" },
  { date: "2026-05-25", title: "佛誕翌日" },
  { date: "2026-06-20", title: "端午節" },
  { date: "2026-07-01", title: "港殤日" },
  { date: "2026-09-26", title: "中秋節翌日" },
  { date: "2026-10-01", title: "鄰近國家國慶日" },
  { date: "2026-10-19", title: "重陽節" },
  { date: "2026-12-25", title: "聖誕節" },
  { date: "2026-12-26", title: "聖誕節後第一個周日" },
];

const creatorStyles = {
  Remus: "sm:bg-blue-100 sm:text-blue-700 dark:sm:bg-blue-900/40 dark:sm:text-blue-200",
  Nicole: "sm:bg-pink-100 sm:text-pink-700 dark:sm:bg-pink-900/40 dark:sm:text-pink-200",
  system: "sm:bg-amber-100 sm:text-amber-700 dark:sm:bg-amber-900/40 dark:sm:text-amber-200",
  romantic:
    "sm:border sm:border-pink-200 sm:bg-gradient-to-r sm:from-pink-100 sm:to-rose-100 sm:text-pink-700 dark:sm:border-pink-800 dark:sm:from-pink-900/50 dark:sm:to-rose-900/50 dark:sm:text-pink-100",
};

function getEventStyle(event: CalendarEvent) {
  if (event.isRomantic) return creatorStyles.romantic;
  return event.createdBy ? creatorStyles[event.createdBy] : creatorStyles.system;
}

function getEventListStyle(event: CalendarEvent) {
  if (event.isRomantic) {
    return "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200";
  }
  if (event.createdBy === "Nicole") {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200";
  }
  if (event.createdBy === "Remus") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200";
  }
  return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200";
}

function getEventDotStyle(event: CalendarEvent) {
  if (event.isRomantic) return "bg-pink-500";
  if (event.createdBy === "Nicole") return "bg-pink-400";
  if (event.createdBy === "Remus") return "bg-blue-500";
  return "bg-amber-500";
}

function getEventBarStyle(event: CalendarEvent) {
  if (event.createdBy === "Nicole") return "bg-pink-400";
  if (event.createdBy === "Remus") return "bg-blue-500";
  return "bg-amber-500";
}

function getEventBarRadius(event: CalendarEvent, dateKey: string) {
  const startsToday = event.startDate === dateKey;
  const endsToday = event.endDate === dateKey;
  if (startsToday && endsToday) return "rounded-full";
  if (startsToday) return "rounded-l-full";
  if (endsToday) return "rounded-r-full";
  return "rounded-none";
}

function getEventBarWidth(event: CalendarEvent, dateKey: string) {
  return "calc(100% + 0.625rem)";
}

function DateFieldIcon({ type }: { type: "date" | "time" }) {
  return type === "date" ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createCalendarEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getDefaultEventTimes() {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const endHour = new Date(nextHour);
  endHour.setHours(endHour.getHours() + 1);
  return {
    startTime: `${String(nextHour.getHours()).padStart(2, "0")}:00`,
    endTime: `${String(endHour.getHours()).padStart(2, "0")}:00`,
  };
}

function addOneHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const totalMinutes = (hours * 60 + minutes + 60) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function parseDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function formatDate(dateKey: string) {
  return `${parseDate(dateKey).getMonth() + 1}月${parseDate(dateKey).getDate()}日`;
}

function formatShortTime(time?: string) {
  return time ? time.slice(0, 5) : "";
}

function getMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function eventOccursOn(event: CalendarEvent, dateKey: string) {
  if (event.recurring) {
    return dateKey.slice(5) === event.startDate.slice(5);
  }
  return dateKey >= event.startDate && dateKey <= event.endDate;
}

function getCalendarEventTitle(event: CalendarEvent, dateKey: string) {
  if (event.id !== "anniversary" || !event.recurring) return event.title;
  const anniversaryYear = Number(event.startDate.slice(0, 4));
  const displayYear = Number(dateKey.slice(0, 4));
  const yearsSinceFirst = displayYear - anniversaryYear;
  return yearsSinceFirst > 0 ? `${yearsSinceFirst}周年紀念` : event.title;
}

function formatEventTime(event: CalendarEvent) {
  if (event.isAllDay) return "全日";
  if (!event.startTime && !event.endTime) return "時間未定";
  return `${formatShortTime(event.startTime) || "未定"}${event.endTime ? ` - ${formatShortTime(event.endTime)}` : ""}`;
}

function initialEvents(): CalendarEvent[] {
  return [
    {
      id: "anniversary",
      title: "我哋紀念日",
      startDate: "2026-09-12",
      endDate: "2026-09-12",
      isAllDay: true,
      isRomantic: true,
      recurring: true,
    },
    {
      id: "three-month-anniversary",
      title: "3個月紀念日",
      startDate: "2026-12-12",
      endDate: "2026-12-12",
      isAllDay: true,
      isRomantic: true,
    },
    {
      id: "six-month-anniversary",
      title: "半年紀念日",
      startDate: "2027-03-12",
      endDate: "2027-03-12",
      isAllDay: true,
      isRomantic: true,
    },
  ];
}

export default function CalendarPage() {
  const calendarStartYear = 2026;
  const currentYear = new Date().getFullYear();
  const calendarEndYear = currentYear + 1;
  const currentUser = useStore((state) => state.currentUser);
  const remoteEvents = useStore((state) => state.calendarEvents);
  const addCalendarEvent = useStore((state) => state.addCalendarEvent);
  const addCalendarEvents = useStore((state) => state.addCalendarEvents);
  const updateCalendarEvent = useStore((state) => state.updateCalendarEvent);
  const deleteCalendarEvent = useStore((state) => state.deleteCalendarEvent);
  const defaultEventTimes = getDefaultEventTimes();
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [jumpYear, setJumpYear] = useState(2026);
  const [jumpMonth, setJumpMonth] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<CalendarEvent | null>(null);
  const [repeatTarget, setRepeatTarget] = useState<CalendarEvent | null>(null);
  const [repeatYear, setRepeatYear] = useState("");
  const [repeatMonth, setRepeatMonth] = useState("");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatError, setRepeatError] = useState("");
  const [isRepeating, setIsRepeating] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const touchStartX = useRef<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    startDate: "2026-09-13",
    endDate: "2026-09-13",
    isAllDay: false,
    isRomantic: false,
    startTime: defaultEventTimes.startTime,
    endTime: defaultEventTimes.endTime,
    location: "",
  });

  useBodyScrollLock(showForm || Boolean(repeatTarget));

  const days = useMemo(() => getMonthDays(month), [month]);
  const events = useMemo(
    () => [...initialEvents(), ...remoteEvents],
    [remoteEvents],
  );
  const holidays = month.getFullYear() === 2026 ? holidays2026 : [];
  const selectedEvents = events.filter((event) =>
    eventOccursOn(event, selectedDate),
  );
  const selectedHoliday = holidays.find(
    (holiday) => holiday.date === selectedDate,
  );
  const isMultiDayForm = form.endDate > form.startDate;

  function changeMonth(offset: number) {
    setMonth((current) => {
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        1,
      );
      const firstMonth = new Date(calendarStartYear, 0, 1);
      const lastMonth = new Date(calendarEndYear, 11, 1);
      if (nextMonth < firstMonth || nextMonth > lastMonth) return current;
      setJumpYear(nextMonth.getFullYear());
      setJumpMonth(nextMonth.getMonth());
      const monthStartKey = toDateKey(nextMonth);
      setSelectedDate(monthStartKey);
      setForm((currentForm) => ({
        ...currentForm,
        startDate: monthStartKey,
        endDate: monthStartKey,
      }));
      return nextMonth;
    });
  }

  function handleCalendarTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleCalendarTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 50) return;
    changeMonth(distance < 0 ? 1 : -1);
  }

  function goToCurrentMonth() {
    const today = new Date();
    const todayKey = toDateKey(today);
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setJumpYear(today.getFullYear());
    setJumpMonth(today.getMonth());
    setSelectedDate(todayKey);
    setForm((current) => ({
      ...current,
      startDate: todayKey,
      endDate: todayKey,
    }));
  }

  function jumpToMonth(year: number, monthIndex: number) {
    const nextMonth = new Date(year, monthIndex, 1);
    const monthStartKey = toDateKey(nextMonth);
    setMonth(nextMonth);
    setJumpYear(year);
    setJumpMonth(monthIndex);
    setSelectedDate(monthStartKey);
    setForm((current) => ({
      ...current,
      startDate: monthStartKey,
      endDate: monthStartKey,
    }));
  }

  function selectDate(date: Date) {
    const dateKey = toDateKey(date);
    setSelectedDate(dateKey);
    setForm((current) => ({
      ...current,
      startDate: dateKey,
      endDate: dateKey,
    }));
  }

  function resetForm() {
    setForm({
      title: "",
      startDate: selectedDate,
      endDate: selectedDate,
      isAllDay: false,
      isRomantic: false,
      ...getDefaultEventTimes(),
      location: "",
    });
    setFormError("");
  }

  function openCreateForm() {
    setEditingEventId(null);
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingEventId(null);
    resetForm();
  }

  function canManageEvent(event: CalendarEvent) {
    return (
      event.createdBy === currentUser?.role ||
      (event.isRomantic && Boolean(event.createdBy))
    );
  }

  function openRepeatForm(event: CalendarEvent) {
    if (!canManageEvent(event) || event.startDate !== event.endDate) {
      return;
    }
    setRepeatTarget(event);
    setRepeatYear(event.startDate.slice(0, 4));
    setRepeatMonth(event.startDate.slice(5, 7));
    setRepeatDays([]);
    setRepeatError("");
  }

  function closeRepeatForm() {
    setRepeatTarget(null);
    setRepeatYear("");
    setRepeatDays([]);
    setRepeatError("");
  }

  async function confirmRepeat() {
    if (!repeatTarget || repeatDays.length === 0) {
      setRepeatError("請至少揀一日");
      return;
    }
    setIsRepeating(true);
    setRepeatError("");
    const repeatedEvents = repeatDays.map((day) => {
      const dateKey = `${repeatYear}-${repeatMonth}-${day}`;
      return {
        ...repeatTarget,
        id: createCalendarEventId(),
        startDate: dateKey,
        endDate: dateKey,
      };
    });
    const saved = await addCalendarEvents(repeatedEvents);
    setIsRepeating(false);
    if (!saved) {
      setRepeatError("重覆活動失敗，請再試一次");
      return;
    }
    closeRepeatForm();
  }

  function openEditForm(event: CalendarEvent) {
    if (!canManageEvent(event)) return;
    setEditingEventId(event.id);
    setFormError("");
    setForm({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: event.isAllDay,
      isRomantic: event.isRomantic || false,
      startTime: event.startTime || defaultEventTimes.startTime,
      endTime: event.endTime || defaultEventTimes.endTime,
      location: event.location || "",
    });
    setShowForm(true);
  }

  async function saveEvent() {
    if (isSubmitting) return;
    if (!form.title.trim()) {
      setFormError("請先打活動名");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError("請揀返日期");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("完結日期唔可以早過開始日期");
      return;
    }
    if (
      !form.isAllDay &&
      form.endDate === form.startDate &&
      form.startTime &&
      form.endTime &&
      form.endTime < form.startTime
    ) {
      setFormError("完結時間唔可以早過開始時間");
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    try {
      const existingEvent = editingEventId
        ? events.find((event) => event.id === editingEventId)
        : undefined;
      if (editingEventId && (!existingEvent || !canManageEvent(existingEvent))) {
        setFormError("只可以修改自己加嘅活動");
        return;
      }
      const eventToSave: CalendarEvent = {
        id: editingEventId || createCalendarEventId(),
        title: form.title.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isAllDay: form.isAllDay || isMultiDayForm,
        isRomantic: form.isRomantic,
        startTime: isMultiDayForm ? undefined : form.startTime || undefined,
        endTime: isMultiDayForm ? undefined : form.endTime || undefined,
        location: form.location.trim() || undefined,
        createdBy: currentUser?.role ?? "Remus",
        recurring: existingEvent?.recurring,
      };
      const saved = editingEventId
        ? await updateCalendarEvent(eventToSave)
        : await addCalendarEvent(eventToSave);
      if (!saved) {
        setFormError("加唔到活動，請先確認已執行日曆 SQL");
        return;
      }
      setSelectedDate(form.startDate);
      setMonth(
        new Date(
          parseDate(form.startDate).getFullYear(),
          parseDate(form.startDate).getMonth(),
          1,
        ),
      );
      setForm((current) => ({
        ...current,
        title: "",
        location: "",
        ...getDefaultEventTimes(),
      }));
      setEditingEventId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Unable to save calendar event", error);
      setFormError("加唔到活動，請再試一次");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitEvent(event: React.FormEvent) {
    event.preventDefault();
    void saveEvent();
  }

  function deleteEvent(id: string) {
    const event = events.find((item) => item.id === id);
    if (!event || !canManageEvent(event)) return;
    setPendingDeleteEvent(event);
  }

  function confirmDeleteEvent() {
    if (!pendingDeleteEvent) return;
    void deleteCalendarEvent(pendingDeleteEvent.id);
    setPendingDeleteEvent(null);
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-gray-100 p-3 dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">
            我哋嘅行事曆
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-200">
            記低我哋有咩節目
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-bold text-white shadow-sm active:scale-95 dark:bg-gray-100 dark:text-gray-900"
        >
          ＋ 加個活動
        </button>
      </div>

      <div className="rounded-3xl border border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="h-9 w-9 rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label="上個月"
          >
            ‹
          </button>
          <div className="flex min-w-0 items-center gap-1">
            <select
              value={jumpYear}
              onChange={(event) =>
                jumpToMonth(Number(event.target.value), jumpMonth)
              }
              aria-label="選擇年份"
              className="min-w-0 rounded-lg bg-gray-100 px-1.5 py-1 text-sm font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              {Array.from(
                {
                  length: calendarEndYear - calendarStartYear + 1,
                },
                (_, yearIndex) => calendarStartYear + yearIndex,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
            <select
              value={jumpMonth}
              onChange={(event) =>
                jumpToMonth(jumpYear, Number(event.target.value))
              }
              aria-label="選擇月份"
              className="min-w-0 rounded-lg bg-gray-100 px-1.5 py-1 text-sm font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              {Array.from({ length: 12 }, (_, monthIndex) => (
                <option key={monthIndex} value={monthIndex}>
                  {monthIndex + 1}月
                </option>
              ))}
            </select>
            <button
              onClick={goToCurrentMonth}
              className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="h-9 w-9 rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label="下個月"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 dark:text-gray-500">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="pb-2">
              {day}
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-7 gap-y-1 gap-x-0 sm:gap-1"
          onTouchStart={handleCalendarTouchStart}
          onTouchEnd={handleCalendarTouchEnd}
        >
          {days.map((day, dayIndex) => {
            const dateKey = toDateKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const dayEvents = events.filter((event) =>
              eventOccursOn(event, dateKey),
            );
            const mobileMultiDayEvents = dayEvents
              .filter((event) => event.startDate !== event.endDate && !event.isRomantic)
              .sort((left, right) => {
                const rank = (event: CalendarEvent) =>
                  event.createdBy === "Nicole" ? 0 : event.createdBy === "Remus" ? 1 : 2;
                return rank(left) - rank(right);
              });
            const mobileSingleDayEvents = dayEvents.filter(
              (event) => event.startDate === event.endDate && !event.isRomantic,
            );
            const hasMultiDayEvent = dayEvents.some(
              (event) => event.startDate !== event.endDate,
            );
            const hasRomanticEvent = dayEvents.some((event) => event.isRomantic);
            const mobileActivityRows = Math.min(
              3,
              mobileMultiDayEvents.length + (mobileSingleDayEvents.length > 0 ? 1 : 0),
            );
            const mobileCellHeight =
              mobileActivityRows >= 3
                ? "min-h-[3.75rem]"
                : mobileActivityRows === 2
                  ? "min-h-14"
                  : "min-h-12";
            const mobileActivityHeight =
              mobileActivityRows >= 3
                ? "h-6"
                : mobileActivityRows === 2
                  ? "h-4"
                  : mobileActivityRows === 1
                    ? "h-2"
                    : "h-0";
            const holiday = holidays.find((item) => item.date === dateKey);
            const isSelected = selectedDate === dateKey;
            const isToday = toDateKey(new Date()) === dateKey;
            return (
              <button
                key={dateKey}
                onClick={() => selectDate(day)}
                style={
                  hasMultiDayEvent
                    ? { zIndex: 100 - (dayIndex % 7) }
                    : undefined
                }
                className={`relative ${mobileCellHeight} flex flex-col items-stretch justify-start rounded-xl border p-1 text-left transition-all sm:min-h-16 ${hasMultiDayEvent ? "z-10" : "z-0"} ${
                  isSelected
                    ? "border-gray-900 bg-gray-100 dark:border-gray-100 dark:bg-gray-800"
                    : "border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
                } ${day.getDay() === 0 ? "bg-red-50/60 dark:bg-red-950/20" : day.getDay() === 6 ? "bg-blue-50/60 dark:bg-blue-950/20" : ""} ${isToday ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950/30" : ""} ${!inMonth ? "opacity-35" : ""}`}
              >
                <div
                  className={`flex items-center gap-1 text-xs font-bold ${holiday ? "text-red-500" : day.getDay() === 0 ? "text-red-400" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {day.getDate()}
                  <span className="flex items-center gap-0.5">
                    {hasRomanticEvent && (
                      <span aria-label="紀念日" className="text-[10px] leading-none sm:hidden">
                        💕
                      </span>
                    )}
                  </span>
                </div>
                <div className={`mt-1 ${mobileActivityHeight} overflow-visible sm:h-auto sm:min-h-8`}>
                  <div
                    aria-label={holiday ? `香港假期：${holiday.title}` : undefined}
                    className={`hidden h-4 items-center truncate text-[9px] font-bold text-amber-700 dark:text-amber-200 sm:flex ${holiday ? "sm:rounded sm:bg-amber-100 sm:px-1 dark:sm:bg-amber-900/40" : ""}`}
                  >
                    {holiday && (
                      <>
                        <span className="hidden sm:inline">{holiday.title}</span>
                      </>
                    )}
                  </div>
                  <div className="flex h-full flex-col items-start justify-start gap-0.5 overflow-visible sm:hidden">
                    {Array.from({ length: 2 }, (_, laneIndex) => mobileMultiDayEvents[laneIndex]).map(
                      (event, laneIndex) => (
                        <div key={event?.id ?? `empty-lane-${laneIndex}`} className="flex h-2 w-full items-center">
                          {event && (
                            <span
                              aria-label={`${getCalendarEventTitle(event, dateKey)}（跨日活動）`}
                              style={{ width: getEventBarWidth(event, dateKey) }}
                              className={`relative z-50 -mx-1 block h-2 shrink-0 ${getEventBarStyle(event)} ${getEventBarRadius(event, dateKey)}`}
                            />
                          )}
                        </div>
                      ),
                    )}
                    <div className="flex h-2 w-full items-center gap-1">
                      {mobileSingleDayEvents.map((event) => (
                        <span
                          key={event.id}
                          aria-label={`${getCalendarEventTitle(event, dateKey)}${!event.isAllDay && event.startTime ? ` ${formatShortTime(event.startTime)}` : ""}`}
                          className={`block h-1.5 w-1.5 rounded-full ${getEventDotStyle(event)}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="hidden space-y-0.5 sm:block">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        aria-label={`${getCalendarEventTitle(event, dateKey)}${!event.isAllDay && event.startTime ? ` ${formatShortTime(event.startTime)}` : ""}`}
                        className={`truncate rounded px-1 text-[9px] font-bold ${getEventStyle(event)}`}
                      >
                        {event.isRomantic ? "💕 " : ""}
                        {getCalendarEventTitle(event, dateKey)}
                        {!event.isAllDay && event.startTime
                          ? ` ${formatShortTime(event.startTime)}`
                          : ""}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-gray-400">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {formatDate(selectedDate)}有咩做
            </h3>
          </div>
        </div>
        {selectedHoliday && (
          <div className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            {selectedHoliday.title}
          </div>
        )}
        {selectedEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${getEventListStyle(event)}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="whitespace-normal break-words text-sm font-bold leading-5">
                    {event.isRomantic ? "💕 " : ""}
                    {getCalendarEventTitle(event, selectedDate)}
                  </div>
                  <div className="text-[11px]">
                    {formatEventTime(event)}
                    {event.location ? ` · 📍 ${event.location}` : ""}
                    {event.startDate !== event.endDate
                      ? ` · ${formatDate(event.startDate)} 至 ${formatDate(event.endDate)}`
                      : ""}
                  </div>
                </div>
                {canManageEvent(event) && (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    {event.startDate === event.endDate && (
                      <button
                        onClick={() => openRepeatForm(event)}
                        className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        aria-label={`重覆${event.title}`}
                      >
                        重覆
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(event)}
                      className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      aria-label={`編輯${event.title}`}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="font-semibold text-red-600 hover:text-red-700 dark:text-red-300"
                      aria-label={`刪除${event.title}`}
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-400 dark:bg-gray-800">
            呢日未有安排
          </p>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center overflow-x-hidden overflow-y-hidden bg-black/40 p-3 sm:items-center sm:p-4">
          <form
            onSubmit={submitEvent}
            noValidate
            className="box-border w-full max-h-[calc(100dvh-1.5rem)] min-w-0 max-w-full space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-gray-900 sm:max-h-[90dvh] sm:max-w-lg sm:space-y-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingEventId ? "編輯活動" : "加個活動"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800"
              >
                ✕
              </button>
            </div>
            <input
              required
              value={form.title}
              onChange={(event) => {
                setForm({ ...form, title: event.target.value });
                if (event.target.value.trim()) setFormError("");
              }}
              placeholder="例如：食飯、旅行、睇戲"
              className="min-w-0 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {formError && (
              <p className="-mt-2 text-xs font-medium text-red-500">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-gray-500">
                邊日開始
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => {
                      const startDate = event.target.value;
                      setForm({
                        ...form,
                        startDate,
                        isAllDay: form.endDate > startDate || form.isAllDay,
                      });
                    }}
                    className="box-border min-w-0 w-full max-w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <DateFieldIcon type="date" />
                </div>
              </label>
              <label className="text-xs text-gray-500">
                邊日完
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => {
                      const endDate = event.target.value;
                      setForm({
                        ...form,
                        endDate,
                        isAllDay: endDate > form.startDate || form.isAllDay,
                      });
                    }}
                    className="box-border min-w-0 w-full max-w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <DateFieldIcon type="date" />
                </div>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={form.isAllDay || isMultiDayForm}
                disabled={isMultiDayForm}
                onChange={(event) =>
                  setForm({ ...form, isAllDay: event.target.checked })
                }
              />
              全日
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-200">
              <input
                type="checkbox"
                checked={form.isRomantic}
                onChange={(event) =>
                  setForm({ ...form, isRomantic: event.target.checked })
                }
              />
              💕 拍拖活動
            </label>
            {!form.isAllDay && !isMultiDayForm && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-xs text-gray-500">
                  幾點開始
                  <div className="relative mt-1">
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) => {
                        const startTime = event.target.value;
                        setForm({
                          ...form,
                          startTime,
                          endTime: addOneHour(startTime),
                        });
                      }}
                      className="box-border min-w-0 w-full max-w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <DateFieldIcon type="time" />
                  </div>
                </label>
                <label className="text-xs text-gray-500">
                  幾點完
                  <div className="relative mt-1">
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        setForm({ ...form, endTime: event.target.value })
                      }
                      className="box-border min-w-0 w-full max-w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <DateFieldIcon type="time" />
                  </div>
                </label>
              </div>
            )}
            <div>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="喺邊度（可以唔填）"
                className="min-w-0 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                唔加喇
              </button>
              <button
                type="button"
                onClick={() => void saveEvent()}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900"
              >
                {isSubmitting
                  ? "儲存緊…"
                  : editingEventId
                    ? "儲存修改"
                    : "加落去"}
              </button>
            </div>
          </form>
        </div>
      )}
      {repeatTarget && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4">
          <div className="box-border max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  重覆活動
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  將「{repeatTarget.title}」複製到揀選嘅日子
                </p>
              </div>
              <button
                type="button"
                onClick={closeRepeatForm}
                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800"
                aria-label="關閉重覆活動"
              >
                ✕
              </button>
            </div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-200">
              揀年份
              <select
                value={repeatYear}
                onChange={(event) => {
                  setRepeatYear(event.target.value);
                  setRepeatDays([]);
                }}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {Array.from(
                  { length: 2 },
                  (_, index) => Number(repeatTarget.startDate.slice(0, 4)) + index,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold text-gray-600 dark:text-gray-200">
              揀月份
              <select
                value={repeatMonth}
                onChange={(event) => {
                  setRepeatMonth(event.target.value);
                  setRepeatDays([]);
                }}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const monthNumber = String(index + 1).padStart(2, "0");
                  return (
                    <option key={monthNumber} value={monthNumber}>
                      {index + 1}月
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-200">
                揀日子（可以揀多個）
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from(
                  {
                    length: getDaysInMonth(
                      Number(repeatYear),
                      Number(repeatMonth),
                    ),
                  },
                  (_, index) => String(index + 1).padStart(2, "0"),
                ).map((day) => {
                  const checked = repeatDays.includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-bold transition-colors ${
                        checked
                          ? "border-pink-500 bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200"
                          : "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          setRepeatDays((current) =>
                            checked
                              ? current.filter((item) => item !== day)
                              : [...current, day].sort(),
                          )
                        }
                      />
                      {Number(day)}
                    </label>
                  );
                })}
              </div>
            </div>
            {repeatError && (
              <p className="mt-3 text-xs font-medium text-red-500">
                {repeatError}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeRepeatForm}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void confirmRepeat()}
                disabled={isRepeating}
                className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900"
              >
                {isRepeating ? "處理緊…" : "Ctrl + v"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={Boolean(pendingDeleteEvent)}
        title="刪除活動？"
        message={
          pendingDeleteEvent
            ? `確定要刪除「${pendingDeleteEvent.title}」？`
            : ""
        }
        confirmText="刪除"
        cancelText="取消"
        isDanger
        onConfirm={confirmDeleteEvent}
        onCancel={() => setPendingDeleteEvent(null)}
      />
    </div>
  );
}
