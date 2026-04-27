import React, { useState } from "react";

const COLLAPSE_AT = 560;

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatMessage({ message }) {
  const [expanded, setExpanded] = useState(false);
  const text = message.content ?? "";
  const long = text.length > COLLAPSE_AT;
  const shown = long && !expanded ? `${text.slice(0, COLLAPSE_AT)}…` : text;
  const time = formatTime(message.createdAt);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`bubble ${message.role}`}>
      <div className="bubble-meta-row">
        <span className="bubble-meta">
          {message.role}
          {time ? <span className="bubble-time"> · {time}</span> : null}
        </span>
        <span className="bubble-actions">
          <button type="button" className="btn btn-ghost-inline" onClick={copyText}>
            Copy
          </button>
          {long ? (
            <button type="button" className="btn btn-ghost-inline" onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
        </span>
      </div>
      <div className="bubble-body">{shown}</div>
    </div>
  );
}
