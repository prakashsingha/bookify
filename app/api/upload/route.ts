import { auth } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.bookify_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "Missing Blob token. Set BLOB_READ_WRITE_TOKEN in .env.local" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const pathname = formData.get("pathname");
    const file = formData.get("file");
    const contentType = formData.get("contentType");

    if (typeof pathname !== "string" || !pathname.trim()) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const blob = await put(pathname, file, {
      token: blobToken,
      access: "public",
      contentType: typeof contentType === "string" ? contentType : undefined,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.bookify_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "Missing Blob token. Set BLOB_READ_WRITE_TOKEN in .env.local" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as { pathname?: string };
    const pathname = body?.pathname?.trim();

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    }

    await del(pathname, { token: blobToken });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
