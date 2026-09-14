import { Link, Code, Type, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Tab = "url" | "file" | "html" | "text";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as Tab)} className="flex-1">
      <TabsList className="w-full rounded-xl bg-muted/15 p-1">
        <TabsTrigger
          value="url"
          className="flex-1 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <Link className="size-3.5" />
          URL
        </TabsTrigger>
        <TabsTrigger
          value="file"
          className="flex-1 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <Upload className="size-3.5" />
          File
        </TabsTrigger>
        <TabsTrigger
          value="html"
          className="flex-1 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <Code className="size-3.5" />
          HTML
        </TabsTrigger>
        <TabsTrigger
          value="text"
          className="flex-1 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <Type className="size-3.5" />
          Text
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
