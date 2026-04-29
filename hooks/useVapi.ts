"use client";

import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
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

  //TODO: Implement limits and checks for VAPI usage

  const [status, setStatus] = useState<CallStatus>("Idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);

  const voice = book.persona || DEFAULT_VOICE;

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

  const start = async () => {
    let createdSessionId: string | null = null;
    if (!userId) {
      return setLimitError("You must be logged in to start a session");
    }
    setLimitError(null);
    setStatus("connecting");
    try {
      const result = await startVoiceSession(book._id);

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan.",
        );
        setStatus("Idle");
        return;
      }

      createdSessionId = result.sessionId || null;
      sessionIdRef.current = createdSessionId;
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

      setStatus("listening");
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
    }
  };

  const stop = async () => {
    isStoppingRef.current = true;
    setStatus("Idle");
    clearDurationTimers();
    try {
      // const result = await endVoiceSession(sessionIdRef.current, duration);

      await getVapi().stop();
    } catch (error) {
      console.error("Error stopping session", error);
      setLimitError("An error occurred while stopping the session");
    }
  };

  const clearErrors = async () => {
    setLimitError(null);
  };

  useEffect(() => {
    const vapiInstance = getVapi();

    const onCallStart = () => {
      setStatus("listening");
      setCurrentMessage("");
      setCurrentUserMessage("");
    };

    const onCallEnd = async () => {
      clearDurationTimers();
      setStatus("Idle");
      setCurrentMessage("");
      setCurrentUserMessage("");

      const sessionId = sessionIdRef.current;

      if (!sessionId) {
        isStoppingRef.current = false;
        return;
      }

      try {
        await endVoiceSession(sessionId, durationRef.current);
      } catch (error) {
        console.error("Error ending session on call end", error);
      } finally {
        sessionIdRef.current = null;
        isStoppingRef.current = false;
      }
    };

    const onSpeechStart = () => {
      setStatus("speaking");
    };

    const onSpeechEnd = () => {
      setStatus("listening");
    };

    const onMessage = (message: unknown) => {
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
    vapiInstance.on("message", onMessage);

    return () => {
      clearDurationTimers();
      vapiInstance.removeListener("call-start", onCallStart);
      vapiInstance.removeListener("call-end", onCallEnd);
      vapiInstance.removeListener("speech-start", onSpeechStart);
      vapiInstance.removeListener("speech-end", onSpeechEnd);
      vapiInstance.removeListener("message", onMessage);
    };
  }, [durationRef]);

  return {
    status,
    isActive,
    duration,
    limitError,
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
