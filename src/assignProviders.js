import createProviderStore from './createProviderStore';

/**
 * Assigns each provider to each component.  Expects each component to be
 * decorated with `@provide` such that it has an `addProvider` static method.
 *
 * @param {Object} initialState Optional
 * @param {Object} providers
 * @param {Object} components
 * @api public
 */
export default function assignProviders (initialState, providers, components) {
  if (arguments.length === 2) {
    components = providers;
    providers = initialState;
    initialState = undefined;
  }

  for (let name in providers) {
    let provider = providers[name];

    if (!provider.name) {
      provider.name = name;
    }

    if (!provider.store) {
      provider.store = createProviderStore(provider, initialState);
    }

    for (let componentName in components) {
      let component = components[componentName];

      addValidProvider(provider, component);
    }
  }
}

/**
 * Adds the provider to the component if valid.
 *
 * @param {Object} provider
 * @param {Object} component
 * @api private
 */
function addValidProvider (provider, component) {
  const { WrappedComponent, addProvider } = component;

  if (!WrappedComponent || typeof addProvider !== 'function') {
    return false;
  }

  const { propTypes } = WrappedComponent;
  const { actions = {}, reducers = {}, merge } = provider;
  const merged = merge && merge(getReduced(reducers), {}, {}) || {};

  for (let propKey in propTypes) {
    if (propKey in actions || propKey in reducers || propKey in merged) {
      addProvider(provider);
      return;
    }
  }
}

/**
 * Gets the default result of each reducer.
 *
 * @param {Object} reducers
 * @api private
 */
function getReduced (reducers) {
  const reduced = {};

  for (let key in reducers) {
    reduced[key] = reducers[key](undefined, {});
  }

  return reduced;
}
