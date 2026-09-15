import React, { useState } from "react";
import { useStore } from "../store";

const relationshipStart = new Date(2026, 8, 12);

function getRelationshipDuration() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let years = today.getFullYear() - relationshipStart.getFullYear();
  let anniversary = new Date(
    relationshipStart.getFullYear() + years,
    relationshipStart.getMonth(),
    relationshipStart.getDate(),
  );

  if (anniversary > today) {
    years -= 1;
    anniversary = new Date(
      relationshipStart.getFullYear() + years,
      relationshipStart.getMonth(),
      relationshipStart.getDate(),
    );
  }

  let months = today.getMonth() - anniversary.getMonth();
  if (today.getDate() < anniversary.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    months += 12;
  }

  const monthStart = new Date(
    anniversary.getFullYear(),
    anniversary.getMonth() + months,
    anniversary.getDate(),
  );
  const toDateNumber = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const elapsedDays = Math.floor(
    (toDateNumber(today) - toDateNumber(monthStart)) / (1000 * 60 * 60 * 24),
  );
  const days = years === 0 && months === 0 ? elapsedDays + 1 : elapsedDays;

  return [
    years > 0 ? `${years}年` : "",
    months > 0 ? `${months}個月` : "",
    days > 0 ? `${days}日` : "",
  ]
    .filter(Boolean)
    .join("");
}

export default function LoginPage() {
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");

  function doLogin() {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
    if (u) {
      setCurrentUser(u);
      setErr("");
      localStorage.setItem("nr-current-user", JSON.stringify(u));
    } else {
      setErr("登入唔到：搵唔到呢個帳號");
    }
  }

  return (
    <div className="login-page min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50">
        <div className="text-center mb-6">
          <img
            src="/nr-wishlist-icon.svg"
            alt="NR Wish List"
            className="w-16 h-16 mx-auto rounded-2xl shadow-md mb-2"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            NR Wish List
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">我哋兩個嘅願望清單 💕</p>
        </div>

        {/* 手動輸入登入 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">帳號</label>
            <input
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              placeholder="輸入你個帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doLogin()}
            />
          </div>
          {err && <div className="text-red-500 text-sm text-center bg-red-50 py-1.5 px-3 rounded-lg">{err}</div>}

          <button
            className="w-full py-3 bg-gray-800 text-white font-medium text-base rounded-xl shadow-md hover:bg-gray-900 active:scale-95 transition-all"
            onClick={doLogin}
          >
            登入
          </button>
        </div>

        <div className="mt-5 text-center text-[11px] text-gray-400">
          <div>v1.1.2</div>
          <div>Since 2026.9.12 · 我哋已經一齊咗 {getRelationshipDuration()}啦🥰</div>
        </div>
      </div>
    </div>
  );
}
