import { registerRootComponent } from 'expo';

// Explicitly import the TypeScript navigation-based App so the AuthNavigator
// (with PIN setup/entry logic) is used instead of the legacy `App.js` file.
import App from './App.tsx';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
