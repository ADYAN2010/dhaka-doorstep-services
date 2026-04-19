import { useMemo } from "react";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinanceFilters } from "./types";

type Option = { value: string; label: string };

interface Props {
  value: FinanceFilters;
  onChange: (next: FinanceFilters) => void;
  providers?: Option[];
  categories?: Option[];
  statuses?: Option[];
  compact?: boolean;
}

export function FinanceFiltersBar({
  value,
  onChange,
  providers,
  categories,
  statuses,
  compact = false,
}: Props) {
  const fromDate = value.from ? new Date(value.from) : undefined;
  const toDate = value.to ? new Date(value.to) : undefined;

  const isEmpty = useMemo(
    () => !value.from && !value.to && !value.providerId && !value.category && !value.status,
    [value],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3",
        compact && "p-2",
      )}
    >
      <DatePopover
        label="From"
        date={fromDate}
        onSelect={(d) => onChange({ ...value, from: d ? d.toISOString() : undefined })}
      />
      <DatePopover
        label="To"
        date={toDate}
        onSelect={(d) => onChange({ ...value, to: d ? d.toISOString() : undefined })}
      />

      {providers && providers.length > 0 && (
        <Select
          value={value.providerId ?? "__all"}
          onValueChange={(v) =>
            onChange({ ...value, providerId: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {categories && categories.length > 0 && (
        <Select
          value={value.category ?? "__all"}
          onValueChange={(v) =>
            onChange({ ...value, category: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {statuses && statuses.length > 0 && (
        <Select
          value={value.status ?? "__all"}
          onValueChange={(v) =>
            onChange({ ...value, status: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!isEmpty && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => onChange({})}
        >
          <FilterX className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

function DatePopover({
  label,
  date,
  onSelect,
}: {
  label: string;
  date?: Date;
  onSelect: (d?: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-start gap-2 text-left text-xs font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {date ? format(date, "PP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onSelect(d ?? undefined)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
