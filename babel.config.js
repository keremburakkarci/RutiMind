module.exports = function (api) {
  api && api.cache && api.cache(true);

  // Detect web bundling early so we don't reference it before initialization.
  // Avoid loading react-native-reanimated/plugin during web bundling because
  // it may require native-only modules like 'react-native-worklets'.
  const isWeb =
    process.env.BABEL_ENV === 'web' ||
    process.env.EXPO_WEB === 'true' ||
    process.env.REACT_NATIVE_WEB === 'true';

  // Use the expo preset. When targeting web, enable the preset's
  // unstable_transformImportMeta option so import.meta is transformed
  // into a runtime-safe form (handled by the preset).
  const presets = isWeb
    ? [['babel-preset-expo', { unstable_transformImportMeta: true }]]
    : ['babel-preset-expo'];

  const plugins = [];
  if (!isWeb) {
    plugins.push('react-native-reanimated/plugin');
  } else {
    // On web we need to transform `import.meta` usage (some deps use it).
    // Apply syntax plugin + transform plugin to rewrite/strip import.meta so
    // bundlers that don't run ESM module scripts won't fail at runtime.
    plugins.push('@babel/plugin-syntax-import-meta');
    plugins.push('babel-plugin-transform-import-meta');
  }

  return {
    presets,
    plugins,
  };
};