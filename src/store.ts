import create from "zustand";
import { persist } from "zustand/middleware";
import { CalendarEvent, User, Wish } from "./types";
import { supabase } from "./supabase";

const COUPLE_ID = "remus-nicole";

const defaultTags = ["約會", "禮物", "旅行", "日常生活", "驚喜", "美食", "浪漫"];

function fromDatabaseWish(row: Record<string, unknown>): Wish {
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
    history: Array.isArray(row.history) ? row.history as Wish["history"] : [],
  };
}

function toDatabaseWish(wish: Wish) {
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
    history: wish.history,
  };
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
  availableTags: string[];
  syncError: string | null;
  setCurrentUser: (u: User | null) => void;
  clearSyncError: () => void;
  loadRemoteData: () => Promise<void>;
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
      availableTags: defaultTags,
      syncError: null,
      setCurrentUser: (u) => set({ currentUser: u }),
      clearSyncError: () => set({ syncError: null }),
      loadRemoteData: async () => {
        if (!supabase) return;

        const [{ data: wishRows, error: wishError }, { data: tagRows, error: tagError }, { data: calendarRows, error: calendarError }] = await Promise.all([
          supabase.from("wishes").select("*").eq("couple_id", COUPLE_ID).order("created_at", { ascending: false }),
          supabase.from("wish_tags").select("name").eq("couple_id", COUPLE_ID).order("name"),
          supabase.from("calendar_events").select("*").eq("couple_id", COUPLE_ID).order("start_date").order("start_time"),
        ]);

        if (wishError) {
          set({ syncError: `讀取願望失敗：${wishError.message}` });
          throw wishError;
        }
        if (tagError) {
          set({ syncError: `讀取 Tag 失敗：${tagError.message}` });
          throw tagError;
        }
        if (calendarError) {
          set({ syncError: `讀取行事曆失敗：${calendarError.message}` });
          throw calendarError;
        }

        set({
          wishes: (wishRows ?? []).map((row) => fromDatabaseWish(row as Record<string, unknown>)),
          availableTags: tagRows?.length ? tagRows.map((row) => row.name) : defaultTags,
          calendarEvents: (calendarRows ?? []).map((row) => fromDatabaseCalendarEvent(row as Record<string, unknown>)),
          syncError: null,
        });
      },
      subscribeToRemoteData: () => {
        if (!supabase) return () => undefined;

        const channel = supabase
          .channel("nr-wishlist-sync")
          .on("postgres_changes", { event: "*", schema: "public", table: "wishes", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "wish_tags", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events", filter: `couple_id=eq.${COUPLE_ID}` }, () => {
            void get().loadRemoteData();
          })
          .subscribe();

        return () => {
          void supabase.removeChannel(channel);
        };
      },
      addWish: async (w) => {
        set((s) => ({ wishes: [w, ...s.wishes] }));
        if (!supabase) return;
        const { error } = await supabase.from("wishes").insert(toDatabaseWish(w));
        if (error) {
          set((s) => ({ wishes: s.wishes.filter((item) => item.id !== w.id), syncError: `新增願望失敗：${error.message}` }));
          return;
        }
        await get().loadRemoteData();
      },
      updateWish: async (w) => {
        set((s) => ({ wishes: s.wishes.map((x) => (x.id === w.id ? w : x)) }));
        if (!supabase) return;
        const { error } = await supabase.from("wishes").update(toDatabaseWish(w)).eq("id", w.id).eq("couple_id", COUPLE_ID);
        if (error) {
          set({ syncError: `更新願望失敗：${error.message}` });
          return;
        }
        await get().loadRemoteData();
      },
      deleteWish: async (id) => {
        set((s) => ({ wishes: s.wishes.filter((x) => x.id !== id) }));
        if (!supabase) return;
        const { error } = await supabase.from("wishes").delete().eq("id", id).eq("couple_id", COUPLE_ID);
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
          await get().loadRemoteData();
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
          await get().loadRemoteData();
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
          await get().loadRemoteData();
          return false;
        }
        await get().loadRemoteData();
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
        await get().loadRemoteData();
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
