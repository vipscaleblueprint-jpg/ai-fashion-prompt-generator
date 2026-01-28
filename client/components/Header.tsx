import { Link, NavLink, useLocation } from "react-router-dom";
import { Camera, Menu, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home" },
    {
      label: "Generators",
      children: [
        { to: "/generate", label: "Fashion to Prompt" },
        { to: "/fashion-randomizer", label: "Fashion Randomizer" },
        { to: "/scene-to-prompt", label: "Scene to Prompt" },
        { to: "/scene-text-to-prompt", label: "Scene Text to Prompt" },
        { to: "/broll-to-prompt", label: "B-Roll Scene to Prompt" },
        { to: "/broll-to-prompt-2", label: "B-Roll Image to Prompt 2.0" },
        { to: "/broll-to-prompt-3", label: "Broll Scene Image Upload" },
        { to: "/fake-avatar-generator", label: "No Limiter Scene To Prompt" },
        { to: "/face-analyzer", label: "Analyzers" },
        { to: "/kling", label: "Kling" },

      ],
    },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/about", label: "About" },
  ];

  const isGeneratorActive = navItems
    .find((item) => item.label === "Generators")
    ?.children?.some((child) => child.to === location.pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-1.5">
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
          <a
            href="https://vipscaleph.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-block text-xs text-muted-foreground border-l border-border pl-1.5 hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            by Vip-Scale
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isGeneratorActive
                          ? "text-primary bg-accent"
                          : "text-foreground/80"
                      )}
                    >
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.to} asChild>
                        <Link
                          to={child.to}
                          className={cn(
                            "w-full cursor-pointer",
                            location.pathname === child.to && "bg-accent text-accent-foreground"
                          )}
                        >
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to!}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-primary bg-accent"
                      : "text-foreground/80 hover:text-foreground hover:bg-accent"
                  )
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
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
              {navItems.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.label} className="flex flex-col gap-2">
                      <div className="px-4 py-2 text-sm font-semibold text-foreground/70">
                        {item.label}
                      </div>
                      <div className="pl-4 flex flex-col gap-1 border-l-2 border-muted ml-4">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                  ? "text-primary bg-accent"
                                  : "text-foreground/80 hover:text-foreground hover:bg-accent"
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to!}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-4 py-3 text-base font-medium rounded-md transition-colors",
                        isActive
                          ? "text-primary bg-accent"
                          : "text-foreground/80 hover:text-foreground hover:bg-accent"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
