import React, { useState } from "react";
import { useStore } from "../store";
import { HouseRule } from "../types";

function getRuleText(rule: HouseRule | undefined) {
  return rule?.text ?? "";
}

export default function HouseRulesPage() {
  const currentUser = useStore((state) => state.currentUser);
  const houseRules = useStore((state) => state.houseRules);
  const proposals = useStore((state) => state.houseRuleProposals);
  const syncError = useStore((state) => state.syncError);
  const submitProposal = useStore((state) => state.submitHouseRuleProposal);
  const approveProposal = useStore((state) => state.approveHouseRuleProposal);
  const rejectProposal = useStore((state) => state.rejectHouseRuleProposal);
  const [editingRuleNumber, setEditingRuleNumber] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const currentRole = currentUser?.role ?? "Remus";
  const isRemus = currentRole === "Remus";

  function openEditor(ruleNumber: number) {
    const rule = houseRules.find((item) => item.ruleNumber === ruleNumber);
    setEditingRuleNumber(ruleNumber);
    setDraftText(getRuleText(rule));
  }

  function closeEditor() {
    setEditingRuleNumber(null);
    setDraftText("");
  }

  async function saveProposal(ruleNumber: number) {
    const rule = houseRules.find((item) => item.ruleNumber === ruleNumber);
    if (!draftText.trim() && !getRuleText(rule).trim()) return;
    setActionError("");
    setSaving(true);
    const saved = await submitProposal(ruleNumber, draftText, currentRole);
    setSaving(false);
    if (saved) {
      closeEditor();
    } else {
      setActionError(syncError || "提交未成功，請檢查網絡或資料庫設定後再試。 ");
    }
  }

  async function handleApprove(proposalId: string) {
    setActionError("");
    setSaving(true);
    await approveProposal(proposalId, currentRole);
    setSaving(false);
  }

  async function handleReject(proposalId: string) {
    setActionError("");
    setSaving(true);
    await rejectProposal(proposalId);
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      <div className={`rounded-3xl p-5 text-white shadow-lg ${isRemus ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gradient-to-br from-pink-500 to-rose-600"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Our little constitution</p>
            <h1 className="mt-1 text-2xl font-black">家規</h1>
            <p className="mt-2 text-sm leading-6 text-white/85">一齊寫低我哋想守住嘅十件事。</p>
          </div>
          <span className="text-4xl" aria-hidden="true">📜</span>
        </div>
      </div>

      <div className="space-y-2">
        {(actionError || syncError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            {actionError || syncError}
          </div>
        )}
        {Array.from({ length: 10 }, (_, index) => index + 1).map((ruleNumber) => {
          const rule = houseRules.find((item) => item.ruleNumber === ruleNumber);
          const proposal = proposals.find((item) => item.ruleNumber === ruleNumber);
          const isEditing = editingRuleNumber === ruleNumber;
          const hasText = Boolean(rule?.text.trim());
          const currentUserApproved = proposal && (isRemus ? proposal.remusApproved : proposal.nicoleApproved);

          return (
            <article key={ruleNumber} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}>
                  {ruleNumber}
                </span>
                <div className="min-w-0 flex-1">
                  {hasText ? (
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-gray-800 dark:text-gray-100">{rule?.text}</p>
                  ) : (
                    <p className="py-1 text-sm italic text-gray-400">仲未寫低家規</p>
                  )}

                  {proposal && (
                    <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-900/20">
                      <div className="font-bold text-amber-800 dark:text-amber-200">待共同確認嘅修改</div>
                      <p className="whitespace-pre-wrap break-words leading-5 text-amber-900 dark:text-amber-100">{proposal.proposedText || "（清空呢條家規）"}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-amber-700 dark:text-amber-300">
                        <span>{proposal.proposedBy} 提議</span>
                        <span>{proposal.remusApproved ? "✓ Remus" : "○ Remus"}</span>
                        <span>{proposal.nicoleApproved ? "✓ Nicole" : "○ Nicole"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {!currentUserApproved && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleApprove(proposal.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}
                          >
                            確認修改
                          </button>
                        )}
                        {currentUserApproved && (
                          <span className="rounded-lg bg-white/70 px-3 py-1.5 font-semibold text-amber-700 dark:bg-gray-900/50 dark:text-amber-300">等對方確認</span>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleReject(proposal.id)}
                          className="rounded-lg border border-amber-300 px-3 py-1.5 font-semibold text-amber-800 disabled:opacity-50 dark:border-amber-700 dark:text-amber-200"
                        >
                          拒絕
                        </button>
                      </div>
                    </div>
                  )}

                  {!proposal && !isEditing && (
                    <button
                      type="button"
                      onClick={() => openEditor(ruleNumber)}
                      className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-bold ${hasText ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" : isRemus ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" : "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"}`}
                    >
                      {hasText ? "提出修改" : "＋ 設定家規"}
                    </button>
                  )}

                  {isEditing && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        autoFocus
                        value={draftText}
                        onChange={(event) => setDraftText(event.target.value)}
                        placeholder="寫低我哋想遵守嘅家規..."
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving || (!draftText.trim() && !hasText)}
                          onClick={() => void saveProposal(ruleNumber)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${isRemus ? "bg-blue-500" : "bg-pink-500"}`}
                        >
                          提交共同確認
                        </button>
                        <button type="button" onClick={closeEditor} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
