import 'babel-polyfill';

/**
 * Fixes things like `React.PropTypes.instanceOf(Map)` wrongly invalidating.
 */
if (typeof window !== 'undefined') {
  window.Map = Map;
  window.Set = Set;
  window.WeakMap = WeakMap;
  window.WeakSet = WeakSet;
} else {
  global.Map = Map;
  global.Set = Set;
  global.WeakMap = WeakMap;
  global.WeakSet = WeakSet;
}
