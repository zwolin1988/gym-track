import { ScrollArea } from "@/components/ui/scroll-area";

interface AppScrollAreaProps {
  children: React.ReactNode;
}

export default function AppScrollArea({ children }: AppScrollAreaProps) {
  return (
    <ScrollArea className="h-screen w-full">
      {children}
    </ScrollArea>
  );
}
