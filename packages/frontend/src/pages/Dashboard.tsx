import { Link } from 'react-router-dom';
import { useUser, useOrganization, OrganizationSwitcher, UserButton } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DashboardPage() {
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold">Lightsail</span>
            <div className="ml-4">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
              />
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/dashboard" className="text-foreground font-medium">Dashboard</Link>
            <Link to="/controls" className="text-muted-foreground hover:text-foreground">Controls</Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {!organization ? (
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>Welcome to Lightsail!</CardTitle>
              <CardDescription>
                Create or select an organization to get started with your compliance journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">
                {organization.name} Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your compliance progress and manage your security posture.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Compliance Score
                  </CardTitle>
                  <Shield className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">72%</div>
                  <p className="text-xs text-gray-500">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Controls Implemented
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">61/85</div>
                  <p className="text-xs text-gray-500">
                    24 remaining
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Evidence Collected
                  </CardTitle>
                  <FileCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-gray-500">
                    12 expiring soon
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Open Tasks
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-gray-500">
                    5 overdue
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Placeholder content */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your compliance journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    No recent activity yet. Start by adding controls or connecting integrations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>
                    Tasks that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    No tasks yet. Tasks will appear here as you build your compliance program.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
