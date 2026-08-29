const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">supabase.co</domain>
    <domain includeSubdomains="true">vercel.app</domain>
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </domain-config>
  <debug-overrides>
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
</network-security-config>
`;

function withAndroidNetworkSecurityConfig(config) {
  config = withAndroidManifest(config, (nextConfig) => {
    const application = nextConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return nextConfig;
  });

  return withDangerousMod(config, [
    'android',
    (nextConfig) => {
      const xmlDir = path.join(nextConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_CONFIG);
      return nextConfig;
    },
  ]);
}

function readLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) {
        return acc;
      }
      acc[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      return acc;
    }, {});
}

const localEnv = readLocalEnv();
const readPublicConfig = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();

module.exports = ({ config }) => {
  const supabaseUrl = readPublicConfig(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    localEnv.EXPO_PUBLIC_SUPABASE_URL,
  );
  const supabaseAnonKey = readPublicConfig(
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    localEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
  const plugins = config.plugins ?? [];
  const hasNavigationBarConfig = plugins.some((plugin) => (
    Array.isArray(plugin) ? plugin[0] === 'expo-navigation-bar' : plugin === 'expo-navigation-bar'
  ));

  const nextConfig = {
    ...config,
    plugins: hasNavigationBarConfig
      ? plugins
      : [
          ...plugins,
          [
            'expo-navigation-bar',
            {
              enforceContrast: false,
              hidden: false,
              style: 'dark',
            },
          ],
        ],
    extra: {
      ...config.extra,
      ...(supabaseUrl ? { supabaseUrl } : {}),
      ...(supabaseAnonKey ? { supabaseAnonKey } : {}),
    },
  };

  return withAndroidNetworkSecurityConfig(nextConfig);
};
