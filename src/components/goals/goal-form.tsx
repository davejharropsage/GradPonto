"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGoal } from "@/lib/actions/goals";

type Period = "week" | "month" | "custom";

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function GoalForm() {
  const [period, setPeriod] = useState<Period>("month");
  const [target, setTarget] = useState("10");
  const now = new Date();
  const [customStart, setCustomStart] = useState(toDateInputValue(startOfMonth(now)));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(endOfMonth(now)));
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetNumber = Number(target);
    if (!targetNumber || targetNumber < 1) {
      toast.error("Enter a target of at least 1");
      return;
    }

    let startDate: Date;
    let endDate: Date;
    if (period === "week") {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else if (period === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      if (!customStart || !customEnd) {
        toast.error("Pick both a start and end date");
        return;
      }
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
      if (startDate > endDate) {
        toast.error("The start date must be before the end date");
        return;
      }
    }

    const formData = new FormData();
    formData.set("target", String(targetNumber));
    formData.set("startDate", startDate.toISOString());
    formData.set("endDate", endDate.toISOString());

    startTransition(async () => {
      try {
        await createGoal(formData);
        toast.success("Goal added");
        setTarget("10");
      } catch {
        toast.error("Failed to add goal");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="goal-target">Applications</Label>
        <Input
          id="goal-target"
          type="number"
          min={1}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-24"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="goal-period">Period</Label>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger id="goal-period" className="w-full sm:w-48">
            <SelectValue>
              {(value: string) =>
                value === "week" ? "This week" : value === "month" ? "This month" : "Custom range"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex gap-2 sm:col-span-3">
          <div className="grid gap-1.5">
            <Label htmlFor="goal-start">From</Label>
            <Input id="goal-start" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="goal-end">To</Label>
            <Input id="goal-end" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add goal"}
      </Button>
    </form>
  );
}
