import { Link, NavLink } from "react-router-dom";
import { Camera, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLink = ({ to, label }: { to: string; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive
            ? "text-primary bg-accent"
            : "text-foreground/80 hover:text-foreground hover:bg-accent",
        )
      }
    >
      {label}
    </NavLink>
  );

  const mobileNavLink = ({ to, label }: { to: string; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        cn(
          "block px-4 py-3 text-base font-medium rounded-md transition-colors",
          isActive
            ? "text-primary bg-accent"
            : "text-foreground/80 hover:text-foreground hover:bg-accent",
        )
      }
    >
      {label}
    </NavLink>
  );

  const navItems = [
    { to: "/", label: "Image to Prompt" },
    { to: "/scene-to-prompt", label: "Scene to Prompt" },
    { to: "/broll-to-prompt", label: "B-Roll to Prompt" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/about", label: "About" },
    { to: "/history", label: "History" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Camera className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm uppercase tracking-wider text-foreground/70">
              AI
            </span>
            <span className="text-base font-semibold text-foreground">
              Fashion Prompt Generator
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => navLink(item))}
        </nav>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-6">
              {navItems.map((item) => mobileNavLink(item))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
