import React from "react";
import { useStore } from "./store";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const user = useStore((s) => s.currentUser);
  return <div className="min-h-screen bg-surface">{user ? <HomePage /> : <LoginPage />}</div>;
}
