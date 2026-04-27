'use server';

import Book from "@/database/models/book.model";
import connectToDb from "@/database/mongoose"
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import BookSegment from "@/database/models/book-segment.model";

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDb();
        const slug = generateSlug(data.title);
        const existingBook = await Book.findOne({ slug, clerkId: data.clerkId }).lean();
        if (existingBook) {
            return { 
                success: true, 
                alreadyExists: true, 
                data: serializeData(existingBook) 
            };
        }

        // TODO: Check subscription limits before creating a new book
        const book = await Book.create({ ...data, slug, totalSegments: 0 });
        return {
            success: true,
            alreadyExists: false,
            data: serializeData(book)
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }
}

export const saveBookSegments = async (bookId: string, clerkId:string, segments: TextSegment[]) => {
    try {
        await connectToDb();
        
        const segmentsToSave = segments.map(segment => ({
            ...segment,
            bookId,
            clerkId,
            content: segment.text,
            segmentIndex: segment.segmentIndex, 
            wordCount: segment.wordCount,
            pageNumber: segment.pageNumber,
        }));

        const savedSegments = await BookSegment.insertMany(segmentsToSave);
        await Book.findByIdAndUpdate(bookId, { totalSegments: savedSegments.length });
        console.log("Book updated with total segments", bookId, savedSegments.length);
        return { 
            success: true, 
            data: {
                segmentsCreated: savedSegments.length
            } 
        };
    }
    catch (error) {
        console.error("Error saving book segments", error);
        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        console.log("Book and segments deleted due to failure to save segments");
        return { 
            success: false, 
            data: null,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export const checkBookExists = async (title:string, clerkId:string) => {
    try {
        await connectToDb();
        const slug = generateSlug(title);
        const existingBook = await Book.findOne({ slug, clerkId }).lean();
        if (existingBook) {
            return { success: true, exists: true, data: serializeData(existingBook) };
        }
        return { success: true, exists: false, data: null };
    }
    catch (error) {
        console.error("Error checking book exists", error);
        return { success: false, exists: false, data: null, error: error instanceof Error ? error.message : String(error)};
    }
}

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
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export const getAllBooks = async (clerkId: string) => {
    try {
        await connectToDb();
        const books = await Book.find({ clerkId }).sort({createdAt: -1}).lean();
        return {
            success: true,
            data: serializeData(books)
        }
    } catch (error) {
        console.error("Error getting all books", error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : String(error)
        }
    }
}