"use server";

import connectToDb from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import VoiceSession from "@/database/models/voice-session.model";
import BillingCounter from "@/database/models/billing-counter.model";
import {
  PLANS,
  getCurrentBillingPeriodStart,
  resolvePlanFromHas,
} from "@/lib/subscription-constants";
import { auth } from "@clerk/nextjs/server";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId, has } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const plan = resolvePlanFromHas(has);
    const planLimits = PLANS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();

    await connectToDb();
    const counter = await BillingCounter.findOneAndUpdate(
      { clerkId: userId, billingPeriodStart },
      {
        $inc: { sessionCount: 1 },
        $setOnInsert: { clerkId: userId, billingPeriodStart },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const currentPeriodSessionsCount = counter?.sessionCount ?? 0;

    if (
      planLimits.maxSessionsPerMonth !== null &&
      currentPeriodSessionsCount > planLimits.maxSessionsPerMonth
    ) {
      await BillingCounter.updateOne(
        {
          clerkId: userId,
          billingPeriodStart,
          sessionCount: { $gt: 0 },
        },
        { $inc: { sessionCount: -1 } },
      );

      return {
        success: false,
        error: `You've reached your monthly session limit (${planLimits.maxSessionsPerMonth}) for the ${plan} plan. Upgrade to continue.`,
        isBillingError: true,
      };
    }

    const session = await VoiceSession.create({
      bookId,
      clerkId: userId,
      billingPeriodStart,
      durationSeconds: 0,
    }).catch(async (error) => {
      await BillingCounter.updateOne(
        {
          clerkId: userId,
          billingPeriodStart,
          sessionCount: { $gt: 0 },
        },
        { $inc: { sessionCount: -1 } },
      );
      throw error;
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: planLimits.maxMinutesPerSession,
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
      { returnDocument: "after" },
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
