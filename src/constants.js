export const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  VULNERABILITIES_FOUND: 1,
  SCAN_ERROR: 2,
  UPDATE_ERROR: 3,
  INVALID_ARGS: 4,
  INTERRUPTED: 130
});

export const DEFAULTS = Object.freeze({
  MAX_SEARCH_DEPTH: 10,
  MAX_LOCKFILE_DEPTH: 8,
  MAX_MANIFEST_DEPTH: 8,
  MAX_PACKAGE_JSON_BYTES: 1024 * 1024,
  MAX_TEXT_FILE_BYTES: 2 * 1024 * 1024,
  MAX_REMOTE_BYTES: 5 * 1024 * 1024,
  FETCH_TIMEOUT_MS: 15000,
  AUTO_UPDATE_INTERVAL_HOURS: 6,
  FILE_MODE_PRIVATE: 0o600,
  DIR_MODE_PRIVATE: 0o700,
  OSV_BATCH_SIZE: 500,
  GITHUB_ADVISORY_BATCH_SIZE: 50,
  MAX_LIVE_OSV_PACKAGES: 5000,
  MAX_LIVE_GITHUB_PACKAGES: 5000,
  MAX_LIVE_OSV_DETAILS: 300
});

export const DATA_SOURCES = Object.freeze([
  {
    id: 'datadog-consolidated-shai-hulud-2',
    attack: 'shai-hulud-2.0',
    severity: 'critical',
    format: 'datadog-consolidated-csv',
    url: 'https://raw.githubusercontent.com/DataDog/indicators-of-compromise/refs/heads/main/shai-hulud-2.0/consolidated_iocs.csv'
  },
  {
    id: 'datadog-confirmed-shai-hulud-2',
    attack: 'shai-hulud-2.0',
    severity: 'critical',
    format: 'datadog-simple-csv',
    url: 'https://raw.githubusercontent.com/DataDog/indicators-of-compromise/refs/heads/main/shai-hulud-2.0/shai-hulud-2.0.csv'
  }
]);

export const LOCK_FILE_NAMES = Object.freeze([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb'
]);

export const PROJECT_MANIFEST_NAMES = Object.freeze(['package.json']);

export const IOC_FILE_NAMES = Object.freeze([
  // Shai-Hulud 1.x / 2.0
  'setup_bun.js',
  'bun_environment.js',
  'processor.sh',
  'migrate-repos.sh',
  'contents.json',
  'environment.json',
  'cloud.json',

  // Shai-Hulud 3.0
  'bun_installer.js',
  'environment_source.js',
  '3nvir0nm3nt.json',
  'pigS3cr3ts.json',
  'actionsSecrets.json',
  'cl0vd.json',
  'c9nt3nts.json',
  'c0nt3nts.json',

  // Mini Shai-Hulud / TeamPCP-style payloads observed in 2026
  'setup.mjs',
  'execution.js',
  'router_runtime.js'
]);

export const IOC_DIRECTORY_NAMES = Object.freeze([
  // .claude and .vscode are scanned by content-specific persistence detectors instead of by directory name;
  // flagging those directories by name alone creates too many false positives in normal projects.
  '.dev-env'
]);

export const SUSPICIOUS_SCRIPT_PATTERNS = Object.freeze([
  { id: 'shai-file-setup-bun', severity: 'critical', pattern: /\bsetup_bun\.js\b/i, label: 'Shai-Hulud 2.0 loader setup_bun.js' },
  { id: 'shai-file-bun-environment', severity: 'critical', pattern: /\bbun_environment\.js\b/i, label: 'Shai-Hulud 2.0 payload bun_environment.js' },
  { id: 'shai3-bun-installer', severity: 'critical', pattern: /\bbun_installer\.js\b/i, label: 'Shai-Hulud 3.0 loader bun_installer.js' },
  { id: 'shai3-environment-source', severity: 'critical', pattern: /\benvironment_source\.js\b/i, label: 'Shai-Hulud 3.0 payload environment_source.js' },
  { id: 'mini-shai-setup-mjs', severity: 'high', pattern: /\bnode\s+setup\.mjs\b|\bsetup\.mjs\b/i, label: 'Mini Shai-Hulud-style setup.mjs lifecycle hook' },
  { id: 'mini-shai-runtime', severity: 'high', pattern: /\b(execution|router_runtime)\.js\b/i, label: 'Mini Shai-Hulud-style runtime payload' },
  { id: 'trufflehog-install', severity: 'high', pattern: /\btrufflehog\b/i, label: 'Secret-scanning tool invoked from lifecycle script' },
  { id: 'github-api-exfil', severity: 'medium', pattern: /api\.github\.com\/(user|repos)|raw\.githubusercontent\.com/i, label: 'GitHub API usage in install script' },
  { id: 'webhook-site-exfil', severity: 'high', pattern: /webhook\.site/i, label: 'webhook.site exfiltration endpoint in script' },
  { id: 'curl-pipe-shell', severity: 'medium', pattern: /\b(curl|wget)\b[\s\S]{0,120}\|\s*(sh|bash|node|bun)\b/i, label: 'Remote script piped into interpreter' },
  { id: 'powershell-bypass', severity: 'medium', pattern: /powershell(?:\.exe)?[\s\S]{0,120}-ExecutionPolicy\s+Bypass/i, label: 'PowerShell execution-policy bypass' },
  { id: 'cloud-imds', severity: 'medium', pattern: /169\.254\.169\.254|metadata\.google\.internal/i, label: 'Cloud metadata endpoint access' },
  { id: 'shai-keyword', severity: 'critical', pattern: /sha1?-hulud|shai[-_ ]hulud|SHA1HULUD/i, label: 'Shai-Hulud campaign marker' },
  { id: 'mini-shai-keyword', severity: 'high', pattern: /mini\s+shai\s+hulud|beautifulcastle|zero\.masscan\.cloud/i, label: 'Mini Shai-Hulud campaign marker' }
]);

export const WORKFLOW_PATTERNS = Object.freeze([
  { id: 'discussion-trigger', severity: 'high', pattern: /on:\s*(?:\n[\s\S]{0,200})?discussion\b/i, label: 'GitHub Actions discussion trigger' },
  { id: 'workflow-webhook', severity: 'critical', pattern: /webhook\.site|zero\.masscan\.cloud|94\.154\.172\[?\.?\]?43/i, label: 'Known exfiltration infrastructure in workflow' },
  { id: 'workflow-shai', severity: 'critical', pattern: /sha1?-hulud|shai[-_ ]hulud|mini\s+shai\s+hulud/i, label: 'Shai-Hulud marker in workflow' },
  { id: 'workflow-token-dump', severity: 'medium', pattern: /secrets\.\*|toJson\(secrets\)|GITHUB_TOKEN|NPM_TOKEN/i, label: 'Workflow references broad secret/token material' },
  { id: 'workflow-runner', severity: 'medium', pattern: /self-hosted|actions\/runner|config\.sh|run\.sh/i, label: 'Self-hosted runner bootstrap in workflow' }
]);

export const CONFIG_FILE_PATTERNS = Object.freeze([
  { id: 'claude-sessionstart', severity: 'high', pattern: /SessionStart|\.claude\/settings\.json|runOn/i, label: 'AI-agent/IDE persistence hook' },
  { id: 'vscode-runon-folderopen', severity: 'high', pattern: /"runOn"\s*:\s*"folderOpen"|tasks\.json/i, label: 'VS Code folder-open task execution' }
]);

export const SKIP_DIRS = Object.freeze(new Set([
  '.git', '.hg', '.svn', '.next', '.nuxt', '.cache', '.turbo', '.parcel-cache',
  'coverage', 'dist', 'build', 'out', 'vendor', '__pycache__', 'venv', '.venv'
]));
