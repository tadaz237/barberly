"use client";

import { Button } from "@/src/components/ui/button";
import { useApp } from "@/src/components/app-provider";

export function CounterDemo() {
  const { counter, increment } = useApp();

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">Counter: {counter}</div>
      <Button onClick={increment}>+1</Button>
    </div>
  );
}
