import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import WishList from "../components/WishList";
import NewWishModal from "../components/NewWishModal";
import TagManagerModal from "../components/TagManagerModal";
import StatsModal from "../components/StatsModal";
import CalendarPage from "./CalendarPage";

export default function HomePage() {
  const currentUser = useStore((s) => s.currentUser);
  const syncError = useStore((s) => s.syncError);
  const clearSyncError = useStore((s) => s.clearSyncError);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const loadRemoteData = useStore((s) => s.loadRemoteData);
  const subscribeToRemoteData = useStore((s) => s.subscribeToRemoteData);
  const lockExpiredHistories = useStore((s) => s.lockExpiredHistories);

  const [showNew, setShowNew] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWishDetail, setShowWishDetail] = useState(false);
  const [activePage, setActivePage] = useState<"wishes" | "calendar">("wishes");

  const isRemus = currentUser?.username === "Remus";

  useEffect(() => {
    // 檢查是否有儲存登入狀態
    const raw = localStorage.getItem("nr-current-user");
    if (raw && !currentUser) {
      setCurrentUser(JSON.parse(raw));
    }
    void loadRemoteData().then(() => lockExpiredHistories()).catch((error) => {
      console.error("Unable to load shared wishlist data", error);
    });

    const unsubscribe = subscribeToRemoteData();
    return unsubscribe;
  }, [loadRemoteData, lockExpiredHistories, setCurrentUser, subscribeToRemoteData]);

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("nr-current-user");
  }

  // 根據角色自訂風格顏色
  const themeHeaderGradient = isRemus
    ? "from-blue-600 to-indigo-600 shadow-blue-500/20"
    : "from-pink-500 to-rose-500 shadow-pink-500/20";

  return (
    <div className="min-h-screen overflow-x-hidden transition-colors duration-300 bg-surface text-gray-900 pb-20">
      {/* 頂部 Header */}
      <header className={`bg-gradient-to-r ${themeHeaderGradient} text-white px-4 py-3 sm:px-6 sm:py-5 shadow-lg rounded-b-3xl`}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner">
              {isRemus ? "👦🏻" : "👧🏻"}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-white/80 font-medium">我哋嘅願望空間</div>
              <div className="font-bold text-base sm:text-lg flex items-center gap-1.5 truncate">
                <span className="truncate">{currentUser?.displayName || currentUser?.username}</span>
              </div>
            </div>
          </div>

          {/* 右側操作按鈕 */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowTagManager(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95 sm:h-11 sm:w-11"
              title="管理 Tag"
              aria-label="管理 Tag"
            >
              🏷️
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="flex h-10 w-10 items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-sm transition-all sm:h-11 sm:w-11"
              title="睇統計"
            >
              📊
            </button>
            <button
              onClick={logout}
              className="flex h-11 w-11 shrink-0 items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-sm transition-all"
              title="登出"
              aria-label="登出"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 主內容區塊 */}
      <main className="max-w-4xl mx-auto p-3 sm:p-6">
        {syncError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span>⚠️ {syncError}</span>
            <button onClick={clearSyncError} className="text-red-500 hover:text-red-700" aria-label="關閉同步錯誤">
              ✕
            </button>
          </div>
        )}

        <div className="mb-3 flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActivePage("wishes")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
              activePage === "wishes" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            願望清單
          </button>
          <button
            onClick={() => setActivePage("calendar")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
              activePage === "calendar" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            📅 行事曆
          </button>
        </div>

        {activePage === "wishes" ? <WishList onDetailChange={setShowWishDetail} /> : <CalendarPage />}
      </main>

      {/* 手機版右下角 Floating Action Button (新增願望) */}
      {activePage === "wishes" && !showNew && !showTagManager && !showStats && !showWishDetail && (
        <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 sm:bottom-8 sm:right-8 z-40">
          <button
            onClick={() => setShowNew(true)}
            className={`px-4 py-3 text-white font-bold rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-all border-2 border-white/40 bg-gradient-to-r ${themeHeaderGradient}`}
          >
            <span className="text-xl">✨</span>
            <span className="text-sm">許願</span>
          </button>
        </div>
      )}

      {/* Modals 彈窗 */}
      {showNew && <NewWishModal onClose={() => setShowNew(false)} />}
      {showTagManager && <TagManagerModal onClose={() => setShowTagManager(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}
