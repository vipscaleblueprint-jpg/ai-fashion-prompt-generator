import { Link, NavLink } from "react-router-dom";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
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
          {navLink({ to: "/", label: "Image to Prompt" })}
          {navLink({ to: "/scene-to-prompt", label: "Scene to Prompt" })}
          {navLink({ to: "/broll-to-prompt", label: "B-Roll to Prompt" })}
          {navLink({ to: "/how-it-works", label: "How It Works" })}
          {navLink({ to: "/about", label: "About" })}
          {navLink({ to: "/history", label: "History" })}
        </nav>
      </div>
    </header>
  );
}
