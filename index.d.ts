export interface VulnEntry {
  name: string;
  versions: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  attack: string;
  description: string;
  sources: string[];
}

export interface DatabaseInfo {
  version: string;
  createdAt: string;
  lastUpdated: string | null;
  lastCheckTime: string | null;
  packageCount: number;
  versionCount: number;
  sources: string[];
}

export interface UpdateResult {
  success: boolean;
  before: number;
  after: number;
  added: number;
  mergedRows?: number;
  sources: string[];
  errors: string[];
}

export interface Finding {
  id: string;
  type: 'package-ioc' | 'lockfile-ioc' | 'manifest-ioc' | 'manifest-self-ioc' | 'live-osv-advisory' | 'live-github-advisory' | 'live-github-malware-advisory' | 'suspicious-file' | 'suspicious-directory' | 'suspicious-script' | 'suspicious-workflow' | 'suspicious-config' | string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  path: string;
  packageName?: string;
  packageVersion?: string;
  attack?: string;
  description: string;
  evidence: string;
  source: string;
  remediation: string;
  url?: string;
  advisoryId?: string;
  aliases?: string[];
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface PackageInventoryEntry {
  name: string;
  version: string;
  paths: string[];
  sources: string[];
}

export interface ScanStats {
  scannedPaths: string[];
  nodeModulesFound: number;
  packagesScanned: number;
  lockFilesScanned: number;
  lockfilePackagesScanned: number;
  manifestsScanned: number;
  iocFilesScanned: number;
  workflowsScanned: number;
  inventoryPackages: number;
  livePackagesQueried?: number;
  liveFindings?: number;
  liveSources?: string[];
}

export interface ScanResult {
  tool?: { name: string; version: string };
  scannedPaths: string[];
  findings: Finding[];
  vulnerabilities: Finding[];
  warnings: Array<{ path: string; message: string }>;
  inventory: PackageInventoryEntry[];
  stats: ScanStats;
  database: DatabaseInfo;
  liveAdvisories?: LiveAdvisoryResult;
  scanTimeMs: number;
}

export interface ScannerOptions {
  maxSearchDepth?: number;
  maxLockfileDepth?: number;
  maxManifestDepth?: number;
  maxPackageJsonBytes?: number;
  followSymlinks?: boolean;
}

export interface ScanOptions {
  includeNodeModules?: boolean;
  includeLockfiles?: boolean;
  includeManifests?: boolean;
  includeIocFiles?: boolean;
}

export interface AuditVulnerability {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  url: string;
  range: string;
  fixAvailable: boolean;
  via: string[];
}

export interface AuditResult {
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'none';
  success: boolean;
  error?: string;
  vulnerabilities: AuditVulnerability[];
  summary: { total: number; critical: number; high: number; medium: number; low: number; info: number };
}

export interface LiveAdvisoryVulnerability {
  source: 'osv.dev' | 'github-advisory-database' | string;
  id: string;
  aliases: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  summary: string;
  details?: string;
  packageName: string;
  packageVersion: string;
  packageSources?: string[];
  packagePaths?: string[];
  modified?: string | null;
  published?: string | null;
  references?: string[];
  advisoryType?: 'reviewed' | 'malware' | 'unreviewed' | string;
  vulnerableRange?: string;
  patchedVersion?: string | null;
  withdrawnAt?: string | null;
}

export interface LiveSourceResult {
  source: string;
  ecosystem: 'npm';
  packagesQueried: number;
  vulnerabilities: LiveAdvisoryVulnerability[];
  errors: string[];
  truncated: boolean;
  generatedAt: string;
}

export interface LiveAdvisoryResult {
  enabled: boolean;
  ecosystem: 'npm';
  packagesQueried: number;
  sources: string[];
  findings: Finding[];
  results: Record<string, LiveSourceResult>;
  errors: string[];
  generatedAt: string;
}

export interface LiveSourceOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  batchSize?: number;
  githubBatchSize?: number;
  maxPackages?: number;
  detailLimit?: number;
  githubToken?: string;
  githubTypes?: Array<'reviewed' | 'malware' | 'unreviewed'>;
  sources?: Array<'osv' | 'github'> | string;
  source?: Array<'osv' | 'github'> | string;
  osv?: boolean;
  github?: boolean;
  offline?: boolean;
  onProgress?: (message: string) => void;
}

export class VulnerabilityDatabase {
  constructor(options?: { offline?: boolean; cachePath?: string; noCache?: boolean });
  addEntry(entry: Partial<VulnEntry> & { name: string; versions?: string[]; version?: string }, context?: Record<string, unknown>): boolean;
  check(name: string, version: string): VulnEntry | null;
  checkManifestRange(name: string, range: string): (VulnEntry & { matchedRange: string }) | null;
  search(query: string): VulnEntry[];
  getAllEntries(): VulnEntry[];
  getInfo(): DatabaseInfo;
  shouldAutoUpdate(intervalHours?: number): boolean;
  importCsvText(text: string, options?: Record<string, unknown>): number;
  importCsvFile(filePath: string, options?: Record<string, unknown>): number;
  update(onProgress?: (message: string) => void): Promise<UpdateResult>;
}

export class Scanner {
  constructor(db: VulnerabilityDatabase, options?: ScannerOptions);
  scan(paths: string[], options?: ScanOptions, onProgress?: (progress: { phase: string; path: string; stats: ScanStats }) => void): Promise<ScanResult>;
}

export function getDatabase(options?: { offline?: boolean; cachePath?: string; noCache?: boolean }): VulnerabilityDatabase;
export function getCommonScanPaths(): string[];
export function parseLockFile(filePath: string): Array<{ name: string; version: string; source: string }> | { packages: []; warning: string };
export function parsePackageLock(filePath: string): Array<{ name: string; version: string; source: string }>;
export function parsePnpmLock(filePath: string): Array<{ name: string; version: string; source: string }>;
export function parseYarnLock(filePath: string): Array<{ name: string; version: string; source: string }>;
export function parseBunLock(filePath: string): Array<{ name: string; version: string; source: string }>;
export function detectPackageManager(dir: string): 'npm' | 'pnpm' | 'yarn' | 'none';
export function runAudit(dir: string, onProgress?: (message: string) => void): Promise<AuditResult>;
export function queryOsvForPackages(packages: PackageInventoryEntry[], options?: LiveSourceOptions): Promise<LiveSourceResult>;
export function queryGithubAdvisoriesForPackages(packages: PackageInventoryEntry[], options?: LiveSourceOptions): Promise<LiveSourceResult>;
export function queryLiveAdvisories(packages: PackageInventoryEntry[], options?: LiveSourceOptions, onProgress?: (message: string) => void): Promise<LiveAdvisoryResult>;
export function liveVulnToFinding(vulnerability: LiveAdvisoryVulnerability): Finding;
export function renderJsonReport(result: ScanResult, options?: { auditResult?: AuditResult | null }): string;
export function renderSarifReport(result: ScanResult): string;
export function renderTextReport(result: ScanResult, options?: { auditResult?: AuditResult | null; color?: boolean }): string;
export function rangeMayIncludeVersion(range: string, version: string): boolean;
export const EXIT_CODES: Record<string, number>;
export const DEFAULTS: Record<string, unknown>;
export const DATA_SOURCES: Array<Record<string, string>>;
export const IOC_FILE_NAMES: string[];
export const LOCK_FILE_NAMES: string[];
