import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

interface ScrollBarProps
  extends React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
  > {
  isScrolling?: boolean;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeout = React.useRef<number | null>(null);

  const handleScroll = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    setIsScrolling(true);
    scrollTimeout.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  };

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("group relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className="h-full w-full rounded-[inherit]"
        onScroll={handleScroll}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" isScrolling={isScrolling} />
      <ScrollBar orientation="horizontal" isScrolling={isScrolling} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = "vertical", isScrolling, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-opacity duration-300",
      // When scrolling or on hover over the parent group, show the scrollbar.
      (isScrolling && "opacity-100") ||
        "opacity-0 group-hover:opacity-100",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >