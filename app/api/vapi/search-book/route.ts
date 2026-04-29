import { searchBookSegments } from "@/lib/actions/book.actions";
import { ToolCall, SearchBookParameters } from "@/types";
import { NextResponse } from "next/server";

const NO_INFORMATION_FOUND = "no information found about this topic.";
const SEARCH_BOOK_TOOL_NAMES = new Set([
  "search book",
  "search-book",
  "search_book",
]);
const TOP_SEGMENT_COUNT = 3;

function normalizeToolName(name?: string): string {
  if (!name) return "";
  return name.toLowerCase().trim();
}

function parseObject(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof input === "object") return input as Record<string, unknown>;
  return {};
}

function toSearchBookParameters(call: ToolCall): SearchBookParameters {
  const params = parseObject(call.parameters);
  const args = parseObject(call.arguments);

  return {
    bookId:
      typeof params.bookId === "string"
        ? params.bookId
        : typeof params.book_id === "string"
          ? params.book_id
          : typeof args.bookId === "string"
            ? args.bookId
            : typeof args.book_id === "string"
              ? args.book_id
              : undefined,
    query:
      typeof params.query === "string"
        ? params.query
        : typeof params.searchQuery === "string"
          ? params.searchQuery
          : typeof params.topic === "string"
            ? params.topic
            : typeof args.query === "string"
              ? args.query
              : typeof args.searchQuery === "string"
                ? args.searchQuery
                : typeof args.topic === "string"
                  ? args.topic
                  : undefined,
  };
}

function getToolCalls(payload: Record<string, unknown>): ToolCall[] {
  const candidates = [
    payload.toolCalls,
    payload.tool_calls,
    parseObject(payload.message).toolCalls,
    parseObject(payload.message).tool_calls,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as ToolCall[];
  }

  if (payload.toolCall && typeof payload.toolCall === "object") {
    return [payload.toolCall as ToolCall];
  }

  return [];
}

function formatSegmentsAsSingleResult(
  segments: Array<{
    segmentIndex: number;
    pageNumber?: number;
    content: string;
  }>,
): string {
  if (segments.length === 0) return NO_INFORMATION_FOUND;

  return segments
    .map((segment) => {
      const pagePrefix =
        typeof segment.pageNumber === "number"
          ? `, Page ${segment.pageNumber}`
          : "";
      return `Segment ${segment.segmentIndex}${pagePrefix}:\n${segment.content}`;
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const toolCalls = getToolCalls(payload);

    const searchBookCalls = toolCalls.filter((toolCall) =>
      SEARCH_BOOK_TOOL_NAMES.has(normalizeToolName(toolCall.name)),
    );

    if (searchBookCalls.length === 0) {
      return NextResponse.json({ result: NO_INFORMATION_FOUND });
    }

    const results = await Promise.all(
      searchBookCalls.map(async (toolCall) => {
        const { bookId, query } = toSearchBookParameters(toolCall);

        if (!bookId || !query) {
          return {
            toolCallId: toolCall.id ?? null,
            result: NO_INFORMATION_FOUND,
          };
        }

        const searchResults = await searchBookSegments(
          bookId,
          query,
          TOP_SEGMENT_COUNT,
        );
        if (!searchResults.success || !searchResults.data?.length) {
          return {
            toolCallId: toolCall.id ?? null,
            result: NO_INFORMATION_FOUND,
          };
        }

        const combinedResult = formatSegmentsAsSingleResult(searchResults.data);
        return {
          toolCallId: toolCall.id ?? null,
          result: combinedResult,
        };
      }),
    );

    return NextResponse.json({
      result: results[0]?.result ?? NO_INFORMATION_FOUND,
      results,
    });
  } catch (error) {
    const errorStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;
    const errorName =
      error instanceof Error ? error.name : undefined;
    const isValidationError =
      errorName === "ValidationError" ||
      errorStatus === 400 ||
      errorStatus === 422;
    const message = isValidationError
      ? error instanceof Error
        ? error.message
        : "Invalid request payload"
      : "Internal server error";
    const status = isValidationError ? (errorStatus ?? 400) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
