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