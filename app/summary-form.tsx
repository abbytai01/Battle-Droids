"use client";

import { FormEvent, useState } from "react";

export function SummaryForm() {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSummary("");

    if (!input.trim()) {
      setError("Please enter some text first.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: input })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSummary(data.summary);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="formWrap">
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="text-input" className="label">
          Text to summarize
        </label>
        <textarea
          id="text-input"
          className="textarea"
          rows={8}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste some text here..."
        />
        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {error ? <p className="message error">{error}</p> : null}

      {summary ? (
        <div className="result">
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      ) : null}
    </div>
  );
}
