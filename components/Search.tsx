"use client";

import React, { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Search as SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdateUrl = useCallback(
    (nextQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (nextQuery) {
          params.set("query", nextQuery);
        } else {
          params.delete("query");
        }

        const next = params.toString();
        const current = searchParams.toString();
        if (next === current) {
          return;
        }

        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }, 300);
    },
    [pathname, router, searchParams],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    debouncedUpdateUrl(value);
  };

  return (
    <div className="library-search-wrapper">
      <div className="pl-4">
        <SearchIcon size={20} className="text-[var(--text-muted)]" />
      </div>
      <Input
        type="text"
        aria-label="Search books by title or author"
        placeholder="Search books by title or author"
        className="library-search-input border-none shadow-none focus-visible:ring-0"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
};

export default Search;
