import create from "zustand";
import { persist } from "zustand/middleware";
import { CalendarEvent, HouseRule, HouseRuleProposal, User, UserRole, Wish, WishHistory } from "./types";
import { supabase } from "./supabase";

const COUPLE_ID = "remus-nicole";

const defaultTags = ["約會", "禮物", "旅行", "日常生活", "驚喜", "美食", "浪漫"];
let visibleRemoteLoadCount = 0;
const calendarLoadPromises = new Map<string, Promise<void>>();

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCalendarWindow(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstMonth = new Date(year, month - 2, 1);
  const lastMonth = new Date(year, month + 1, 1);
  const months = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(year, month - 2 + index, 1);
    return toMonthKey(date);
  });

  return {
    months,
    startDate: toDateKey(firstMonth),
    endDate: toDateKey(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)),
  };
}

function getLoadedCalendarRange(months: string[]) {
  const sortedMonths = [...months].sort();
  const [lastYear, lastMonth] = sortedMonths[sortedMonths.length - 1].split("-").map(Number);
  return {
    startDate: `${sortedMonths[0]}-01`,
    endDate: toDateKey(new Date(lastYear, lastMonth, 0)),
  };
}

async function fetchCalendarEvents(startDate: string, endDate: string) {
  if (!supabase) return [] as CalendarEvent[];

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("couple_id", COUPLE_ID)
    .or(`recurring.eq.true,and(start_date.lte.${endDate},end_date.gte.${startDate})`)
    .order("start_date")
    .order("start_time");

  if (error) throw error;
  return (data ?? []).map((row) => fromDatabaseCalendarEvent(row as Record<string, unknown>));
}

function fromDatabaseWish(row: Record<string, unknown>, history: WishHistory[]): Wish {
  return {
    id: String(row.id),
    title: String(row.title),
    description: typeof row.description === "string" ? row.description : "",
    region: typeof row.region === "string" ? row.region : "",
    address: typeof row.address === "string" ? row.address : "",
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    priority: row.priority as Wish["priority"],
    proposedBy: row.proposed_by as Wish["proposedBy"],
    assignedTo: row.assigned_to as Wish["assignedTo"],
    deadline: typeof row.deadline === "string" ? row.deadline : null,
    status: row.status as Wish["status"],
    createdAt: String(row.created_at),
    completedCount: Number(row.completed_count ?? 0),
    history,
  };
}

function fromDatabaseWishHistory(row: Record<string, unknown>): WishHistory {
  return {
    id: String(row.id),
    completedAt: String(row.completed_at),
    completedBy: String(row.completed_by),
    ratings: row.ratings && typeof row.ratings === "object"
      ? row.ratings as WishHistory["ratings"]
      : {},
    remarks: row.remarks && typeof row.remarks === "object"
      ? row.remarks as WishHistory["remarks"]
      : {},
    averageRating: row.average_rating == null
      ? undefined
      : Number(row.average_rating),
    isLocked: Boolean(row.is_locked),
  };
}

function toDatabaseWishMaster(wish: Wish) {
  return {
    id: wish.id,
    couple_id: COUPLE_ID,
    title: wish.title,
    description: wish.description || null,
    region: wish.region || null,
    address: wish.address || null,
    tags: wish.tags,
    priority: wish.priority,
    proposed_by: wish.proposedBy,
    assigned_to: wish.assignedTo,
    deadline: wish.deadline || null,
    status: wish.status,
    created_at: wish.createdAt,
    completed_count: wish.completedCount,
  };
}

function toDatabaseWishHistory(wishId: string, history: WishHistory) {
  return {
    id: history.id,
    wish_id: wishId,
    couple_id: COUPLE_ID,
    completed_at: history.completedAt,
    completed_by: history.completedBy,
    ratings: history.ratings,
    remarks: history.remarks,
    average_rating: history.averageRating ?? null,
    is_locked: history.isLocked ?? false,
  };
}

async function fetchWishHistory(wishIds: string[]) {
  if (!supabase || wishIds.length === 0) return new Map<string, WishHistory[]>();

  const { data, error } = await supabase
    .from("wishHistory")
    .select("*")
    .eq("couple_id", COUPLE_ID)
    .in("wish_id", wishIds)
    .order("completed_at", { ascending: false });

  if (error) throw error;

  const historyByWish = new Map<string, WishHistory[]>();
  for (const row of data ?? []) {
    const databaseRow = row as Record<string, unknown>;
    const wishId = String(databaseRow.wish_id);
    const history = historyByWish.get(wishId) ?? [];
    history.push(fromDatabaseWishHistory(databaseRow));
    historyByWish.set(wishId, history);
  }
  return historyByWish;
}

function fromDatabaseCalendarEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    isAllDay: Boolean(row.is_all_day),
    startTime: typeof row.start_time === "string" ? row.start_time : undefined,
    endTime: typeof row.end_time === "string" ? row.end_time : undefined,
    location: typeof row.location === "string" ? row.location : undefined,
    createdBy: row.created_by === "Nicole" ? "Nicole" : "Remus",
    isRomantic: Boolean(row.is_romantic),
    recurring: Boolean(row.recurring),
  };
}

function fromDatabaseHouseRule(row: Record<string, unknown>): HouseRule {
  return {
    id: String(row.id),
    ruleNumber: Number(row.rule_number),
    text: typeof row.text === "string" ? row.text : "",
    updatedBy: row.updated_by === "Nicole" ? "Nicole" : row.updated_by === "Remus" ? "Remus" : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

function fromDatabaseHouseRuleProposal(row: Record<string, unknown>): HouseRuleProposal {
  return {
    id: String(row.id),
    ruleNumber: Number(row.rule_number),
    currentText: typeof row.current_text === "string" ? row.current_text : "",
    proposedText: typeof row.proposed_text === "string" ? row.proposed_text : "",
    proposedBy: row.proposed_by === "Nicole" ? "Nicole" : "Remus",
    remusApproved: Boolean(row.remus_approved),
    nicoleApproved: Boolean(row.nicole_approved),
    createdAt: String(row.created_at),
  };
}

function toDatabaseCalendarEvent(event: CalendarEvent) {
  return {
    id: event.id,
    couple_id: COUPLE_ID,
    title: event.title,
    start_date: event.startDate,
    end_date: event.endDate,
    is_all_day: event.isAllDay,
    start_time: event.startTime || null,
    end_time: event.endTime || null,
    location: event.location || null,
    created_by: event.createdBy || "Remus",
    is_romantic: event.isRomantic || false,
    recurring: event.recurring || false,
  };
}

interface AppState {
  users: User[];
  currentUser: User | null;
  wishes: Wish[];
  calendarEvents: CalendarEvent[];
  houseRules: HouseRule[];
  houseRuleProposals: HouseRuleProposal[];
  loadedCalendarMonths: string[];
  availableTags: string[];
  syncError: string | null;
  isLoadingRemote: boolean;
  setCurrentUser: (u: User | null) => void;
  clearSyncError: () => void;
  loadRemoteData: (showLoading?: boolean) => Promise<void>;
  ensureCalendarMonths: (monthKey: string, showLoading?: boolean) => Promise<void>;
  refreshCalendarEvents: () => Promise<void>;
  loadHouseRules: () => Promise<void>;
  subscribeToRemoteData: () => () => void;
  addWish: (w: Wish) => void;
  updateWish: (w: Wish) => void;
  deleteWish: (id: string) => void;
  addCalendarEvent: (event: CalendarEvent) => Promise<boolean>;
  addCalendarEvents: (events: CalendarEvent[]) => Promise<boolean>;
  updateCalendarEvent: (event: CalendarEvent) => Promise<boolean>;
  deleteCalendarEvent: (id: string) => void;
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  lockExpiredHistories: () => void;
  submitHouseRuleProposal: (ruleNumber: number, text: string, proposedBy: UserRole) => Promise<boolean>;
  approveHouseRuleProposal: (proposalId: string, approvedBy: UserRole) => Promise<boolean>;
  rejectHouseRuleProposal: (proposalId: string) => Promise<boolean>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [
        { id: "u1", username: "Remus", password: "456789", displayName: "Remus", role: "Remus" },
        { id: "u2", username: "Nicole", password: "123456", displayName: "Nicole", role: "Nicole" },
      ],
      currentUser: null,
      wishes: [],
      calendarEvents: [],
      houseRules: Array.from({ length: 10 }, (_, index) => ({
        id: `local-rule-${index + 1}`,
        ruleNumber: index + 1,
        text: "",
      })),
      houseRuleProposals: [],
      loadedCalendarMonths: [],
      availableTags: defaultTags,
      syncError: null,
      isLoadingRemote: false,
      setCurrentUser: (u) => set({ currentUser: u }),
      clearSyncError: () => set({ syncError: null }),
      ensureCalendarMonths: async (monthKey, showLoading = true) => {
        if (!supabase) return;

        const window = getCalendarWindow(monthKey);
        const loadedMonths = get().loadedCalendarMonths;
        if (window.months.every((month) => loadedMonths.includes(month))) return;

        const requestKey = `${window.startDate}:${window.endDate}`;
        const existingRequest = calendarLoadPromises.get(requestKey);
        if (existingRequest) {
          await existingRequest;
          return;
        }

        const request = (async () => {
          if (showLoading) {
            visibleRemoteLoadCount += 1;
            set({ isLoadingRemote: true });
          }

          try {
            const events = await fetchCalendarEvents(window.startDate, window.endDate);
            set((state) => {
              const eventMap = new Map(state.calendarEvents.map((event) => [event.id, event]));
              events.forEach((event) => eventMap.set(event.id, event));
              return {
                calendarEvents: Array.from(eventMap.values()),
                loadedCalendarMonths: Array.from(new Set([...state.loadedCalendarMonths, ...window.months])).sort(),
                syncError: null,
              };
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            set({ syncError: `讀取行事曆失敗：${message}` });
            throw error;
          } finally {
            if (showLoading) {
              visibleRemoteLoadCount = Math.max(0, visibleRemoteLoadCount - 1);
              if (visibleRemoteLoadCount === 0) set({ isLoadingRemote: false });
            }
          }
        })();

        calendarLoadPromises.set(requestKey, request);
        try {
          await request;
        } finally {
          calendarLoadPromises.delete(requestKey);
        }
      },
      refreshCalendarEvents: async () => {
        if (!supabase) return;

        const loadedMonths = get().loadedCalendarMonths;
        if (loadedMonths.length === 0) {
          await get().ensureCalendarMonths(toMonthKey(new Date()), false);
          return;
        }

        const range = getLoadedCalendarRange(loadedMonths);
        try {
          const events = await fetchCalendarEvents(range.startDate, range.endDate);
          set({ calendarEvents: events, syncError: null });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set({ syncError: `讀取行事曆失敗：${message}` });
          throw error;
        }
      },
      loadHouseRules: async () => {
        if (!supabase) return;

        try {
          const [{ data: ruleRows, error: ruleError }, { data: proposalRows, error: proposalError }] = await Promise.all([
            supabase.from("house_rules").select("*").eq("couple_id", COUPLE_ID).order("rule_number"),
            supabase.from("house_rule_proposals").select("*").eq("couple_id", COUPLE_ID).order("created_at"),
          ]);
          if (ruleError) throw ruleError;
          if (proposalError) throw proposalError;

          const rules = Array.from({ length: 10 }, (_, index) => {
            const remoteRule = (ruleRows ?? [])
              .map((row) => fromDatabaseHouseRule(row as Record<string, unknown>))
              .find((rule) => rule.ruleNumber === index + 1);
            return remoteRule ?? {
              id: `local-rule-${index + 1}`,
              ruleNumber: index + 1,
              text: "",
            };
          });
          set({
            houseRules: rules,
            houseRuleProposals: (proposalRows ?? []).map((row) => fromDatabaseHouseRuleProposal(row as Record<string, unknown>)),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set({ syncError: `讀取家規失敗：${message}` });
        }
      },
      loadRemoteData: async (showLoading = false) => {
        if (!supabase) return;

        if (showLoading) {
          visibleRemoteLoadCount += 1;
          set({ isLoadingRemote: true });
        }

        try {
          const [
            { data: wishRows, error: wishError },
            { data: historyRows, error: historyError },
            { data: tagRows, error: tagError },
          ] = await Promise.all([
            supabase.from("wishMaster").select("*").eq("couple_id", COUPLE_ID).order("created_at", { ascending: false }),
            supabase.from("wishHistory").select("*").eq("couple_id", COUPLE_ID).order("completed_at", { ascending: false }),
            supabase.from("wish_tags").select("name").eq("couple_id", COUPLE_ID).order("name"),
          ]);

          if (wishError) {
            set({ syncError: `讀取願望失敗：${wishError.message}` });
            throw wishError;
          }
          if (historyError) {
            set({ syncError: `讀取完成紀錄失敗：${historyError.message}` });
            throw historyError;
          }
          if (tagError) {
            set({ syncError: `讀取 Tag 失敗：${tagError.message}` });
            throw tagError;
          }
          const historyByWish = new Map<string, WishHistory[]>();
          for (const row of historyRows ?? []) {
            const databaseRow = row as Record<string, unknown>;
            const wishId = String(databaseRow.wish_id);
            const history = historyByWish.get(wishId) ?? [];
            history.push(fromDatabaseWishHistory(databaseRow));
            historyByWish.set(wishId, history);
          }

          set({
            wishes: (wishRows ?? []).map((row) => {
              const databaseRow = row as Record<string, unknown>;
              return fromDatabaseWish(
                databaseRow,
                historyByWish.get(String(databaseRow.id)) ?? [],
              );
            }),
            availableTags: tagRows?.length ? tagRows.map((row) => row.name) : defaultTags,
            syncError: null,
          });

          await get().loadHouseRules();

          if (showLoading) {
            await get().refreshCalendarEvents();
          } else {
            await get().ensureCalendarMonths(toMonthKey(new Date()), false);
          }
        } finally {
          if (showLoading) {
            visibleRemoteLoadCount = Math.max(0, visibleRemoteLoadCount - 1);
            if (visibleRemoteLoadCount === 0) set({ isLoadingRemote: false });
          }
        }
      },
      subscribeToRemoteData: () => {
        if (!supabase) return () => undefined;

        const channel = supabase
          .channel("nr-wishlist-sync")
          .on("postgres_changes", { event: "*", schema: "public", table: "wishMaster", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "wishHistory", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "wish_tags", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().refreshCalendarEvents().catch((error) => {
              console.error("Unable to refresh calendar data", error);
            });
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "house_rules", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadHouseRules();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "house_rule_proposals", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadHouseRules();
          })
          .subscribe();

        return () => {
          void supabase.removeChannel(channel);
        };
      },
      addWish: async (w) => {
        set((s) => ({ wishes: [w, ...s.wishes] }));
        if (!supabase) return;
        const { error } = await supabase.from("wishMaster").insert(toDatabaseWishMaster(w));
        if (error) {
          set((s) => ({ wishes: s.wishes.filter((item) => item.id !== w.id), syncError: `新增願望失敗：${error.message}` }));
          return;
        }
        if (w.history.length > 0) {
          const { error: historyError } = await supabase
            .from("wishHistory")
            .insert(w.history.map((history) => toDatabaseWishHistory(w.id, history)));
          if (historyError) {
            set({ syncError: `新增完成紀錄失敗：${historyError.message}` });
            await get().loadRemoteData();
            return;
          }
        }
        await get().loadRemoteData();
      },
      updateWish: async (w) => {
        const previousWish = get().wishes.find((item) => item.id === w.id);
        set((s) => ({ wishes: s.wishes.map((x) => (x.id === w.id ? w : x)) }));
        if (!supabase) return;
        const { error } = await supabase
          .from("wishMaster")
          .update(toDatabaseWishMaster(w))
          .eq("id", w.id)
          .eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `更新願望失敗：${error.message}` });
          return;
        }

        const { error: historyError } = await supabase
          .from("wishHistory")
          .upsert(w.history.map((history) => toDatabaseWishHistory(w.id, history)));
        if (historyError) {
          set({ syncError: `更新完成紀錄失敗：${historyError.message}` });
          await get().loadRemoteData();
          return;
        }

        const currentHistoryIds = new Set(w.history.map((history) => history.id));
        const removedHistoryIds = (previousWish?.history ?? [])
          .map((history) => history.id)
          .filter((historyId) => !currentHistoryIds.has(historyId));
        if (removedHistoryIds.length > 0) {
          const { error: deleteHistoryError } = await supabase
            .from("wishHistory")
            .delete()
            .eq("wish_id", w.id)
            .eq("couple_id", COUPLE_ID)
            .in("id", removedHistoryIds);
          if (deleteHistoryError) {
            set({ syncError: `刪除完成紀錄失敗：${deleteHistoryError.message}` });
            await get().loadRemoteData();
            return;
          }
        }
        await get().loadRemoteData();
      },
      deleteWish: async (id) => {
        set((s) => ({ wishes: s.wishes.filter((x) => x.id !== id) }));
        if (!supabase) return;
        const { error } = await supabase
          .from("wishMaster")
          .delete()
          .eq("id", id)
          .eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `刪除願望失敗：${error.message}` });
          return;
        }
        await get().loadRemoteData();
      },
      addCalendarEvent: async (event) => {
        set((state) => ({ calendarEvents: [...state.calendarEvents, event] }));
        if (!supabase) return true;
        const { error } = await supabase.from("calendar_events").insert(toDatabaseCalendarEvent(event));
        if (error) {
          set((state) => ({
            calendarEvents: state.calendarEvents.filter((item) => item.id !== event.id),
            syncError: `新增活動失敗：${error.message}`,
          }));
          return false;
        }
        try {
          await get().refreshCalendarEvents();
        } catch {
          set((state) => ({
            calendarEvents: state.calendarEvents.filter((item) => item.id !== event.id),
          }));
          return false;
        }
        return true;
      },
      addCalendarEvents: async (events) => {
        if (events.length === 0) return true;
        set((state) => ({ calendarEvents: [...state.calendarEvents, ...events] }));
        if (!supabase) return true;
        const { error } = await supabase
          .from("calendar_events")
          .insert(events.map(toDatabaseCalendarEvent));
        if (error) {
          set((state) => ({
            calendarEvents: state.calendarEvents.filter(
              (item) => !events.some((event) => event.id === item.id),
            ),
            syncError: `新增重覆活動失敗：${error.message}`,
          }));
          return false;
        }
        try {
          await get().refreshCalendarEvents();
        } catch {
          set((state) => ({
            calendarEvents: state.calendarEvents.filter(
              (item) => !events.some((event) => event.id === item.id),
            ),
          }));
          return false;
        }
        return true;
      },
      updateCalendarEvent: async (event) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((item) =>
            item.id === event.id ? event : item,
          ),
        }));
        if (!supabase) return true;
        const { error } = await supabase
          .from("calendar_events")
          .update(toDatabaseCalendarEvent(event))
          .eq("id", event.id)
          .eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `更新活動失敗：${error.message}` });
          await get().refreshCalendarEvents();
          return false;
        }
        await get().refreshCalendarEvents();
        return true;
      },
      deleteCalendarEvent: async (id) => {
        set((state) => ({ calendarEvents: state.calendarEvents.filter((event) => event.id !== id) }));
        if (!supabase) return;
        const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `刪除活動失敗：${error.message}` });
          return;
        }
        await get().refreshCalendarEvents();
      },
      addTag: (tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return;
        const current = get().availableTags;
        if (!current.includes(trimmed)) {
          set({ availableTags: [...current, trimmed] });
          if (supabase) {
            void supabase.from("wish_tags").insert({ couple_id: COUPLE_ID, name: trimmed }).then(({ error }) => {
              if (error) set({ syncError: `新增 Tag 失敗：${error.message}` });
              else void get().loadRemoteData();
            });
          }
        }
      },
      deleteTag: (tag) => {
        set((s) => ({ availableTags: s.availableTags.filter((t) => t !== tag) }));
        if (supabase) {
          void supabase.from("wish_tags").delete().eq("couple_id", COUPLE_ID).eq("name", tag).then(({ error }) => {
            if (error) set({ syncError: `刪除 Tag 失敗：${error.message}` });
            else void get().loadRemoteData();
          });
        }
      },
      submitHouseRuleProposal: async (ruleNumber, text, proposedBy) => {
        const trimmedText = text.trim();
        const currentRule = get().houseRules.find((rule) => rule.ruleNumber === ruleNumber);
        if (ruleNumber < 1 || ruleNumber > 10 || (!trimmedText && !currentRule?.text.trim())) return false;
        if (get().houseRuleProposals.some((proposal) => proposal.ruleNumber === ruleNumber)) {
          set({ syncError: "呢條家規已經有待確認修改。" });
          return false;
        }

        const proposal: HouseRuleProposal = {
          id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `rule-proposal-${Date.now()}`,
          ruleNumber,
          currentText: currentRule?.text ?? "",
          proposedText: trimmedText,
          proposedBy,
          remusApproved: proposedBy === "Remus",
          nicoleApproved: proposedBy === "Nicole",
          createdAt: new Date().toISOString(),
        };

        if (!supabase) {
          set((state) => ({ houseRuleProposals: [...state.houseRuleProposals, proposal] }));
          return true;
        }

        const { error } = await supabase.from("house_rule_proposals").insert({
          id: proposal.id,
          couple_id: COUPLE_ID,
          rule_number: proposal.ruleNumber,
          current_text: proposal.currentText,
          proposed_text: proposal.proposedText,
          proposed_by: proposal.proposedBy,
          remus_approved: proposal.remusApproved,
          nicole_approved: proposal.nicoleApproved,
          created_at: proposal.createdAt,
        });
        if (error) {
          set({ syncError: `提交家規修改失敗：${error.message}` });
          return false;
        }
        set((state) => ({
          houseRuleProposals: [...state.houseRuleProposals, proposal],
          syncError: null,
        }));
        await get().loadHouseRules();
        return true;
      },
      approveHouseRuleProposal: async (proposalId, approvedBy) => {
        const proposal = get().houseRuleProposals.find((item) => item.id === proposalId);
        if (!proposal) return false;
        const nextProposal = {
          ...proposal,
          remusApproved: proposal.remusApproved || approvedBy === "Remus",
          nicoleApproved: proposal.nicoleApproved || approvedBy === "Nicole",
        };
        const isFullyApproved = nextProposal.remusApproved && nextProposal.nicoleApproved;

        if (!supabase) {
          set((state) => ({
            houseRules: isFullyApproved
              ? state.houseRules.map((rule) => rule.ruleNumber === proposal.ruleNumber
                ? { ...rule, text: proposal.proposedText, updatedBy: approvedBy, updatedAt: new Date().toISOString() }
                : rule)
              : state.houseRules,
            houseRuleProposals: isFullyApproved
              ? state.houseRuleProposals.filter((item) => item.id !== proposalId)
              : state.houseRuleProposals.map((item) => item.id === proposalId ? nextProposal : item),
          }));
          return true;
        }

        const { error: proposalError } = await supabase
          .from("house_rule_proposals")
          .update({
            remus_approved: nextProposal.remusApproved,
            nicole_approved: nextProposal.nicoleApproved,
          })
          .eq("id", proposalId)
          .eq("couple_id", COUPLE_ID);
        if (proposalError) {
          set({ syncError: `確認家規修改失敗：${proposalError.message}` });
          return false;
        }

        if (isFullyApproved) {
          const { error: ruleError } = await supabase
            .from("house_rules")
            .update({ text: proposal.proposedText, updated_by: approvedBy, updated_at: new Date().toISOString() })
            .eq("rule_number", proposal.ruleNumber)
            .eq("couple_id", COUPLE_ID);
          if (ruleError) {
            set({ syncError: `套用家規修改失敗：${ruleError.message}` });
            return false;
          }
          await supabase.from("house_rule_proposals").delete().eq("id", proposalId).eq("couple_id", COUPLE_ID);
        }
        await get().loadHouseRules();
        return true;
      },
      rejectHouseRuleProposal: async (proposalId) => {
        if (!supabase) {
          set((state) => ({ houseRuleProposals: state.houseRuleProposals.filter((proposal) => proposal.id !== proposalId) }));
          return true;
        }
        const { error } = await supabase
          .from("house_rule_proposals")
          .delete()
          .eq("id", proposalId)
          .eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `拒絕家規修改失敗：${error.message}` });
          return false;
        }
        await get().loadHouseRules();
        return true;
      },
      lockExpiredHistories: () => {
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        set((s) => ({
          wishes: s.wishes.map((w) => ({
            ...w,
            history: w.history.map((h) => {
              const compTime = new Date(h.completedAt).getTime();
              if (!isNaN(compTime) && now - compTime > TWO_DAYS_MS) {
                return { ...h, isLocked: true };
              }
              return h;
            }),
          })),
        }));
      },
    }),
    {
      name: "nr-wishlist-storage",
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
