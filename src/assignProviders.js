/**
 * Assigns each provider to each component.  Expects each component to be
 * decorated with `@provide` such that it has an `addProvider` static method.
 *
 * @param {Object} providers
 * @param {Object} components
 * @api public
 */
export default function assignProviders (providers, components) {
  for (let providerName in providers) {
    let provider = providers[providerName];

    if (provider.default) {
      provider = provider.default;
    } else if (provider.provider) {
      provider = provider.provider;
    }

    for (let componentName in components) {
      let addProvider = components[componentName].addProvider;
      
      if (typeof addProvider === 'function') {
        addProvider(providerName, provider);
      }
    }
  }
}
