// A compact built-in starter database. Runtime updates pull the larger Datadog
// consolidated IOC feed when network access is enabled.
export const EMBEDDED_IOCS = Object.freeze([
  // Shai-Hulud 1.x / September 2025 examples
  {
    name: '@ctrl/tinycolor',
    versions: ['4.1.1'],
    severity: 'critical',
    attack: 'shai-hulud-1.x',
    sources: ['embedded:jfrog-wiz-september-2025'],
    description: 'Shai-Hulud self-replicating npm malware; credential theft and propagation.'
  },

  // AsyncAPI packages
  { name: '@asyncapi/avro-schema-parser', versions: ['3.0.26'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/bundler', versions: ['0.6.6'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/cli', versions: ['4.1.3'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/converter', versions: ['1.6.4'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/diff', versions: ['0.5.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/generator', versions: ['2.8.6'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/modelina', versions: ['5.10.2', '5.10.3'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/parser', versions: ['3.4.1', '3.4.2'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/react-component', versions: ['2.6.7'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@asyncapi/specs', versions: ['6.8.2', '6.8.3', '6.10.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // ENS Domains packages
  { name: '@ensdomains/address-encoder', versions: ['1.1.5'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/blacklist', versions: ['1.0.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/ensjs', versions: ['4.0.3'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/thorin', versions: ['0.6.51'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/ui', versions: ['3.4.6'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/renewal', versions: ['0.0.13'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@ensdomains/test-utils', versions: ['1.3.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // PostHog packages
  { name: '@posthog/agent', versions: ['1.24.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/core', versions: ['1.5.6'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/hedgehog-mode', versions: ['0.0.42'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/maxmind-plugin', versions: ['0.1.6'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/nextjs', versions: ['0.0.3'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/piscina', versions: ['3.2.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/plugin-server', versions: ['1.10.8'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@posthog/rrweb', versions: ['0.0.31'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // Browserbase packages
  { name: '@browserbasehq/bb9', versions: ['1.2.21'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@browserbasehq/director-ai', versions: ['1.0.3'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@browserbasehq/mcp', versions: ['2.1.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@browserbasehq/stagehand', versions: ['3.0.4'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // Zapier / Anthropic packages
  { name: '@anthropic-ai/sdk', versions: ['0.37.0'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@zapier/secret-scrubber', versions: ['1.3.0'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // Accord Project packages
  { name: '@accordproject/concerto-metamodel', versions: ['3.12.5'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@accordproject/concerto-types', versions: ['3.24.1'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },
  { name: '@accordproject/template-engine', versions: ['2.7.2'], severity: 'critical', attack: 'shai-hulud-2.0', sources: ['embedded:legacy'], description: 'Shai-Hulud 2.0 supply-chain malware.' },

  // Shai-Hulud 3.0 / December 2025
  { name: '@vietmoney/react-big-calendar', versions: ['0.26.2'], severity: 'critical', attack: 'shai-hulud-3.0', sources: ['embedded:upwind-aikido-december-2025'], description: 'Shai-Hulud 3.0 install-time malware using bun_installer.js and environment_source.js.' },
  { name: '@vietmoney/react-native-smart-page', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-smart-gallery', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-true-id', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-tags-input', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-vnpay-merchant', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-image-transformer', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-htmlview', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/react-native-action-button', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },
  { name: '@vietmoney/vietmoneywork', versions: ['*'], severity: 'high', attack: 'shai-hulud-3.0', sources: ['embedded:legacy'], description: 'Removed/flagged @vietmoney package associated with Shai-Hulud 3.0 response.' },

  // Mini Shai-Hulud / TeamPCP-style 2026 npm campaign
  { name: 'mbt', versions: ['1.2.48'], severity: 'critical', attack: 'mini-shai-hulud-2026-04', sources: ['embedded:aikido-wiz-stepsecurity-april-2026'], description: 'Mini Shai-Hulud credential stealer with setup.mjs / execution.js preinstall payload.' },
  { name: '@cap-js/sqlite', versions: ['2.2.2'], severity: 'critical', attack: 'mini-shai-hulud-2026-04', sources: ['embedded:aikido-wiz-stepsecurity-april-2026'], description: 'Mini Shai-Hulud credential stealer with setup.mjs / execution.js preinstall payload.' },
  { name: '@cap-js/postgres', versions: ['2.2.2'], severity: 'critical', attack: 'mini-shai-hulud-2026-04', sources: ['embedded:aikido-wiz-stepsecurity-april-2026'], description: 'Mini Shai-Hulud credential stealer with setup.mjs / execution.js preinstall payload.' },
  { name: '@cap-js/db-service', versions: ['2.10.1'], severity: 'critical', attack: 'mini-shai-hulud-2026-04', sources: ['embedded:aikido-wiz-stepsecurity-april-2026'], description: 'Mini Shai-Hulud credential stealer with setup.mjs / execution.js preinstall payload.' },
  { name: 'intercom-client', versions: ['7.0.4'], severity: 'critical', attack: 'mini-shai-hulud-2026-04', sources: ['embedded:upwind-stepsecurity-socket-april-2026'], description: 'Mini Shai-Hulud / TeamPCP campaign; preinstall node setup.mjs and router_runtime.js multi-cloud credential stealer.' }
]);
