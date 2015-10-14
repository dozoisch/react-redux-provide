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
    let { store } = provider;

    if (!store) {
      store = createProviderStore(provider, initialState);
    }

    for (let componentName in components) {
      let addProvider = components[componentName].addProvider;
      
      if (typeof addProvider === 'function') {
        addProvider({ name, store, ...provider });
      }
    }
  }
}
