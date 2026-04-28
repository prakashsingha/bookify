import { IVoiceSession } from "@/types";
import { model, models, Schema } from "mongoose";

const VoiceSessionSchema = new Schema<IVoiceSession>(
  {
    clerkId: { type: String, required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, required: true, default: 0, min: 0 },
    billingPeriodStart: { type: Date, required: true },
  },
  { timestamps: true },
);

VoiceSessionSchema.index({ clerkId: 1, billingPeriodStart: 1 });

const VoiceSession =
  models.VoiceSession || model<IVoiceSession>("VoiceSession", VoiceSessionSchema, "voiceSessions");

export default VoiceSession;
