const fs = require('fs');
const path = require('path');

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

module.exports = ({ config }) => {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    localEnv.EXPO_PUBLIC_SUPABASE_URL ||
    localEnv.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    localEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    localEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
  const nvidiaApiKey =
    process.env.EXPO_PUBLIC_NVIDIA_API_KEY ||
    localEnv.EXPO_PUBLIC_NVIDIA_API_KEY ||
    localEnv.NVIDIA_API_KEY;
  const plugins = config.plugins ?? [];
  const hasNavigationBarConfig = plugins.some((plugin) => (
    Array.isArray(plugin) ? plugin[0] === 'expo-navigation-bar' : plugin === 'expo-navigation-bar'
  ));

  return {
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
      supabaseUrl,
      supabaseAnonKey,
      nvidiaApiKey,
    },
  };
};
