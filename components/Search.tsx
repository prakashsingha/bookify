"use client";

import { setLibrarySearchQuery } from "@/lib/actions/book.actions";
import { Input } from "@/components/ui/Input";
import { Search as SearchIcon } from "lucide-react";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LibrarySearchProps {
  initialQuery: string;
}

export function LibrarySearch({ initialQuery }: LibrarySearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rawQuery = formData.get("query");
    const nextQuery = typeof rawQuery === "string" ? rawQuery.trim() : "";

    startTransition(async () => {
      const nextUrl = await setLibrarySearchQuery(formData);
      const currentQuery = searchParams.get("query") ?? "";

      if (nextQuery === currentQuery) {
        return;
      }

      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="library-search-wrapper sm:shrink-0"
    >
      <div className="pl-4">
        <SearchIcon size={20} className="text-[var(--text-muted)]" />
      </div>
      <Input
        type="search"
        name="query"
        aria-label="Search books by title or author"
        placeholder="Search books by title or author"
        className="library-search-input border-none shadow-none focus-visible:ring-0"
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          if (!nextValue && searchParams.get("query")) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
        autoComplete="off"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
        disabled={isPending}
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
