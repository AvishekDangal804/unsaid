"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { searchInstitutions } from "./actions";
import { Input } from "@/components/ui/input";

type InstitutionResult = { id: string; name: string; country: string | null; status: string };

export function InstitutionPicker({
  initialLabel,
  onSelect,
}: {
  initialLabel?: string;
  onSelect: (choice: { institutionId?: string; newInstitutionName?: string; label: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstitutionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    const loadingTimer = setTimeout(() => setLoading(true), 0);
    debounceRef.current = setTimeout(async () => {
      const data = await searchInstitutions(query);
      setResults(data);
      setLoading(false);
    }, 300);
    return () => {
      clearTimeout(loadingTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  function handlePick(inst: InstitutionResult) {
    setSelectedLabel(inst.name);
    setQuery("");
    setResults([]);
    onSelect({ institutionId: inst.id, label: inst.name });
  }

  function handleSuggestNew() {
    const name = query.trim();
    if (!name) return;
    setSelectedLabel(name);
    setResults([]);
    onSelect({ newInstitutionName: name, label: name });
  }

  if (selectedLabel) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-foreground">
          <Check className="size-4 text-success" /> {selectedLabel}
        </span>
        <button
          type="button"
          onClick={() => {
            setSelectedLabel(null);
            onSelect({ label: "" });
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your school, college, or university"
          className="pl-9"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {loading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching...</p>
          ) : (
            <>
              {visibleResults.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => handlePick(inst)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-muted"
                >
                  {inst.name}
                  {inst.country && (
                    <span className="text-xs text-muted-foreground">{inst.country}</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSuggestNew}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-surface-muted"
              >
                <Plus className="size-4" /> Add &quot;{query.trim()}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
