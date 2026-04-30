"use client";

import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import { ASSISTANT_ID } from "@/lib/constants";
import { DEFAULT_MAX_DURATION_MINUTES } from "@/lib/subscription-constants";
import { useCurrentUserPlan } from "@/lib/subscription.client";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus =
  | "Idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

const useLatestRef = <T>(value: T) => {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};

let vapi: InstanceType<typeof Vapi> | null = null;
const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

const getVapi = () => {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI_API_KEY is not set");
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
};

interface VapiTranscriptMessage {
  type: "transcript";
  role: "user" | "assistant";
  transcriptType: "partial" | "final";
  transcript: string;
}

function isTranscriptMessage(message: unknown): message is VapiTranscriptMessage {
  if (!message || typeof message !== "object") return false;

  const candidate = message as Partial<VapiTranscriptMessage>;

  return (
    candidate.type === "transcript" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    (candidate.transcriptType === "partial" || candidate.transcriptType === "final") &&
    typeof candidate.transcript === "string"
  );
}

function dedupeFinalMessage(
  previousMessages: Messages[],
  nextMessage: Messages,
): Messages[] {
  const hasDuplicate = previousMessages.some(
    (message) =>
      message.role === nextMessage.role &&
      message.content.trim() === nextMessage.content.trim(),
  );

  if (hasDuplicate) return previousMessages;
  return [...previousMessages, nextMessage];
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();
  const router = useRouter();
  const { limits } = useCurrentUserPlan();

  //TODO: Implement limits and checks for VAPI usage

  const [status, setStatus] = useState<CallStatus>("Idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(
    DEFAULT_MAX_DURATION_MINUTES * 60,
  );
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const suppressEventsUntilRef = useRef<number>(0);
  const ignoreCallEndUntilRef = useRef<number>(0);
  const ignoreCallEndCountRef = useRef<number>(0);
  const stopCompletedAtRef = useRef<number>(0);
  const stopReleaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const durationRef = useLatestRef(duration);
  const maxDurationSecondsRef = useLatestRef(maxDurationSeconds);

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  const currentMessages = useMemo<Messages[]>(() => {
    const nextMessages: Messages[] = [];

    if (currentUserMessage.trim()) {
      nextMessages.push({ role: "user", content: currentUserMessage });
    }

    if (currentMessage.trim()) {
      nextMessages.push({ role: "assistant", content: currentMessage });
    }

    return nextMessages;
  }, [currentMessage, currentUserMessage]);

  // Limits
  // const maxDurationRef = useLatestRef(limits.maxSessionMinutes * 60);
  // const maxDurationRef
  // const remainingSeconds
  // const showTimeWarning

  const clearDurationTimers = () => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearStopReleaseTimeout = () => {
    if (!stopReleaseTimeoutRef.current) return;
    clearTimeout(stopReleaseTimeoutRef.current);
    stopReleaseTimeoutRef.current = null;
  };

  const startDurationTimer = () => {
    clearDurationTimers();
    startTimerRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    }, 0);
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const start = useCallback(async () => {
    let createdSessionId: string | null = null;
    if (isStartingRef.current || isStoppingRef.current || status !== "Idle") return;
    isStartingRef.current = true;
    setIsBusy(true);
    suppressEventsUntilRef.current = 0;
    ignoreCallEndUntilRef.current = Date.now() + 2500;
    const elapsedSinceStop = Date.now() - stopCompletedAtRef.current;
    if (elapsedSinceStop < 1200) {
      await wait(1200 - elapsedSinceStop);
    }

    if (!userId) {
      isStartingRef.current = false;
      setIsBusy(false);
      return setLimitError("You must be logged in to start a session");
    }
    setLimitError(null);
    setStatus("connecting");
    try {
      try {
        await getVapi().stop();
      } catch {
        // Ignore cleanup errors when no active call exists.
      }

      const result = await startVoiceSession(book._id);

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan.",
        );
        setStatus("Idle");
        isStartingRef.current = false;
        setIsBusy(false);
        return;
      }

      createdSessionId = result.sessionId || null;
      sessionIdRef.current = createdSessionId;
      const nextMaxDurationSeconds =
        (result.maxDurationMinutes ?? limits.maxMinutesPerSession) * 60;
      setMaxDurationSeconds(nextMaxDurationSeconds);
      setDuration(0);
      durationRef.current = 0;
      startDurationTimer();
      const firstMessage = `Hey, good to meet you. Quick question, before we dive in: have you actually read ${book.title} yet? Or are we starting fresh?`;

      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
        // voice: {
        //   provider: "11labs",
        //   voiceId: getVoice(voice).id,
        //   model: "eleven_turbo_v2_5" as const,
        //   stability: VOICE_SETTINGS.stability,
        //   similarityBoost: VOICE_SETTINGS.similarityBoost,
        //   style: VOICE_SETTINGS.style,
        //   useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        //   speed: VOICE_SETTINGS.speed,
        // },
      });
      getVapi().setMuted(false);

      setStatus("starting");
    } catch (error) {
      const leakedSessionId = sessionIdRef.current ?? createdSessionId;
      clearDurationTimers();

      if (leakedSessionId) {
        try {
          await endVoiceSession(leakedSessionId, durationRef.current);
        } catch (cleanupError) {
          console.error("Error cleaning up leaked session", cleanupError);
        } finally {
          sessionIdRef.current = null;
        }
      }

      console.error("Error starting session", error);
      setStatus("Idle");
      setLimitError("An error occurred while starting the session");
      isStartingRef.current = false;
      setIsBusy(false);
    } finally {
      // Keep "starting" lock until call-start/error/call-end resolves startup race.
    }
  }, [book, limits.maxMinutesPerSession, status, userId]);

  const stop = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    setIsBusy(true);
    setStatus("Idle");
    suppressEventsUntilRef.current = Date.now() + 4000;
    ignoreCallEndUntilRef.current = Date.now() + 5000;
    ignoreCallEndCountRef.current = 2;
    clearDurationTimers();
    try {
      const vapiInstance = getVapi();
      const callAtStopStart = vapiInstance.getDailyCallObject();
      await vapiInstance.stop();
      await wait(120);

      const currentCall = vapiInstance.getDailyCallObject();
      const shouldDestroyStaleCall =
        !!callAtStopStart && currentCall === callAtStopStart;

      if (shouldDestroyStaleCall) {
        await callAtStopStart.destroy();
      }

      const sessionId = sessionIdRef.current;
      if (sessionId) {
        await endVoiceSession(sessionId, durationRef.current);
        sessionIdRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping session", error);
      setLimitError("An error occurred while stopping the session");
    } finally {
      clearStopReleaseTimeout();
      stopReleaseTimeoutRef.current = setTimeout(() => {
        isStoppingRef.current = false;
        stopCompletedAtRef.current = Date.now();
        setIsBusy(false);
      }, 1400);
    }
  }, []);

  const clearErrors = useCallback(async () => {
    setLimitError(null);
  }, []);

  useEffect(() => {
    const vapiInstance = getVapi();
    const shouldIgnoreRuntimeEvents = () =>
      isStoppingRef.current || Date.now() < suppressEventsUntilRef.current;

    const onCallStart = () => {
      if (shouldIgnoreRuntimeEvents()) return;
      getVapi().setMuted(false);
      isStartingRef.current = false;
      setIsBusy(false);
      setStatus("listening");
      setCurrentMessage("");
      setCurrentUserMessage("");
    };

    const onCallEnd = async () => {
      if (ignoreCallEndCountRef.current > 0) {
        ignoreCallEndCountRef.current -= 1;
        return;
      }
      if (Date.now() < ignoreCallEndUntilRef.current) return;
      if (isStartingRef.current) return;
      clearDurationTimers();
      setStatus("Idle");
      setCurrentMessage("");
      setCurrentUserMessage("");

      const sessionId = sessionIdRef.current;

      if (!sessionId) {
        isStartingRef.current = false;
        isStoppingRef.current = false;
        stopCompletedAtRef.current = Date.now();
        clearStopReleaseTimeout();
        setIsBusy(false);
        return;
      }

      try {
        await endVoiceSession(sessionId, durationRef.current);
      } catch (error) {
        console.error("Error ending session on call end", error);
      } finally {
        sessionIdRef.current = null;
        isStartingRef.current = false;
        isStoppingRef.current = false;
        stopCompletedAtRef.current = Date.now();
        clearStopReleaseTimeout();
        setIsBusy(false);
      }
    };

    const onSpeechStart = () => {
      if (shouldIgnoreRuntimeEvents()) return;
      setStatus("speaking");
    };

    const onSpeechEnd = () => {
      if (shouldIgnoreRuntimeEvents()) return;
      setStatus("listening");
    };

    const onError = (error: unknown) => {
      if (shouldIgnoreRuntimeEvents()) return;

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "";

      const isExpectedTeardownError =
        /destroy|ended|already in progress|reconnect|cancel|closed/i.test(errorMessage);

      if (!isExpectedTeardownError) {
        console.warn("Vapi runtime warning", error);
      }

      clearDurationTimers();
      setStatus("Idle");
      setCurrentMessage("");
      setCurrentUserMessage("");
      isStartingRef.current = false;
      isStoppingRef.current = false;
      stopCompletedAtRef.current = Date.now();
      clearStopReleaseTimeout();
      setIsBusy(false);
      if (!isExpectedTeardownError) {
        setLimitError("Voice session failed. Please try again.");
      }
    };

    const onMessage = (message: unknown) => {
      if (shouldIgnoreRuntimeEvents()) return;
      if (!isTranscriptMessage(message)) return;

      const transcript = message.transcript.trim();
      if (!transcript) return;

      if (message.role === "user") {
        if (message.transcriptType === "partial") {
          setCurrentUserMessage(transcript);
          return;
        }

        setCurrentUserMessage("");
        setStatus("thinking");
        setMessages((prev) =>
          dedupeFinalMessage(prev, { role: "user", content: transcript }),
        );
        return;
      }

      if (message.transcriptType === "partial") {
        setCurrentMessage(transcript);
        setStatus("speaking");
        return;
      }

      setCurrentMessage("");
      setStatus("listening");
      setMessages((prev) =>
        dedupeFinalMessage(prev, { role: "assistant", content: transcript }),
      );
    };

    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);
    vapiInstance.on("message", onMessage);

    return () => {
      clearDurationTimers();
      clearStopReleaseTimeout();
      vapiInstance.removeListener("call-start", onCallStart);
      vapiInstance.removeListener("call-end", onCallEnd);
      vapiInstance.removeListener("speech-start", onSpeechStart);
      vapiInstance.removeListener("speech-end", onSpeechEnd);
      vapiInstance.removeListener("error", onError);
      vapiInstance.removeListener("message", onMessage);
    };
  }, [durationRef]);

  useEffect(() => {
    const fallbackMaxDurationSeconds = limits.maxMinutesPerSession * 60;
    setMaxDurationSeconds(fallbackMaxDurationSeconds);
  }, [limits.maxMinutesPerSession]);

  useEffect(() => {
    if (!isActive) return;
    if (duration < maxDurationSecondsRef.current) return;

    setLimitError("Session time limit reached for your current plan.");

    stop()
      .catch((error) => {
        console.error("Error stopping timed out session", error);
      })
      .finally(() => {
        router.replace("/");
      });
  }, [duration, isActive, router, stop, maxDurationSecondsRef]);

  return {
    status,
    isActive,
    duration,
    maxDurationSeconds,
    limitError,
    isBusy,
    start,
    stop,
    clearErrors,
    messages,
    currentMessages,
    currentMessage,
    currentUserMessage,
    //maxDurationRef, remainingSeconds, showTimeWarning
  };
};

export default useVapi;
