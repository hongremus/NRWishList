import React, { useState } from "react";
import { useStore } from "../store";

export default function LoginPage() {
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  function doLogin() {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password);
    if (u) {
      setCurrentUser(u);
      setErr("");
      localStorage.setItem("nr-current-user", JSON.stringify(u));
    } else {
      setErr("登入失敗：帳號或密碼錯誤");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-pink-400 to-blue-400 rounded-full flex items-center justify-center text-3xl shadow-md mb-2">
            ✨
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            NR Wish List
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">專屬於我們的雙人許願清單 💕</p>
        </div>

        {/* 手動輸入登入 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">使用者名稱</label>
            <input
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              placeholder="請輸入帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">密碼</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="mt-5 text-center text-[11px] text-gray-400">v1.0.4</div>
      </div>
    </div>
  );
}
