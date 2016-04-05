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
  const store = createProviderStore(providerInstance);
  const actions = providerInstance.actions;
  const actionCreators = {};
  let { onReady } = providerInstance;
  let readyCallback;

  providerInstance.key = providerKey;
  providerInstance.store = store;
  providerInstance.actionCreators = actionCreators;

  for (let actionKey in actions) {
    actionCreators[actionKey] = function() {
      store.dispatch(actions[actionKey].apply(this, arguments));
    };
  }

  if (onReady) {
    if (!Array.isArray(onReady)) {
      onReady = [ onReady ];
    }

    readyCallback = () => onReady.forEach(ready => ready(providerInstance));

    if (!providerInstance.replication || store.initializedReplication) {
      readyCallback();
    } else {
      store.onReady(readyCallback);
    }
  }

  return providerInstance;
}
