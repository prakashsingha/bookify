"use server";

import Book from "@/database/models/book.model";
import connectToDb from "@/database/mongoose";
import { CreateBook, SearchBookSegment, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";

export const createBook = async (data: CreateBook) => {
  try {
    await connectToDb();
    const slug = generateSlug(data.title);
    if (!slug) {
      return {
        success: false,
        error: "Title must include at least one letter or number",
      };
    }
    const existingBook = await Book.findOne({
      slug,
      clerkId: data.clerkId,
    }).lean();
    if (existingBook) {
      return {
        success: true,
        alreadyExists: true,
        data: serializeData(existingBook),
      };
    }

    // TODO: Check subscription limits before creating a new book
    const book = await Book.create({
      ...data,
      slug,
      clerkId: data.clerkId,
      totalSegments: 0,
    });
    return {
      success: true,
      alreadyExists: false,
      data: serializeData(book),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[],
) => {
  let session: mongoose.ClientSession | null = null;
  try {
    await connectToDb();
    session = await mongoose.startSession();
    session.startTransaction();

    const segmentsToSave = segments.map((segment) => ({
      ...segment,
      bookId,
      clerkId,
      content: segment.text,
      segmentIndex: segment.segmentIndex,
      wordCount: segment.wordCount,
      pageNumber: segment.pageNumber,
    }));

    const savedSegments = await BookSegment.insertMany(segmentsToSave, { session });
    await Book.findByIdAndUpdate(
      bookId,
      {
        totalSegments: savedSegments.length,
      },
      { session },
    );
    await session.commitTransaction();
    console.log(
      "Book updated with total segments",
      bookId,
      savedSegments.length,
    );
    return {
      success: true,
      data: {
        segmentsCreated: savedSegments.length,
      },
    };
  } catch (error) {
    console.error("Error saving book segments", error);
    if (session) {
      await session.abortTransaction();
    }
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const checkBookExists = async (title: string, clerkId: string) => {
  try {
    await connectToDb();
    const slug = generateSlug(title);
    const existingBook = await Book.findOne({ slug, clerkId }).lean();
    if (existingBook) {
      return { success: true, exists: true, data: serializeData(existingBook) };
    }
    return { success: true, exists: false, data: null };
  } catch (error) {
    console.error("Error checking book exists", error);
    return {
      success: false,
      exists: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const getBookBySlug = async (slug: string, clerkId: string) => {
  try {
    await connectToDb();
    const book = await Book.findOne({ slug, clerkId }).lean();
    if (!book) {
      return { success: false, data: null, error: "Book not found" };
    }
    return { success: true, data: serializeData(book) };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const getAllBooks = async (clerkId: string) => {
  try {
    await connectToDb();
    const books = await Book.find({ clerkId }).sort({ createdAt: -1 }).lean();
    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error) {
    console.error("Error getting all books", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const searchBookSegments = async (
  bookId: string,
  query: string,
  numberOfSegments: number,
) => {
  try {
    await connectToDb();

    const segmentLimit = Math.max(1, numberOfSegments);
    const matches = await BookSegment.find(
      { bookId, $text: { $search: query } },
      {
        _id: 1,
        segmentIndex: 1,
        pageNumber: 1,
        content: 1,
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(segmentLimit)
      .lean<SearchBookSegment[]>();

    return {
      success: true,
      data: serializeData(matches),
    };
  } catch (error) {
    console.error("Error searching book segments", error);
    return {
      success: false,
      data: [] as SearchBookSegment[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
