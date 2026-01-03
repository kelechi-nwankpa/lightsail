import { Link } from 'react-router-dom';
import { useUser, useOrganization, OrganizationSwitcher } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Link2,
  Users,
  Plus,
  Zap,
  Target,
  Calendar,
  HelpCircle,
  ExternalLink,
  Eye,
  Download,
  MousePointer,
} from 'lucide-react';
import { useEnabledFrameworks } from '../hooks/use-frameworks';
import { useControls } from '../hooks/use-controls';
import { cn } from '../lib/utils';

// Trust Center Metric Card (Vanta-style)
function TrustCenterMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/50">
      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Monitoring Card Component (Vanta-style)
function MonitoringCard({
  icon: Icon,
  title,
  needsAttention,
  okCount,
  totalCount,
  href,
  iconColor = 'text-muted-foreground'
}: {
  icon: React.ElementType;
  title: string;
  needsAttention: number;
  okCount: number;
  totalCount: number;
  href: string;
  iconColor?: string;
}) {
  const progress = totalCount > 0 ? (okCount / totalCount) * 100 : 0;
  const hasIssues = needsAttention > 0;

  return (
    <Link to={href}>
      <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", iconColor)} />
              <span className="font-semibold">{title}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Needs attention</span>
              <HelpCircle className="h-3 w-3" />
            </div>
            <p className={cn(
              "text-3xl font-bold",
              hasIssues ? "text-orange-500" : "text-green-600"
            )}>
              {needsAttention}
            </p>
          </div>

          <Progress
            value={progress}
            className="h-1.5 mb-2"
            indicatorClassName={hasIssues ? "bg-orange-500" : "bg-green-500"}
          />

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{okCount} OK</span>
            <span>{totalCount} total</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Framework Coverage Card
function FrameworkProgressCard({
  name,
  version,
  progress,
  controlsComplete,
  totalControls,
  href
}: {
  name: string;
  version?: string;
  progress: number;
  controlsComplete: number;
  totalControls: number;
  href: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              {version && (
                <Badge variant="outline" className="text-xs font-normal">
                  {version}
                </Badge>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className={cn(
            "text-4xl font-bold mb-2",
            progress >= 90 ? "text-green-600" : progress >= 50 ? "text-primary" : "text-orange-500"
          )}>
            {progress}%
          </p>

          <Progress
            value={progress}
            className="h-2 mb-2"
            indicatorClassName={
              progress >= 90 ? "bg-green-500" :
              progress >= 50 ? "bg-primary" : "bg-orange-500"
            }
          />

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{controlsComplete} controls complete</span>
            <span>{totalControls} total</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Task Item Component
function TaskItem({
  title,
  description,
  dueDate,
  priority,
  onClick
}: {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className={cn(
        "mt-0.5 w-2 h-2 rounded-full shrink-0",
        priority === 'high' ? "bg-red-500" :
        priority === 'medium' ? "bg-orange-500" : "bg-blue-500"
      )} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
        )}
        {dueDate && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{dueDate}</span>
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}

// Quick Action Button
function QuickAction({
  icon: Icon,
  label,
  href,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-sm font-medium text-center">{label}</span>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

// Getting Started Checklist
function GettingStartedChecklist() {
  const steps = [
    { id: 1, title: 'Set up your organization', completed: true },
    { id: 2, title: 'Enable compliance frameworks', completed: true },
    { id: 3, title: 'Connect your integrations', completed: false, href: '/integrations' },
    { id: 4, title: 'Create your first controls', completed: false, href: '/controls' },
    { id: 5, title: 'Upload initial evidence', completed: false, href: '/evidence' },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <Badge variant="secondary">{completedCount}/{steps.length}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md transition-colors",
                !step.completed && step.href && "hover:bg-muted/50 cursor-pointer"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
              <span className={cn(
                "text-sm flex-1",
                step.completed && "text-muted-foreground line-through"
              )}>
                {step.title}
              </span>
              {!step.completed && step.href && (
                <Link to={step.href}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Go <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { enabledFrameworks, isLoading: isLoadingFrameworks } = useEnabledFrameworks();
  const { controls } = useControls();

  // Calculate stats from real data
  const stats = {
    implemented: controls.filter(c => c.implementationStatus === 'implemented').length,
    inProgress: controls.filter(c => c.implementationStatus === 'in_progress').length,
    notStarted: controls.filter(c => c.implementationStatus === 'not_started').length,
    total: controls.length,
    needsEvidence: controls.filter(c => c.evidenceCount === 0 && c.implementationStatus !== 'not_applicable').length,
  };

  // Mock data for monitoring cards (replace with real API calls)
  const monitoringData = {
    policies: { needsAttention: 2, ok: 8, total: 10 },
    evidence: { needsAttention: stats.needsEvidence, ok: stats.total - stats.needsEvidence, total: stats.total },
    integrations: { needsAttention: 0, ok: 2, total: 2 },
    tasks: { needsAttention: 3, ok: 5, total: 8 },
  };

  // Mock tasks (replace with real API)
  const upcomingTasks = [
    { id: 1, title: 'Review Access Control Policy', description: 'Annual policy review due', dueDate: 'Jan 15, 2025', priority: 'high' as const },
    { id: 2, title: 'Update employee security training records', dueDate: 'Jan 20, 2025', priority: 'medium' as const },
    { id: 3, title: 'Collect Q4 vulnerability scan evidence', dueDate: 'Jan 31, 2025', priority: 'low' as const },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Welcome to Lightsail!</CardTitle>
            <CardDescription>
              Create or select an organization to get started with your compliance journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock Trust Center data (replace with real API)
  const trustCenterData = {
    visits: 8,
    views: 21,
    downloads: 0,
  };

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.firstName || 'there'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your compliance overview for {organization.name}
          </p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          View Tasks
        </Button>
      </div>

        {/* Framework Coverage Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Framework Coverage</h2>
            <span className="text-sm text-muted-foreground">
              Last updated less than a minute ago
            </span>
          </div>

          {isLoadingFrameworks ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
                    <div className="h-10 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-2 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : enabledFrameworks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No frameworks enabled</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Enable a compliance framework to start tracking your progress
                </p>
                <Link to="/controls">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Enable Framework
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enabledFrameworks.map((framework) => (
                <FrameworkProgressCard
                  key={framework.id}
                  name={framework.name}
                  version={framework.version || undefined}
                  progress={framework.progress}
                  controlsComplete={framework.implementedRequirements}
                  totalControls={framework.totalRequirements}
                  href={`/controls?frameworkId=${framework.frameworkId}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Monitoring Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Monitoring</h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MonitoringCard
              icon={FileText}
              title="Policies"
              needsAttention={monitoringData.policies.needsAttention}
              okCount={monitoringData.policies.ok}
              totalCount={monitoringData.policies.total}
              href="/policies"
              iconColor="text-violet-500"
            />
            <MonitoringCard
              icon={FileCheck}
              title="Evidence"
              needsAttention={monitoringData.evidence.needsAttention}
              okCount={monitoringData.evidence.ok}
              totalCount={monitoringData.evidence.total}
              href="/evidence"
              iconColor="text-blue-500"
            />
            <MonitoringCard
              icon={Link2}
              title="Integrations"
              needsAttention={monitoringData.integrations.needsAttention}
              okCount={monitoringData.integrations.ok}
              totalCount={monitoringData.integrations.total}
              href="/integrations"
              iconColor="text-green-500"
            />
            <MonitoringCard
              icon={AlertTriangle}
              title="Tasks"
              needsAttention={monitoringData.tasks.needsAttention}
              okCount={monitoringData.tasks.ok}
              totalCount={monitoringData.tasks.total}
              href="/tasks"
              iconColor="text-orange-500"
            />
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Tasks & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Upcoming Tasks</CardTitle>
                  <Link to="/tasks">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View all <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All caught up! No pending tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {upcomingTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        title={task.title}
                        description={task.description}
                        dueDate={task.dueDate}
                        priority={task.priority}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-3">
                  <QuickAction icon={Plus} label="New Control" href="/controls" />
                  <QuickAction icon={FileText} label="Add Policy" href="/policies" />
                  <QuickAction icon={FileCheck} label="Upload Evidence" href="/evidence" />
                  <QuickAction icon={Link2} label="Connect App" href="/integrations" />
                </div>
              </CardContent>
            </Card>

            {/* Controls Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Controls Overview</CardTitle>
                  <Link to="/controls">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Manage <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">{stats.implemented}</p>
                    <p className="text-xs text-green-700">Implemented</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    <p className="text-xs text-blue-700">In Progress</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50">
                    <p className="text-2xl font-bold text-orange-600">{stats.notStarted}</p>
                    <p className="text-xs text-orange-700">Not Started</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
                    <p className="text-xs text-gray-700">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Getting Started & Info */}
          <div className="space-y-6">
            <GettingStartedChecklist />

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-1.5 rounded-full bg-green-100">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">SOC 2 framework enabled</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <Plus className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Control "AC-001" created</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-1.5 rounded-full bg-violet-100">
                      <Users className="h-3 w-3 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium">Organization created</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                  View all activity
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Need help?</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Check out our guides or reach out to support.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        View Docs
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Center Section (Vanta-style) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trust Center</h2>
            <Link to="/trust-center">
              <Button variant="ghost" size="sm" className="text-xs">
                Manage <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <TrustCenterMetric icon={MousePointer} label="Visits" value={trustCenterData.visits} />
                <TrustCenterMetric icon={Eye} label="Page Views" value={trustCenterData.views} />
                <TrustCenterMetric icon={Download} label="Downloads" value={trustCenterData.downloads} />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
  );
}
