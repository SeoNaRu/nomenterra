// 채팅/명령 패널 — 입력 후 엔터로 전송, 전송한 커맨드가 위에 쌓임. 입력창은 아래 고정.
// 벽면에 있는 글자 수만큼만 입력 가능 (예: A 194개 초과 불가)

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useSceneStore } from "@/store/sceneStore";
import { getMaxLetterCounts } from "@/components/scenes/lithosRoom/wallTexts";

/** 로그 영역 비율(0~1). 위에 로그 보이는 창 */
const LOG_AREA_RATIO = 0.7;
/** 입력창 비율(0~1). 아래 커맨드 입력창 */
const INPUT_AREA_RATIO = 0.3;

const MAX_LETTER_COUNTS = getMaxLetterCounts();

/** 이미 씬에서 사용 중인 글자 수(전송된 글자) */
function useUsedLetterCounts(): Record<string, number> {
  const letters = useSceneStore((s) => s.letters);
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of letters) {
      counts[l.char] = (counts[l.char] ?? 0) + 1;
    }
    return counts;
  }, [letters]);
}

/** 새 입력값을 벽면 한도에 맞게 자름 — 각 글자별로 (입력+이미 사용) <= 벽면 개수 */
function capInputToWallLimits(
  newValue: string,
  usedCounts: Record<string, number>
): string {
  const current: Record<string, number> = { ...usedCounts };
  let result = "";
  const upper = newValue.toUpperCase();
  for (let i = 0; i < upper.length; i += 1) {
    const c = upper[i];
    if (/^[A-Z]$/.test(c)) {
      const max = MAX_LETTER_COUNTS[c] ?? 0;
      if ((current[c] ?? 0) < max) {
        current[c] = (current[c] ?? 0) + 1;
        result += newValue[i];
      }
    } else {
      result += newValue[i];
    }
  }
  return result;
}

export default function ChatPanel() {
  const addLetters = useSceneStore((s) => s.addLetters);
  const usedCounts = useUsedLetterCounts();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const sendCommand = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, trimmed]);
    setInput("");

    const chars = trimmed.toUpperCase().split("");
    addLetters(chars);
  }, [input, addLetters]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = capInputToWallLimits(e.target.value, usedCounts);
      setInput(next);
    },
    [usedCounts]
  );

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-900">
      {/* 위: 로그(전송한 커맨드) 70% — 왼쪽 위 정렬 */}
      <div
        className="flex min-h-0 flex-col overflow-y-auto px-3 py-2 text-left"
        style={{ flex: `${LOG_AREA_RATIO}` }}
      >
        <div className="text-left text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          COMMAND
        </div>
        <div className="mt-1 flex flex-col items-start space-y-1">
          {messages.length === 0 ? (
            <p className="text-left text-xs text-slate-400 dark:text-slate-500">
              커맨드 입력 후 엔터
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={`${i}-${msg}`}
                className="w-full rounded bg-white px-2 py-1 text-left text-sm font-mono text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              >
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 아래: 커맨드 입력창 30% — 왼쪽 위부터 입력 */}
      <div
        className="flex shrink-0 flex-col border-t border-slate-200 px-3 py-2 dark:border-slate-700"
        style={{ flex: `${INPUT_AREA_RATIO}` }}
      >
        <textarea
          className="h-full w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-left text-sm text-slate-900 outline-none ring-0 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          style={{ minHeight: 36 }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          placeholder="커맨드 입력 후 엔터"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendCommand();
            }
            if (e.key === "Escape") {
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          rows={2}
        />
      </div>
    </div>
  );
}
