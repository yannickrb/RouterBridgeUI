import { Link, useLocation } from "wouter";
import { LayoutDashboard, Radio, ShieldAlert, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Traffic", href: "/traffic", icon: Radio },
  { label: "Threats", href: "/threats", icon: ShieldAlert },
  { label: "Devices", href: "/devices", icon: Wifi },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-white/10 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-16 py-1 rounded-lg transition-all duration-200 cursor-pointer",
                location === item.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DesktopSidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-white/10 p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
          <ShieldAlert className="text-black w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-wider text-white">
          Router<span className="text-primary">BridgeUI</span>
        </h1>
      </div>

      <div className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              data-testid={`sidebar-${item.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", location === item.href ? "animate-pulse" : "")} />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-auto">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-primary text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Monitor Active
          </div>
          <p className="text-xs text-muted-foreground">Scanning your local network for suspicious activity.</p>
        </div>
      </div>
    </aside>
  );
}

export function Header() {
  const [location] = useLocation();
  
  const getPageTitle = (path: string) => {
    const item = NAV_ITEMS.find(i => i.href === path);
    return item ? item.label : "RouterBridgeUI";
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 h-14 flex items-center justify-between">
      <h1 className="font-bold text-lg tracking-tight">{getPageTitle(location)}</h1>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
         <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    </header>
  );
}
