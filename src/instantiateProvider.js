import createProviderStore from './createProviderStore';

/**
 * Instantiates a provider with its own store.
 *
 * @param {String} providerKey
 * @param {Object} provider
 * @return {Object}
 * @api public
 */
export default function instantiateProvider(providerKey, provider) {
  const providerInstance = Object.create(provider);

  providerInstance.key = providerKey;
  providerInstance.store = createProviderStore(providerInstance);
  providerInstance.actionCreators = {};

  for (let actionKey in providerInstance.actions) {
    providerInstance.actionCreators[actionKey] = function() {
      providerInstance.store.dispatch(
        providerInstance.actions[actionKey].apply(this, arguments)
      );
    };
  }

  return providerInstance;
}
