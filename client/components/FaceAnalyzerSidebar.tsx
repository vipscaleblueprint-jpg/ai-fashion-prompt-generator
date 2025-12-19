import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScanFace, Shirt } from "lucide-react";

export function FaceAnalyzerSidebar() {
    const location = useLocation();

    const sidebarItems = [
        {
            label: "Face Analyzer",
            to: "/face-analyzer",
            icon: ScanFace,
        },
        {
            label: "Outfit Analyzer",
            to: "/outfit-analyzer",
            icon: Shirt,
        },
        // Future items can be added here
    ];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/30 hidden md:block min-h-[calc(100vh-4rem)]">
            <div className="p-6">
                <h2 className="text-lg font-semibold tracking-tight mb-4">
                    Tools
                </h2>
                <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                location.pathname === item.to
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
