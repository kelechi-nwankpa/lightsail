import { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import {
  Home,
  Shield,
  FileText,
  LayoutDashboard,
  Settings,
  Link2,
  Users,
  FileCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Target,
  Package,
  Plug,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

// Hook to fetch controls needing attention count
function useControlsNeedingAttention() {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orgId) return;

    api.setTokenGetter(() => getToken());

    // Fetch controls with failed verification status
    const fetchCount = async () => {
      try {
        const response = await api.getWithPagination<unknown[]>(
          '/controls?verificationStatus=failed&pageSize=1'
        );
        setCount(response.pagination?.total || 0);
      } catch (error) {
        console.error('Failed to fetch controls needing attention:', error);
      }
    };

    fetchCount();
    // Refresh every 2 minutes
    const interval = setInterval(fetchCount, 120000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, getToken, orgId]);

  return count;
}

// Sidebar context for managing collapsed state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// Navigation item component
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  isCollapsed: boolean;
}

function NavItem({ to, icon: Icon, label, badge, badgeVariant = 'secondary', isCollapsed }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to === '/dashboard' && location.pathname === '/') ||
    (to !== '/dashboard' && to !== '/' && location.pathname.startsWith(to));

  const content = (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge && (
            <Badge variant={badgeVariant} className="text-xs px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// Section header
function NavSection({ title, isCollapsed }: { title: string; isCollapsed: boolean }) {
  if (isCollapsed) return null;
  return (
    <div className="px-3 py-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}

// Command palette component
function CommandPalette() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { window.location.href = '/dashboard'; }}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = '/controls'; }}>
            <Shield className="mr-2 h-4 w-4" />
            Controls
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = '/policies'; }}>
            <FileText className="mr-2 h-4 w-4" />
            Policies
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = '/evidence'; }}>
            <FileCheck className="mr-2 h-4 w-4" />
            Evidence
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = '/integrations'; }}>
            <Plug className="mr-2 h-4 w-4" />
            Integrations
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem>
            <Shield className="mr-2 h-4 w-4" />
            Create new control
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 h-4 w-4" />
            Add policy
          </CommandItem>
          <CommandItem>
            <FileCheck className="mr-2 h-4 w-4" />
            Upload evidence
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebarProvider({ children }: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <TooltipProvider>
        {children}
        <CommandPalette />
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

export function AppSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const controlsNeedingAttention = useControlsNeedingAttention();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-background border-r z-50 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo & Org */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-4 border-b",
        isCollapsed && "justify-center px-2"
      )}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">Lightsail</span>
          )}
        </Link>
      </div>

      {/* Command Search Trigger */}
      {!isCollapsed ? (
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
          }}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                document.dispatchEvent(event);
              }}
              className="mx-2 mt-3 flex items-center justify-center p-2 text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Search (⌘K)</TooltipContent>
        </Tooltip>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        <div className="px-2 space-y-1">
          <NavItem to="/dashboard" icon={Home} label="Home" isCollapsed={isCollapsed} />
          <NavItem
            to="/controls"
            icon={Shield}
            label="Controls"
            isCollapsed={isCollapsed}
            badge={controlsNeedingAttention > 0 ? String(controlsNeedingAttention) : undefined}
            badgeVariant={controlsNeedingAttention > 0 ? 'destructive' : undefined}
          />
        </div>

        <Separator className="my-3" />

        <NavSection title="Compliance" isCollapsed={isCollapsed} />
        <div className="px-2 space-y-1">
          <NavItem to="/frameworks" icon={Target} label="Frameworks" isCollapsed={isCollapsed} />
          <NavItem to="/policies" icon={FileText} label="Policies" isCollapsed={isCollapsed} />
          <NavItem to="/evidence" icon={FileCheck} label="Evidence" isCollapsed={isCollapsed} />
        </div>

        <Separator className="my-3" />

        <NavSection title="Risk" isCollapsed={isCollapsed} />
        <div className="px-2 space-y-1">
          <NavItem to="/risks" icon={AlertTriangle} label="Risk Management" isCollapsed={isCollapsed} />
          <NavItem to="/vendors" icon={Package} label="Vendors" isCollapsed={isCollapsed} />
        </div>

        <Separator className="my-3" />

        <NavSection title="Organization" isCollapsed={isCollapsed} />
        <div className="px-2 space-y-1">
          <NavItem to="/people" icon={Users} label="People" isCollapsed={isCollapsed} />
          <NavItem to="/integrations" icon={Link2} label="Integrations" isCollapsed={isCollapsed} />
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t p-2 space-y-1">
        <NavItem to="/settings" icon={Settings} label="Settings" isCollapsed={isCollapsed} />

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            isCollapsed && "justify-center px-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
