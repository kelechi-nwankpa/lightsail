import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RequirementsTree } from './RequirementsTree';
import { LinkControlDialog } from './LinkControlDialog';
import {
  Target,
  Search,
  CheckCircle2,
  Clock,
  Link2,
  FileText,
} from 'lucide-react';
import type { FrameworkDetail, EnabledFramework, FrameworkRequirementNode } from '../../types/frameworks';

interface FrameworkDetailPanelProps {
  framework: FrameworkDetail | null;
  enabledFramework: EnabledFramework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkSuccess?: () => void;
  isLoading?: boolean;
}

export function FrameworkDetailPanel({
  framework,
  enabledFramework,
  open,
  onOpenChange,
  onLinkSuccess,
  isLoading,
}: FrameworkDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<FrameworkRequirementNode | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  if (!framework && !isLoading) return null;

  const progress = enabledFramework?.progress || 0;
  const implemented = enabledFramework?.implementedRequirements || 0;
  const total = enabledFramework?.totalRequirements || 0;

  // Filter requirements based on search query
  const filterRequirements = (
    requirements: FrameworkRequirementNode[],
    query: string
  ): FrameworkRequirementNode[] => {
    if (!query) return requirements;
    const lowerQuery = query.toLowerCase();

    const filterNode = (node: FrameworkRequirementNode): FrameworkRequirementNode | null => {
      const matchesSelf =
        node.code.toLowerCase().includes(lowerQuery) ||
        node.name.toLowerCase().includes(lowerQuery) ||
        (node.description?.toLowerCase().includes(lowerQuery) ?? false);

      const filteredChildren = node.children
        .map(filterNode)
        .filter((child): child is FrameworkRequirementNode => child !== null);

      if (matchesSelf || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return requirements
      .map(filterNode)
      .filter((node): node is FrameworkRequirementNode => node !== null);
  };

  const filteredRequirements = framework
    ? filterRequirements(framework.requirements, searchQuery)
    : [];

  // Count leaf requirements (those without children)
  const countLeafRequirements = (requirements: FrameworkRequirementNode[]): number => {
    let count = 0;
    const traverse = (node: FrameworkRequirementNode) => {
      if (node.children.length === 0) {
        count++;
      } else {
        node.children.forEach(traverse);
      }
    };
    requirements.forEach(traverse);
    return count;
  };

  const totalLeafRequirements = framework ? countLeafRequirements(framework.requirements) : 0;

  const handleLinkControl = () => {
    if (selectedRequirement) {
      setIsLinkDialogOpen(true);
    }
  };

  const handleLinkSuccess = () => {
    onLinkSuccess?.();
    // Optionally clear selection after linking
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-32 bg-muted rounded" />
            </div>
          ) : framework ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="p-6 pb-4 border-b bg-background">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">
                      {framework.name}
                    </SheetTitle>
                    {framework.version && (
                      <SheetDescription>
                        Version {framework.version}
                      </SheetDescription>
                    )}
                  </div>
                </div>

                {framework.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {framework.description}
                  </p>
                )}
              </SheetHeader>

              {/* Progress Section */}
              {enabledFramework && (
                <div className="px-6 py-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Compliance Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-3" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">{implemented}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Implemented</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">{total - implemented}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">In Progress</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="font-semibold">{total}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="mx-6 mt-4 bg-muted/50 p-1 h-auto">
                    <TabsTrigger value="requirements" className="text-xs px-3 py-1.5">
                      Requirements ({totalLeafRequirements})
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="text-xs px-3 py-1.5">
                      Overview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="requirements" className="flex-1 flex flex-col overflow-hidden mt-0">
                    {/* Search */}
                    <div className="px-6 py-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search requirements..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Requirements Tree */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      <RequirementsTree
                        requirements={filteredRequirements}
                        selectedId={selectedRequirement?.id}
                        onSelect={setSelectedRequirement}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                    <div className="space-y-6">
                      {/* Framework Details */}
                      <div>
                        <h3 className="font-medium mb-3">About this Framework</h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>{framework.description}</p>
                        </div>
                      </div>

                      {/* Domains/Categories */}
                      <div>
                        <h3 className="font-medium mb-3">Requirement Categories</h3>
                        <div className="space-y-2">
                          {framework.requirements.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-background"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {category.code}
                                </span>
                                <span className="text-sm font-medium">{category.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {countLeafRequirements([category])} requirements
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Selected Requirement Detail */}
              {selectedRequirement && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">
                          {selectedRequirement.code}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{selectedRequirement.name}</h4>
                      {selectedRequirement.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedRequirement.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLinkControl}
                    >
                      <Link2 className="h-4 w-4 mr-1.5" />
                      Link Control
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Link Control Dialog */}
      <LinkControlDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        requirement={selectedRequirement}
        frameworkName={framework?.name || ''}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
}
