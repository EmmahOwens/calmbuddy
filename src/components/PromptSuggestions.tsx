
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PromptSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
  isLoading?: boolean;
  isInline?: boolean;
}

export function PromptSuggestions({ 
  suggestions, 
  onSuggestionClick,
  className = "",
  isLoading = false,
  isInline = false
}: PromptSuggestionsProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // For mobile, limit visible suggestions initially
  const visibleSuggestions = isMobile && !isExpanded && !isInline 
    ? suggestions.slice(0, 2) 
    : suggestions;
  
  const hasMoreSuggestions = isMobile && suggestions.length > 2 && !isInline;

  return (
    <div className={cn(
      "flex flex-wrap gap-2 w-full",
      isInline ? "justify-start" : "",
      className
    )}>
      {isLoading ? (
        <div className="w-full flex justify-center py-2">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading suggestions...
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="w-full flex justify-center py-2">
          <div className="text-sm text-muted-foreground">
            No suggestions available
          </div>
        </div>
      ) : (
        <>
          {visibleSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "text-xs md:text-sm rounded-full px-3 md:px-4 py-1 md:py-2 h-auto text-left",
                "line-clamp-1 md:line-clamp-1 text-ellipsis overflow-hidden whitespace-nowrap",
                "neumorphic-button hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]",
                isInline ? "bg-gray-50 dark:bg-slate-900 max-w-[160px] md:max-w-[200px]" : "",
                "max-w-[140px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[280px]"
              )}
              onClick={() => onSuggestionClick(suggestion)}
              title={suggestion} // Add title for tooltip on hover
            >
              {suggestion}
            </Button>
          ))}
          
          {hasMoreSuggestions && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs rounded-full px-3 py-1 h-auto text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : `+${suggestions.length - 2} more`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
