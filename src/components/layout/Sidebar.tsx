"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  BookOpen,
  LayoutDashboard,
  Library,
  Zap,
  Layers,
  Target,
  User,
  LogOut,
} from "lucide-react";
import { signOut as firebaseSignOut } from "@/lib/firebase/auth-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Article Library", icon: Library },
  { href: "/speed", label: "Speed Trainer", icon: Zap },
  { href: "/grammar", label: "Grammar", icon: Layers },
  { href: "/cars", label: "CARS Prep", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await firebaseSignOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-tight">ReadForge</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                // Brief: 8px radius, pale sage fill when active, small right chevron.
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-[color-mix(in_oklab,var(--sage)_18%,transparent)] hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-0.5">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-primary/15 text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <User className="w-4 h-4" />
          Profile
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
