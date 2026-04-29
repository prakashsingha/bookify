"use server";

import connectToDb from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import VoiceSession from "@/database/models/voice-session.model";
import {
  DEFAULT_MAX_DURATION_MINUTES,
  getCurrentBillingPeriodStart,
} from "@/lib/subscription-constants";
import { auth } from "@clerk/nextjs/server";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDb();
    const session = await VoiceSession.create({
      bookId,
      clerkId: userId,
      //   startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });
    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: DEFAULT_MAX_DURATION_MINUTES,
      isBillingError: false,
    };
  } catch (error) {
    console.error("Error starting voice session", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<EndSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (
      typeof durationSeconds !== "number" ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds < 0
    ) {
      return {
        success: false,
        error: "Invalid duration",
      };
    }

    await connectToDb();
    const session = await VoiceSession.findOneAndUpdate(
      { _id: sessionId, clerkId: userId },
      {
        endedAt: new Date(),
        durationSeconds,
      },
      { new: true },
    );

    if (!session) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error ending voice session", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
