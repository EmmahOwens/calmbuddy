import { cn } from "@/lib/utils";

export function ThinkingBox() {
  return (
    <div
      className={cn(
        "neumorphic max-w-[80%] p-4 message-transition animate-fade-in rounded-lg",
        "dark:shadow-[5px_5px_15px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(255,255,255,0.1)]"
      )}
    >
      <p className="text-foreground">...</p>
    </div>
  );
}