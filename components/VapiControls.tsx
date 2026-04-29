"use client";

import useVapi from "@/hooks/useVapi";
import Transcript from "@/components/Transcript";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    isActive,
    duration,
    start,
    stop,
    messages,
    currentMessages,
    currentMessage,
    currentUserMessage,
    //maxDurationRef, remainingSeconds, showTimeWarning => TODO: Implement
  } = useVapi(book);

  const isSpeakingOrThinking = status === "speaking" || status === "thinking";
  const showPulseRing = isActive && isSpeakingOrThinking;
  const safeVoice = book.persona?.trim() ? book.persona : "Default";
  const statusLabel = status === "Idle" ? "Ready" : status;

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const statusDotClass =
    status === "listening"
      ? "vapi-status-dot-listening"
      : status === "thinking"
        ? "vapi-status-dot-thinking"
        : status === "speaking"
          ? "vapi-status-dot-speaking"
          : status === "connecting" || status === "starting"
            ? "vapi-status-dot-connecting"
            : "vapi-status-dot-ready";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <section className="vapi-header-card">
        <div className="relative shrink-0">
          <Image
            src={book.coverURL}
            alt={`${book.title} cover`}
            width={120}
            height={180}
            className="w-[120px] rounded-lg object-cover shadow-[var(--shadow-book)]"
          />
          <button
            onClick={isActive ? stop : start}
            disabled={status === "connecting" || status === "starting"}
            type="button"
            className={`vapi-mic-btn absolute -bottom-2 -right-2 ${
              isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"
            }`}
            aria-label={isActive ? "Microphone on" : "Microphone off"}
          >
            {showPulseRing && <span className="vapi-pulse-ring" aria-hidden="true" />}
            {isActive ? (
              <Mic className="size-6 text-[#212a3b]" />
            ) : (
              <MicOff className="size-6 text-[#9aa0a7]" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-bold leading-tight text-[var(--text-primary)] md:text-3xl">
              {book.title}
            </h1>
            <p className="text-base text-[var(--text-secondary)]">
              by {book.author}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="vapi-status-indicator">
              <span className={`vapi-status-dot ${statusDotClass}`} />
              <span className="vapi-status-text">{statusLabel}</span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">Voice: {safeVoice}</span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="vapi-transcript-wrapper">
        <Transcript
          messages={messages}
          currentMessages={currentMessages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </section>
    </div>
  );
};

export default VapiControls;
