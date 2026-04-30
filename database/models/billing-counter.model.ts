import { IBillingCounter } from "@/types";
import { model, models, Schema } from "mongoose";

const BillingCounterSchema = new Schema<IBillingCounter>(
  {
    clerkId: { type: String, required: true },
    billingPeriodStart: { type: Date, required: true },
    sessionCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

BillingCounterSchema.index({ clerkId: 1, billingPeriodStart: 1 }, { unique: true });

const BillingCounter =
  models.BillingCounter ||
  model<IBillingCounter>("BillingCounter", BillingCounterSchema, "billingCounters");

export default BillingCounter;
