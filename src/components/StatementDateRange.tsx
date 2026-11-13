import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { presetRange, statementPresets, type StatementPreset, type StatementRange } from "@/lib/banking";

export function StatementDateRange({ value, onChange }: { value: StatementRange; onChange: (range: StatementRange) => void }) {
  const [preset, setPreset] = useState<StatementPreset>("This Month");
  return <div className="space-y-3">
    <Select value={preset} onValueChange={(next: StatementPreset) => { setPreset(next); if (next !== "Custom Date Range") onChange(presetRange(next)); }}>
      <SelectTrigger aria-label="Statement period" className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{statementPresets.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(["start", "end"] as const).map((key) => <div key={key}>
        <p className="text-xs text-muted-foreground mb-1">{key === "start" ? "Start Date" : "End Date"}</p>
        <Popover><PopoverTrigger asChild><Button variant="outline" aria-label={key === "start" ? "Start Date" : "End Date"} className="w-full justify-start text-xs">{format(parseISO(value[key]), "dd MMM yyyy")}</Button></PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={parseISO(value[key])} defaultMonth={parseISO(value[key])} captionLayout="dropdown" startMonth={new Date(1900, 0)} endMonth={new Date(2200, 11)} disabled={key === "end" ? { before: parseISO(value.start) } : undefined}
              onSelect={(date) => { if (date) { setPreset("Custom Date Range"); onChange({ ...value, [key]: format(date, "yyyy-MM-dd") }); } }} className="pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">{format(parseISO(value.start), "dd MMM yyyy")} – {format(parseISO(value.end), "dd MMM yyyy")}</p>
  </div>;
}