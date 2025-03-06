
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

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
  const [prevSuggestions, setPrevSuggestions] = useState<string[]>([]);
  
  // For mobile, limit visible suggestions initially
  const visibleSuggestions = isMobile && !isExpanded && !isInline 
    ? suggestions.slice(0, 2) 
    : suggestions;
  
  const hasMoreSuggestions = isMobile && suggestions.length > 2 && !isInline;

  // Track if suggestions have changed
  useEffect(() => {
    if (JSON.stringify(suggestions) !== JSON.stringify(prevSuggestions)) {
      setPrevSuggestions(suggestions);
    }
  }, [suggestions]);

  // Determine if each suggestion is new
  const isNewSuggestion = (suggestion: string, index: number) => {
    return !prevSuggestions.includes(suggestion);
  };

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
          <AnimatePresence>
            {visibleSuggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1
                }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "text-xs md:text-sm rounded-full px-3 md:px-4 py-1 md:py-2 h-auto text-left",
                    "neumorphic-button hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]",
                    isInline ? "bg-gray-50 dark:bg-slate-900" : "",
                    "min-h-0 whitespace-normal break-words",
                    isNewSuggestion(suggestion, index) ? "ring-2 ring-primary ring-opacity-30" : ""
                  )}
                  onClick={() => onSuggestionClick(suggestion)}
                  title={suggestion}
                  style={{ 
                    minWidth: isMobile ? "auto" : "",
                    maxWidth: isInline ? "240px" : isMobile ? "100%" : "280px"
                  }}
                >
                  {suggestion}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
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
