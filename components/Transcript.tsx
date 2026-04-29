"use client";

import { Messages } from "@/types";
import { Mic } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

interface TranscriptProps {
  messages: Messages[];
  currentMessages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

function Transcript({
  messages,
  currentMessages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hasAssistantStream = currentMessage.trim().length > 0;
  const hasUserStream = currentUserMessage.trim().length > 0;

  const renderedMessages = useMemo(() => [...messages, ...currentMessages], [
    messages,
    currentMessages,
  ]);

  const isEmpty = renderedMessages.length === 0;

  useEffect(() => {
    if (!scrollAreaRef.current) return;

    scrollAreaRef.current.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [renderedMessages]);

  if (isEmpty) {
    return (
      <section className="transcript-container">
        <div className="transcript-empty">
          <Mic className="mb-3 size-12 text-[var(--text-primary)]" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="transcript-container">
      <div ref={scrollAreaRef} className="transcript-messages">
        {renderedMessages.map((message, index) => {
          const isUserMessage = message.role === "user";

          return (
            <div
              key={`${message.role}-${index}`}
              className={`transcript-message ${isUserMessage ? "transcript-message-user" : "transcript-message-assistant"}`}
            >
              <div
                className={`transcript-bubble ${isUserMessage ? "transcript-bubble-user" : "transcript-bubble-assistant"}`}
              >
                {message.content}
                {((message.role === "user" &&
                  hasUserStream &&
                  message.content === currentUserMessage) ||
                  (message.role === "assistant" &&
                    hasAssistantStream &&
                    message.content === currentMessage)) && (
                  <span className="transcript-cursor" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Transcript;
