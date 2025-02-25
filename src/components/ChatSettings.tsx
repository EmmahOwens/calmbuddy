
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatSettings {
  aiResponseLength: number;
  showTimestamps: boolean;
  useFriendlyTone: boolean;
  selectedVoice: string;
}

export function ChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const savedSettings = localStorage.getItem("chatSettings");
    return savedSettings ? JSON.parse(savedSettings) : {
      aiResponseLength: 150,
      showTimestamps: true,
      useFriendlyTone: true,
      selectedVoice: "alloy",
    };
  });

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem("chatSettings", JSON.stringify(updatedSettings));
  };

  const voices = [
    { id: "alloy", name: "Alloy (Neutral)", description: "Versatile, balanced voice" },
    { id: "echo", name: "Echo (Male)", description: "Deep, resonant male voice" },
    { id: "fable", name: "Fable (Young)", description: "Youthful, animated voice" },
    { id: "onyx", name: "Onyx (Male)", description: "Strong, authoritative male voice" },
    { id: "nova", name: "Nova (Female)", description: "Warm, friendly female voice" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shadow-lg hover:shadow-xl transition-shadow duration-200"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogDescription>
            Customize your chat experience. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Voice Selection</Label>
            <Select
              value={settings.selectedVoice}
              onValueChange={(value) => updateSettings({ selectedVoice: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="response-length">AI Response Length</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="response-length"
                min={50}
                max={300}
                step={10}
                value={[settings.aiResponseLength]}
                onValueChange={([value]) => updateSettings({ aiResponseLength: value })}
                className="flex-1"
              />
              <span className="text-sm w-12">{settings.aiResponseLength}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-timestamps">Show Message Timestamps</Label>
            <Switch
              id="show-timestamps"
              checked={settings.showTimestamps}
              onCheckedChange={(checked) => updateSettings({ showTimestamps: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="friendly-tone">Use Friendly Tone</Label>
            <Switch
              id="friendly-tone"
              checked={settings.useFriendlyTone}
              onCheckedChange={(checked) => updateSettings({ useFriendlyTone: checked })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
