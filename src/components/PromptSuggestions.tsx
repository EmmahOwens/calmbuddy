
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PromptSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function PromptSuggestions({ 
  suggestions, 
  onSuggestionClick,
  className = ""
}: PromptSuggestionsProps) {
  return (
    <div className={`flex flex-wrap gap-2 w-full ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          className="text-sm rounded-full px-4 py-2 h-auto text-left neumorphic hover:bg-accent transition-all"
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
