"use client";

import { TagPill } from "@/components/applications/tag-pill";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tagIds: string[]) => void;
}) {
  const { t } = useI18n();
  const { tags, createTag } = useTracker();
  const [draft, setDraft] = useState("");

  const selected = useMemo(
    () => tags.filter((tag) => value.includes(tag.id)),
    [tags, value]
  );
  const suggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    return tags.filter(
      (tag) =>
        !value.includes(tag.id) &&
        (!query || tag.name.toLowerCase().includes(query))
    );
  }, [draft, tags, value]);

  async function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const id = await createTag(trimmed);
      if (!value.includes(id)) onChange([...value, id]);
      setDraft("");
    } catch {
      toast.error(t("couldNotSave"));
    }
  }

  async function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      await addTag(draft);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((tag) => (
          <TagPill
            key={tag.id}
            name={tag.name}
            onRemove={() => onChange(value.filter((id) => id !== tag.id))}
          />
        ))}
      </div>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("typeTag")}
        aria-label={t("createTag")}
        autoComplete="off"
      />
      {suggestions.length > 0 && draft.trim() ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="rounded-full border border-border px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
              onClick={() => {
                onChange([...value, tag.id]);
                setDraft("");
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
