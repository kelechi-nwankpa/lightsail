import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { IntegrationTypeBadge, getIntegrationLabel } from './IntegrationTypeBadge';
import { useIntegrationMutations } from '../../hooks/use-integrations';
import { ArrowLeft, ArrowRight, Check, Loader2, Github, Cloud, Mail, Users, ClipboardList, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { IntegrationType } from '@lightsail/shared';
import { INTEGRATION_TYPE_DESCRIPTIONS } from '../../types/integrations';

interface ConnectIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'select' | 'configure' | 'connecting' | 'success';

interface IntegrationOption {
  type: IntegrationType;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const INTEGRATION_OPTIONS: IntegrationOption[] = [
  { type: 'github', icon: Github, available: true },
  { type: 'aws', icon: Cloud, available: false },
  { type: 'gsuite', icon: Mail, available: false },
  { type: 'azure_ad', icon: Users, available: false },
  { type: 'jira', icon: ClipboardList, available: false },
  { type: 'slack', icon: MessageSquare, available: false },
];

// Credential fields by integration type
const CREDENTIAL_FIELDS: Record<IntegrationType, Array<{
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  helpText?: string;
  helpLink?: { text: string; url: string };
}>> = {
  github: [
    {
      key: 'accessToken',
      label: 'Personal Access Token',
      type: 'password',
      placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      helpText: 'Create a token with repo, read:org, and admin:repo_hook scopes.',
      helpLink: {
        text: 'Create GitHub Token',
        url: 'https://github.com/settings/tokens/new?description=Lightsail%20Integration&scopes=repo,read:org,admin:repo_hook',
      },
    },
  ],
  aws: [],
  gsuite: [],
  azure_ad: [],
  jira: [],
  slack: [],
};

// Config fields by integration type
const CONFIG_FIELDS: Record<IntegrationType, Array<{
  key: string;
  label: string;
  type: 'text' | 'checkbox';
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | boolean;
}>> = {
  github: [
    {
      key: 'organization',
      label: 'Organization (optional)',
      type: 'text',
      placeholder: 'my-org',
      helpText: 'Leave blank to sync all accessible repositories.',
    },
  ],
  aws: [],
  gsuite: [],
  azure_ad: [],
  jira: [],
  slack: [],
};

export function ConnectIntegrationDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConnectIntegrationDialogProps) {
  const { connectIntegration, isLoading } = useIntegrationMutations();

  const [step, setStep] = useState<Step>('select');
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    evidenceGenerated: number;
    controlsVerified: number;
    message: string;
  } | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select');
        setSelectedType(null);
        setName('');
        setCredentials({});
        setConfig({});
        setError(null);
        setResult(null);
      }, 200);
    }
  }, [open]);

  // Set default name when type is selected
  useEffect(() => {
    if (selectedType) {
      setName(getIntegrationLabel(selectedType));
    }
  }, [selectedType]);

  const handleTypeSelect = (type: IntegrationType) => {
    const option = INTEGRATION_OPTIONS.find((o) => o.type === type);
    if (option?.available) {
      setSelectedType(type);
      setStep('configure');
    }
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select');
      setSelectedType(null);
    }
  };

  const handleConnect = async () => {
    if (!selectedType) return;

    setError(null);
    setStep('connecting');

    try {
      const response = await connectIntegration({
        type: selectedType,
        name,
        credentials,
        config,
      });

      setResult(response);
      setStep('success');
    } catch (err) {
      console.error('Failed to connect integration:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect integration');
      setStep('configure');
    }
  };

  const handleDone = () => {
    onOpenChange(false);
    onSuccess();
  };

  const credentialFields = selectedType ? CREDENTIAL_FIELDS[selectedType] : [];
  const configFields = selectedType ? CONFIG_FIELDS[selectedType] : [];

  const isValid = name.trim() && credentialFields.every((f) => credentials[f.key]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Connect Integration'}
            {step === 'configure' && selectedType && (
              <div className="flex items-center gap-2">
                <IntegrationTypeBadge type={selectedType} />
                <span>Connect {getIntegrationLabel(selectedType)}</span>
              </div>
            )}
            {step === 'connecting' && 'Connecting...'}
            {step === 'success' && 'Connected Successfully'}
          </DialogTitle>
          {step === 'select' && (
            <DialogDescription>
              Connect your tools and services to automatically collect compliance evidence.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Select Integration Type */}
          {step === 'select' && (
            <div className="grid grid-cols-2 gap-3">
              {INTEGRATION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    onClick={() => handleTypeSelect(option.type)}
                    disabled={!option.available}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border text-left transition-all',
                      option.available
                        ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getIntegrationLabel(option.type)}</p>
                      {!option.available && (
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedType && (
            <div className="space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {INTEGRATION_TYPE_DESCRIPTIONS[selectedType]}
              </p>

              {/* Integration Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My GitHub Integration"
                />
              </div>

              {/* Credential Fields */}
              {credentialFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={credentials[field.key] || ''}
                    onChange={(e) =>
                      setCredentials({ ...credentials, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                  />
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                  {field.helpLink && (
                    <a
                      href={field.helpLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {field.helpLink.text}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}

              {/* Config Fields */}
              {configFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.type === 'text' && (
                    <Input
                      id={field.key}
                      value={(config[field.key] as string) || ''}
                      onChange={(e) =>
                        setConfig({ ...config, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Connecting */}
          {step === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Connecting and running initial sync...
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && result && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-medium mb-2">Integration Connected!</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {result.message}
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-2xl font-semibold text-green-600">
                    {result.evidenceGenerated}
                  </p>
                  <p className="text-xs text-muted-foreground">Evidence Created</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-2xl font-semibold text-blue-600">
                    {result.controlsVerified}
                  </p>
                  <p className="text-xs text-muted-foreground">Controls Verified</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'select' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleConnect} disabled={!isValid || isLoading}>
                Connect
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'success' && (
            <Button onClick={handleDone}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
