"use client";

import { Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsNavItems = [
  {
    title: "General",
    icon: Settings,
    isActive: true,
  },
];

export function SettingsDialog() {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex gap-0 p-0 sm:max-w-[880px]">
        {/* Settings Sidebar */}
        <div className="flex w-[200px] flex-col gap-4 border-r p-4">
          <DialogHeader className="px-2">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="flex flex-col gap-1">
              {settingsNavItems.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className={cn("justify-start gap-2", item.isActive && "bg-accent")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Settings Content */}
        <div className="m-4 flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium">WebUI Settings</h3>
                  <p className="text-muted-foreground text-sm">Theme</p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select theme">
                      {theme === "light" && (
                        <>
                          <Sun className="h-4 w-4" />
                          <span>Light</span>
                        </>
                      )}
                      {theme === "dark" && (
                        <>
                          <Moon className="h-4 w-4" />
                          <span>Dark</span>
                        </>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
