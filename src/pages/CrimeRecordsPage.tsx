import React, { useState } from "react";
import { useStore } from "../store";
import { CrimeStatus, UserRole } from "../types";
import ConfirmModal from "../components/ConfirmModal";

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CrimeRecordsPage() {
  const currentUser = useStore((state) => state.currentUser);
  const houseRules = useStore((state) => state.houseRules);
  const crimeRecords = useStore((state) => state.crimeRecords);
  const proposals = useStore((state) => state.crimeRecordProposals);
  const syncError = useStore((state) => state.syncError);
  const submitProposal = useStore((state) => state.submitCrimeRecordProposal);
  const submitCrimeRecordUpdate = useStore((state) => state.submitCrimeRecordUpdate);
  const confirmProposal = useStore((state) => state.confirmCrimeRecordProposal);
  const rejectProposal = useStore((state) => state.rejectCrimeRecordProposal);
  const [showForm, setShowForm] = useState(false);
  const [incidentDate, setIncidentDate] = useState(getToday);
  const [ruleNumber, setRuleNumber] = useState("");
  const [description, setDescription] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<CrimeStatus>("未處理");
  const [editingPunishment, setEditingPunishment] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingStatusSave, setPendingStatusSave] = useState<{ id: string; punishment: string } | null>(null);

  const currentRole = currentUser?.role ?? "Remus";
  const isRemus = currentRole === "Remus";
  const offender: UserRole = isRemus ? "Nicole" : "Remus";

  function resetForm() {
    setIncidentDate(getToday());
    setRuleNumber("");
    setDescription("");
    setShowForm(false);
  }

  function startEditing(record: typeof crimeRecords[number]) {
    setEditingRecordId(record.id);
    setEditingStatus(record.status);
    setEditingPunishment(record.punishment);
  }

  function cancelEditing() {
    setEditingRecordId(null);
    setEditingPunishment("");
  }

  async function saveRecordDetails(id: string) {
    const record = crimeRecords.find((item) => item.id === id);
    if (editingStatus === "錫返了" && record?.status !== "錫返了") {
      setPendingStatusSave({ id, punishment: editingPunishment });
      return;
    }
    await submitRecordDetails(id, editingStatus, editingPunishment);
  }

  async function submitRecordDetails(id: string, status: CrimeStatus, punishment: string) {
    setActionError("");
    setSaving(true);
    const saved = await submitCrimeRecordUpdate(id, status, punishment, currentRole);
    setSaving(false);
    if (saved) cancelEditing();
    else setActionError(syncError || "更新未成功，請稍後再試。 ");
  }

  async function submitCrime() {
    if (!incidentDate || !description.trim()) return;
    setActionError("");
    setSaving(true);
    const saved = await submitProposal({
      incidentDate,
      offender,
      ruleNumber: ruleNumber ? Number(ruleNumber) : undefined,
      description,
      status: "未處理",
      punishment: "",
    }, currentRole);
    setSaving(false);
    if (saved) {
      resetForm();
    } else {
      setActionError(syncError || "提交未成功，請檢查網絡或資料庫設定後再試。 ");
    }
  }

  async function confirmCrime(id: string) {
    setActionError("");
    setSaving(true);
    const confirmed = await confirmProposal(id, currentRole);
    setSaving(false);
    if (!confirmed) setActionError(syncError || "確認未成功，請稍後再試。 ");
  }

  async function rejectCrime(id: string) {
    setActionError("");
    setSaving(true);
    const rejected = await rejectProposal(id);
    setSaving(false);
    if (!rejected) setActionError(syncError || "拒絕未成功，請稍後再試。 ");
  }

  function ruleLabel(ruleNumber?: number, ruleText?: string) {
    if (!ruleNumber) return "其他事件";
    if (ruleText) return `家規 ${ruleNumber}：${ruleText}`;
    const rule = houseRules.find((item) => item.ruleNumber === ruleNumber);
    return rule?.text ? `家規 ${ruleNumber}：${rule.text}` : `家規 ${ruleNumber}`;
  }

  const pendingProposals = [
    ...proposals.filter((proposal) => !proposal.recordId),
    ...proposals.filter((proposal) => Boolean(proposal.recordId)),
  ];

  return (
    <section className="space-y-4">
      {(actionError || syncError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
          {actionError || syncError}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm((value) => !value)}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.99] ${isRemus ? "bg-blue-600" : "bg-pink-600"}`}
      >
        {showForm ? "收起新增案件" : "＋ 新增犯罪紀錄"}
      </button>

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              犯案日期
              <div className="mt-1.5 min-w-0 overflow-hidden rounded-xl">
                <input type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} className="box-border min-w-0 w-full max-w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
              </div>
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              犯案人
              <div className="mt-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-rose-900/70 dark:bg-rose-950/45 dark:text-rose-200">
                {offender}
              </div>
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
            違反家規
            <select value={ruleNumber} onChange={(event) => setRuleNumber(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <option value="">其他事件</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => {
                const rule = houseRules.find((item) => item.ruleNumber === number);
                return <option key={number} value={number}>家規 {number}{rule?.text ? `：${rule.text}` : ""}</option>;
              })}
            </select>
          </label>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
            發生咩事
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="例如：偷食咗對方留低嘅蛋糕，仲扮唔知。" className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </label>
          <button type="button" disabled={saving || !incidentDate || !description.trim()} onClick={() => void submitCrime()} className={`w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}>
            提交，等對方確認
          </button>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="space-y-2">
          {pendingProposals.map((proposal, index) => {
            const canConfirm = proposal.proposedBy !== currentRole;
            const isUpdate = Boolean(proposal.recordId);
            const firstCaseIndex = pendingProposals.findIndex((item) => !item.recordId);
            const firstUpdateIndex = pendingProposals.findIndex((item) => Boolean(item.recordId));
            return (
              <React.Fragment key={`${proposal.id}-${proposal.status}-${proposal.punishment}-${proposal.proposedBy}`}>
                {index === firstCaseIndex && <h2 className="rounded-xl border border-amber-200 bg-amber-100 px-3 py-2 text-sm font-black text-amber-900 dark:border-amber-800/70 dark:bg-[#292315] dark:text-amber-100">待確認案件</h2>}
                {index === firstUpdateIndex && <h2 className="rounded-xl border border-rose-200 bg-rose-100 px-3 py-2 text-sm font-black text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/45 dark:text-rose-100">待確認懲罰／狀態修改</h2>}
                <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800/70 dark:bg-[#292315]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-100">
                      <span>{isUpdate ? "修改犯罪紀錄" : formatDate(proposal.incidentDate)}</span>
                      <span>· {proposal.offender} 被控</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-amber-950 dark:text-amber-50">{proposal.description}</p>
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">{ruleLabel(proposal.ruleNumber, proposal.ruleText)} · {proposal.proposedBy} 提交</p>
                    <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-100">狀態：{proposal.status}{proposal.punishment ? ` · 懲罰：${proposal.punishment}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xl" aria-hidden="true">⚖️</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canConfirm ? (
                    <button type="button" disabled={saving} onClick={() => void confirmCrime(proposal.id)} className={`touch-manipulation rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}>確認案件</button>
                  ) : (
                    <span className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-[#171717]/70 dark:text-amber-200">等對方確認</span>
                  )}
                  <button type="button" disabled={saving} onClick={() => void rejectCrime(proposal.id)} className="touch-manipulation rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50 dark:border-amber-700 dark:text-amber-100">{proposal.proposedBy === currentRole ? "取消" : "拒絕"}</button>
                </div>
                </article>
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">已確認紀錄</h2>
        {crimeRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">暫時未有犯罪紀錄，大家都好乖。</div>
        ) : (
          crimeRecords.map((record, index) => (
            <article key={record.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600 dark:bg-rose-950/60 dark:text-rose-200">#{crimeRecords.length - index}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span>{formatDate(record.incidentDate)}</span>
                    <span>· {record.offender} 犯案</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-gray-800 dark:text-gray-100">{record.description}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{ruleLabel(record.ruleNumber, record.ruleText)} · {record.confirmedBy} 已確認</p>
                  {editingRecordId === record.id ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value as CrimeStatus)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                          <option value="未處理">未處理</option>
                          <option value="錫返了">錫返了</option>
                        </select>
                        <input value={editingPunishment} onChange={(event) => setEditingPunishment(event.target.value)} placeholder="懲罰／處理方式" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500" />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled={saving} onClick={() => void saveRecordDetails(record.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}>儲存</button>
                        <button type="button" disabled={saving} onClick={cancelEditing} className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">狀態：{record.status}{record.punishment ? ` · 懲罰：${record.punishment}` : ""}</p>
                      {record.recordedBy === currentRole && record.status !== "錫返了" && !proposals.some((proposal) => proposal.recordId === record.id) && <button type="button" onClick={() => startEditing(record)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-200">提出修改</button>}
                      {record.recordedBy === currentRole && proposals.some((proposal) => proposal.recordId === record.id) && <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">等對方確認修改</span>}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingStatusSave)}
        title="確認已經錫返了？"
        message="一旦確認，呢宗犯罪紀錄之後就唔可以再修改狀態同懲罰。"
        confirmText="確認錫返了"
        cancelText="再諗吓"
        onCancel={() => setPendingStatusSave(null)}
        onConfirm={() => {
          if (!pendingStatusSave) return;
          const { id, punishment } = pendingStatusSave;
          setPendingStatusSave(null);
          void submitRecordDetails(id, "錫返了", punishment);
        }}
      />
    </section>
  );
}
