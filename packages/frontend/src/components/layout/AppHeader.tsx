import { Link, useLocation } from 'react-router-dom';
import { OrganizationSwitcher, UserButton } from '@clerk/clerk-react';
import { Button } from '../ui/button';
import { Shield, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to === '/dashboard' && location.pathname === '/') ||
    (to !== '/dashboard' && to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors min-w-[120px] justify-center",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="bg-background border-b fixed top-0 left-0 right-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo + Org Switcher + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Lightsail</h1>
          </Link>
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger: "px-3 py-1.5 rounded-md border hover:bg-muted"
              }
            }}
          />
          <nav className="flex items-center gap-1 border-l pl-6">
            <NavLink to="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink to="/controls" icon={Shield}>
              Controls
            </NavLink>
          </nav>
        </div>

        {/* Right: Settings + User */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
