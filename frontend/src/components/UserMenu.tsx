import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { ProfileModal } from "./ProfileModal";

export function UserMenu() {
  const { data: session } = useSession();
  const [showProfile, setShowProfile] = useState(false);

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="size-5 rounded-full object-cover ring-1 ring-border/30"
            />
          ) : (
            <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
              {initials}
            </div>
          )}
          {session.user.name ?? "User"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2.5">
            <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground/50 truncate mt-0.5">{session.user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 text-xs cursor-pointer"
          >
            <Settings className="size-3.5" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs text-destructive cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal open={showProfile} onOpenChange={setShowProfile} />
    </>
  );
}
