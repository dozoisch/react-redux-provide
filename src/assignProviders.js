import createProvider from './createProvider';
import namespaceProvider from './namespaceProvider';

/**
 * Assigns each provider to each component.  Expects each component to be
 * decorated with `@provide` such that it has an `addProvider` static method.
 *
 * @param {Object} providers
 * @param {Object} components
 * @api public
 */
export default function assignProviders (providers, components) {
  for (let key in providers) {
    let provider = providers[key];

    for (let componentName in components) {
      let addProvider = components[componentName].addProvider;
      
      if (typeof addProvider === 'function') {
        if (provider.namespaced || provider.name !== key) {
          provider = namespaceProvider(key, provider);
        }

        addProvider(key, createProvider(provider));
      }
    }
  }
}
