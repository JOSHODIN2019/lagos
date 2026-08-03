"use client";

// Stage 08
// Step 04
//
// Purpose: the chat-style Q&A UI for the AI Query Interpreter. Each turn
// shows the plain-language answer, with the generated Cypher available
// behind a "View query" toggle for transparency into how the answer was
// produced. Shares the same right-side slot as the other panels.

import { useState } from "react";
import { askAI } from "@/lib/api";
import { AIQueryResult } from "@/lib/types";

interface ChatTurn {
  id: string;
  result: AIQueryResult;
}

interface AIChatPanelProps {
  onClose: () => void;
  onResult: (result: AIQueryResult) => void;
}

const SUGGESTIONS = [
  "How many hospitals are there?",
  "List schools in Ikeja",
  "Which LGA has the most banks?",
];

export function AIChatPanel({ onClose, onResult }: AIChatPanelProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCypher, setExpandedCypher] = useState<string | null>(null);

  async function handleAsk(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    try {
      const result = await askAI(q);
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), result }]);
      onResult(result);
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          result: {
            question: q,
            cypher: null,
            answer: "Couldn't reach the AI service. Is Ollama running?",
            resultCount: 0,
            mapPoints: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside aria-label="Ask Lagos chat" className="absolute right-0 top-0 z-[1050] flex h-full w-full max-w-sm translate-x-0 transform flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ask Lagos
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Answers come from a local AI reading the live map data.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="px-1 text-sm text-zinc-500 dark:text-zinc-400">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleAsk(s)}
                className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-900 px-3.5 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900">
              {turn.result.question}
            </div>
            <div className="max-w-[90%] space-y-1.5 rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <p className="whitespace-pre-line">{turn.result.answer}</p>
              {turn.result.cypher && (
                <button
                  onClick={() =>
                    setExpandedCypher(
                      expandedCypher === turn.id ? null : turn.id
                    )
                  }
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {expandedCypher === turn.id ? "Hide query" : "View query"}
                </button>
              )}
              {expandedCypher === turn.id && turn.result.cypher && (
                <pre className="overflow-x-auto rounded-md bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-100">
                  {turn.result.cypher}
                </pre>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2 text-sm text-zinc-500 dark:text-zinc-400 dark:bg-zinc-900">
            Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(input);
        }}
        className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Lagos…"
          className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-800 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-50/10"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
          aria-label="Send"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
