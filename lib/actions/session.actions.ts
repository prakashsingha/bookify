"use server";

import connectToDb from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentBillingPeriodStart } from "@/lib/subscription-constants";

export const startVoiceSession = async (
  bookId: string,
  clerkId: string,
): Promise<StartSessionResult> => {
  try {
    await connectToDb();
    const session = await VoiceSession.create({
      bookId,
      clerkId,
      //   startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });
    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: session.maxDurationMinutes,
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
    await connectToDb();
    const session = await VoiceSession.findByIdAndUpdate(
      sessionId,
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
