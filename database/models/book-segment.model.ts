import { IBookSegment } from "@/types";
import { model, models, Schema } from "mongoose";

const BookSegmentSchema = new Schema<IBookSegment>(
  {
    clerkId: { type: String, required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true, min: 0 },
    pageNumber: { type: Number, min: 1 },
    wordCount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
BookSegmentSchema.index({bookId: 1, pageNumber: 1});
BookSegmentSchema.index({bookId: 1, content: "text"});

const BookSegment =
  models.BookSegment || model<IBookSegment>("BookSegment", BookSegmentSchema, "bookSegments");

export default BookSegment;
