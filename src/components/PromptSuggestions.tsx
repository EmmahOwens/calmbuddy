
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className={`flex flex-wrap gap-2 w-full ${isInline ? 'justify-start' : ''} ${className}`}>
      {isLoading ? (
        <div className="w-full flex justify-center py-2">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading suggestions...
          </div>
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className={`text-sm rounded-full px-4 py-2 h-auto text-left neumorphic-button hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] ${isInline ? 'bg-gray-50 dark:bg-slate-900' : ''}`}
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))
      )}
    </div>
  );
}
