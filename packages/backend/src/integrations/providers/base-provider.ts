import type {
  ConnectionResult,
  TestResult,
  CollectionResult,
  GeneratedEvidence,
  ControlMapping,
  IntegrationProviderConfig,
  CollectorInfo,
  CredentialField,
  ConfigField,
} from '../engine/types.js';
import type { IntegrationType } from '@lightsail/shared';

/**
 * BaseIntegrationProvider is the abstract interface that all integration providers must implement.
 *
 * Each provider (GitHub, AWS, Google Workspace, etc.) extends this class and implements
 * the required methods for connecting, collecting data, and generating evidence.
 *
 * Example usage:
 *   const github = new GitHubProvider({
 *     organizationId: 'org_xxx',
 *     integrationId: 'int_xxx',
 *     credentials: { accessToken: 'ghp_xxx' },
 *     config: { organization: 'my-org' },
 *   });
 *   await github.connect();
 *   const results = await github.collect();
 *   const evidence = github.generateEvidence(results);
 */
export abstract class BaseIntegrationProvider {
  // ==========================================
  // Static properties (must be implemented)
  // ==========================================

  /** Integration type identifier */
  abstract readonly type: IntegrationType;

  /** Human-readable name */
  abstract readonly displayName: string;

  /** Description for UI */
  abstract readonly description: string;

  /** Icon identifier for frontend */
  abstract readonly icon: string;

  /** Required credential fields */
  abstract readonly requiredCredentials: CredentialField[];

  /** Optional configuration fields */
  abstract readonly configFields: ConfigField[];

  // ==========================================
  // Instance properties
  // ==========================================

  protected readonly organizationId: string;
  protected readonly integrationId: string;
  protected credentials: Record<string, unknown>;
  protected config: Record<string, unknown>;
  protected connected = false;

  constructor(providerConfig: IntegrationProviderConfig) {
    this.organizationId = providerConfig.organizationId;
    this.integrationId = providerConfig.integrationId;
    this.credentials = providerConfig.credentials;
    this.config = providerConfig.config;
  }

  // ==========================================
  // Connection methods (must be implemented)
  // ==========================================

  /**
   * Connect to the integration provider.
   * Validates credentials and establishes connection.
   *
   * @returns Connection result with success status and metadata
   */
  abstract connect(): Promise<ConnectionResult>;

  /**
   * Disconnect from the provider and cleanup resources.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Test the connection without performing a full sync.
   * Useful for health checks and connection verification.
   *
   * @returns Test result with latency and available scopes
   */
  abstract testConnection(): Promise<TestResult>;

  // ==========================================
  // Collection methods (must be implemented)
  // ==========================================

  /**
   * Get list of available collectors for this provider.
   * Each collector gathers a specific type of data.
   *
   * @returns Array of collector information
   */
  abstract getAvailableCollectors(): CollectorInfo[];

  /**
   * Run data collection using specified collectors.
   *
   * @param collectors - Array of collector IDs to run (empty = all)
   * @returns Array of collection results
   */
  abstract collect(collectors?: string[]): Promise<CollectionResult[]>;

  // ==========================================
  // Evidence generation (must be implemented)
  // ==========================================

  /**
   * Transform raw collection results into evidence records.
   *
   * @param results - Collection results from collect()
   * @returns Array of evidence ready for database insertion
   */
  abstract generateEvidence(results: CollectionResult[]): GeneratedEvidence[];

  /**
   * Get control mappings for auto-linking evidence to controls.
   *
   * @returns Array of control mappings
   */
  abstract getControlMappings(): ControlMapping[];

  // ==========================================
  // Utility methods (provided by base class)
  // ==========================================

  /**
   * Validate that all required credentials are present.
   *
   * @returns Array of missing credential keys (empty if all present)
   */
  protected validateCredentials(): string[] {
    const missing: string[] = [];

    for (const field of this.requiredCredentials) {
      if (field.required && !this.credentials[field.key]) {
        missing.push(field.key);
      }
    }

    return missing;
  }

  /**
   * Get a typed credential value.
   */
  protected getCredential<T = string>(key: string): T | undefined {
    return this.credentials[key] as T | undefined;
  }

  /**
   * Get a typed config value with optional default.
   */
  protected getConfig<T>(key: string, defaultValue?: T): T {
    const value = this.config[key];
    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * Check if the provider is currently connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure the provider is connected before performing operations.
   *
   * @throws Error if not connected
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error(`${this.displayName} provider is not connected. Call connect() first.`);
    }
  }

  /**
   * Create a standard evidence validity window (default 24 hours).
   */
  protected createValidityWindow(hoursValid = 24): { validFrom: Date; validUntil: Date } {
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + hoursValid * 60 * 60 * 1000);
    return { validFrom, validUntil };
  }
}
