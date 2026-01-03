import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { FrameworkCard } from '../components/frameworks/FrameworkCard';
import { FrameworkDetailPanel } from '../components/frameworks/FrameworkDetailPanel';
import { useFrameworks, useFramework, useEnabledFrameworks } from '../hooks/use-frameworks';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Home,
  RefreshCw,
} from 'lucide-react';

export default function Frameworks() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [enablingFrameworkId, setEnablingFrameworkId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { frameworks, isLoading: isLoadingFrameworks } = useFrameworks();
  const { enabledFrameworks, isLoading: isLoadingEnabled, enableFramework, refetch: refetchEnabled, regenerateControls } = useEnabledFrameworks();
  const { framework: frameworkDetail, isLoading: isLoadingDetail } = useFramework(selectedFrameworkId);

  // Calculate overall compliance stats
  const overallStats = useMemo(() => {
    if (enabledFrameworks.length === 0) {
      return { total: 0, implemented: 0, progress: 0 };
    }

    const total = enabledFrameworks.reduce((sum, ef) => sum + ef.totalRequirements, 0);
    const implemented = enabledFrameworks.reduce((sum, ef) => sum + ef.implementedRequirements, 0);
    const progress = total > 0 ? Math.round((implemented / total) * 100) : 0;

    return { total, implemented, progress };
  }, [enabledFrameworks]);

  // Get enabled framework data for each framework
  const getEnabledFramework = (frameworkId: string) => {
    return enabledFrameworks.find((ef) => ef.frameworkId === frameworkId);
  };

  const handleEnableFramework = async (frameworkId: string) => {
    const framework = frameworks.find((f) => f.id === frameworkId);
    setEnablingFrameworkId(frameworkId);
    try {
      const result = await enableFramework(frameworkId);
      await refetchEnabled();
      toast.success('Framework enabled', {
        description: result?.controlsCreated
          ? `${framework?.name || 'Framework'} enabled. Created ${result.controlsCreated} controls for your organization.`
          : `${framework?.name || 'Framework'} has been enabled for your organization.`,
      });
    } catch (err) {
      console.error('Failed to enable framework:', err);
      toast.error('Failed to enable framework', {
        description: 'Please try again later.',
      });
    } finally {
      setEnablingFrameworkId(null);
    }
  };

  const handleViewFramework = (frameworkId: string) => {
    setSelectedFrameworkId(frameworkId);
    setIsDetailOpen(true);
  };

  const handleLinkSuccess = () => {
    // Refresh enabled frameworks to update progress
    refetchEnabled();
    toast.success('Control linked', {
      description: 'The control has been linked to the requirement.',
    });
  };

  const handleRegenerateControls = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateControls();
      toast.success('Controls regenerated', {
        description: result?.totalControlsCreated
          ? `Created ${result.totalControlsCreated} controls across ${result.results?.length || 0} frameworks.`
          : 'Controls have been regenerated for all enabled frameworks.',
      });
    } catch (err) {
      console.error('Failed to regenerate controls:', err);
      toast.error('Failed to regenerate controls', {
        description: 'Please try again later.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!user || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingFrameworks || isLoadingEnabled;

  return (
    <div className="flex">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Frameworks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Compliance Frameworks</h1>
            <p className="text-muted-foreground mt-1">
              Enable and track compliance frameworks for your organization
            </p>
          </div>

          {/* Overall Progress Section */}
          {enabledFrameworks.length > 0 && (
            <section className="mb-8">
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Overall Compliance</h2>
                      <p className="text-sm text-muted-foreground">
                        Across {enabledFrameworks.length} enabled framework{enabledFrameworks.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {overallStats.progress}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {overallStats.implemented} of {overallStats.total} requirements
                      </div>
                    </div>
                  </div>
                  <Progress value={overallStats.progress} className="h-3" />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{overallStats.implemented}</div>
                        <div className="text-xs text-muted-foreground">Implemented</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {overallStats.total - overallStats.implemented}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Target className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold">{enabledFrameworks.length}</div>
                        <div className="text-xs text-muted-foreground">Frameworks</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Enabled Frameworks */}
          {enabledFrameworks.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Enabled Frameworks</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateControls}
                  disabled={isRegenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate Controls'}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {frameworks
                  .filter((f) => getEnabledFramework(f.id))
                  .map((framework) => (
                    <FrameworkCard
                      key={framework.id}
                      framework={framework}
                      enabledFramework={getEnabledFramework(framework.id)}
                      onEnable={handleEnableFramework}
                      onView={handleViewFramework}
                      isEnabling={enablingFrameworkId === framework.id}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Available Frameworks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {enabledFrameworks.length > 0 ? 'Available Frameworks' : 'Compliance Frameworks'}
              </h2>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-muted rounded w-1/2" />
                          <div className="h-4 bg-muted rounded w-full" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </div>
                      </div>
                      <div className="h-9 bg-muted rounded mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {frameworks.filter((f) => !getEnabledFramework(f.id)).length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-1">All frameworks enabled</h3>
                      <p className="text-sm text-muted-foreground">
                        You've enabled all available compliance frameworks.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {frameworks
                      .filter((f) => !getEnabledFramework(f.id))
                      .map((framework) => (
                        <FrameworkCard
                          key={framework.id}
                          framework={framework}
                          enabledFramework={undefined}
                          onEnable={handleEnableFramework}
                          onView={handleViewFramework}
                          isEnabling={enablingFrameworkId === framework.id}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Empty State for No Frameworks */}
          {!isLoading && frameworks.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Frameworks Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  There are no compliance frameworks configured in the system.
                  Please contact your administrator to set up compliance frameworks.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Framework Detail Panel */}
      <FrameworkDetailPanel
        framework={frameworkDetail}
        enabledFramework={selectedFrameworkId ? getEnabledFramework(selectedFrameworkId) || null : null}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onLinkSuccess={handleLinkSuccess}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
