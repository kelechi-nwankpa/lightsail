import crypto from 'crypto';

interface EncryptedCredentials {
  encryptedData: string;
  iv: string;
  authTag: string;
  algorithm: 'aes-256-gcm';
  version: 1;
}

/**
 * CredentialVault provides AES-256-GCM encryption for integration credentials.
 *
 * All integration credentials (API keys, tokens, secrets) are encrypted before
 * being stored in the database. This ensures credentials are protected at rest.
 *
 * Usage:
 *   const encrypted = await credentialVault.encrypt({ accessToken: 'xxx' });
 *   const decrypted = await credentialVault.decrypt(encrypted);
 */
export class CredentialVault {
  private key: Buffer | null = null;
  private initialized = false;

  /**
   * Initialize the vault with encryption key from environment.
   * Call this during app startup.
   */
  initialize(): void {
    const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY;

    if (!keyHex) {
      // In development, use a default key (NOT for production!)
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'WARNING: INTEGRATION_ENCRYPTION_KEY not set. Using default key for development only.'
        );
        // Default dev key - 32 bytes as hex
        this.key = Buffer.from(
          'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
          'hex'
        );
      } else {
        throw new Error(
          'INTEGRATION_ENCRYPTION_KEY environment variable is required in production. ' +
          'Generate with: openssl rand -hex 32'
        );
      }
    } else if (keyHex.length !== 64) {
      throw new Error(
        'INTEGRATION_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
        'Generate with: openssl rand -hex 32'
      );
    } else {
      this.key = Buffer.from(keyHex, 'hex');
    }

    this.initialized = true;
  }

  /**
   * Encrypt credentials for secure storage.
   *
   * @param credentials - Object containing credential data (e.g., { accessToken: 'xxx' })
   * @returns Encrypted string safe for database storage
   */
  async encrypt(credentials: Record<string, unknown>): Promise<string> {
    this.ensureInitialized();

    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key!, iv);

    // Encrypt the JSON-stringified credentials
    const data = JSON.stringify(credentials);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (provides integrity verification)
    const authTag = cipher.getAuthTag();

    // Package everything together
    const result: EncryptedCredentials = {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: 'aes-256-gcm',
      version: 1,
    };

    return JSON.stringify(result);
  }

  /**
   * Decrypt credentials from storage.
   *
   * @param encryptedString - Encrypted string from database
   * @returns Original credentials object
   * @throws Error if decryption fails (tampered data, wrong key, etc.)
   */
  async decrypt(encryptedString: string): Promise<Record<string, unknown>> {
    this.ensureInitialized();

    let encrypted: EncryptedCredentials;

    try {
      encrypted = JSON.parse(encryptedString);
    } catch {
      throw new Error('Invalid encrypted credentials format');
    }

    // Validate structure
    if (!encrypted.encryptedData || !encrypted.iv || !encrypted.authTag) {
      throw new Error('Malformed encrypted credentials');
    }

    // Restore buffers from hex
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key!, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted: string;
    try {
      decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } catch {
      throw new Error('Failed to decrypt credentials. Data may be corrupted or key may be incorrect.');
    }

    // Parse back to object
    try {
      return JSON.parse(decrypted);
    } catch {
      throw new Error('Decrypted data is not valid JSON');
    }
  }

  /**
   * Test if the vault can encrypt/decrypt successfully.
   * Useful for health checks.
   */
  async testVault(): Promise<boolean> {
    try {
      const testData = { test: 'value', timestamp: Date.now() };
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      return decrypted.test === 'value';
    } catch {
      return false;
    }
  }

  /**
   * Check if credentials string is properly encrypted.
   * Does not validate the actual data, just the format.
   */
  isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;

    try {
      const parsed = JSON.parse(value);
      return (
        parsed.algorithm === 'aes-256-gcm' &&
        typeof parsed.encryptedData === 'string' &&
        typeof parsed.iv === 'string' &&
        typeof parsed.authTag === 'string'
      );
    } catch {
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.key) {
      throw new Error('Credential vault not properly initialized');
    }
  }
}

// Singleton instance
export const credentialVault = new CredentialVault();
