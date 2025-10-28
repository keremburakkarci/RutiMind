const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Use metro-react-native-babel-transformer so Metro will run our Babel
// pipeline on transpiled node_modules (where ESM `import.meta` may appear).
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Ensure Metro treats .mjs/.cjs files as source so they can be transpiled
config.resolver = {
  ...config.resolver,
  blockList: config.resolver.blockList || [],
  extraNodeModules: {
    ...(config.resolver.extraNodeModules || {}),
    // Point `zustand` to the package folder so Metro resolves using the
    // package's `main`/`react-native` fields (we set mainFields above to
    // prefer those). Avoid mapping to individual files which can confuse
    // Metro's resolver internals.
    zustand: path.resolve(__dirname, 'node_modules', 'zustand'),
  },
  // Ensure Metro will prefer react-native -> main fields when resolving
  // packages. We intentionally omit 'module' and 'import' so Metro doesn't
  // prefer ESM entrypoints (which may contain `import.meta`).
  mainFields: ['react-native', 'main'],
  sourceExts: Array.from(new Set([...(config.resolver.sourceExts || []), 'mjs', 'cjs'])),
};

// Add packages that commonly use import.meta (or other ESM-only syntax)
// so we can point Metro to their folders (watchFolders) and let the
// babelTransformer process them. If a package folder doesn't exist we
// skip it quietly.
const packagesToTranspile = [
  'cjs-module-lexer',
  'babel-preset-expo',
  'metro-react-native-babel-preset',
  '@babel/preset-env',
  '@babel/plugin-syntax-import-meta',
  'babel-plugin-transform-import-meta',
  '@babel/core',
  '@babel/plugin-transform-runtime',
  'metro',
  'metro-config',
  'metro-resolver',
  'metro-transform-worker',
  'metro-cache',
  'metro-source-map',
  'metro-symbolicate',
  'metro-minify-uglify',
  'metro-babel-transformer',
  'metro-react-native-babel-transformer',
  'zustand', // Found in bundle - uses import.meta.env
];

const ensurePath = pkgName => path.resolve(__dirname, 'node_modules', pkgName);
const existingPkgPaths = packagesToTranspile
  .map(ensurePath)
  .filter(p => {
    try {
      return fs.statSync(p).isDirectory();
    } catch (e) {
      return false;
    }
  });

config.watchFolders = [...config.watchFolders, ...existingPkgPaths];

module.exports = config;