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
  const providerInstance = Object.create(provider, {
    key: { writable: true, configurable: true, value: providerKey }
  });
  const store = createProviderStore(providerInstance);
  const actions = providerInstance.actions;
  const actionCreators = {};
  let { onInstantiated, onReady } = providerInstance;
  let readyCallback;

  providerInstance.store = store;
  providerInstance.actionCreators = actionCreators;

  for (let actionKey in actions) {
    actionCreators[actionKey] = function() {
      store.dispatch(actions[actionKey].apply(this, arguments));
    };
  }

  if (onInstantiated) {
    if (!Array.isArray(onInstantiated)) {
      onInstantiated = [ onInstantiated ];
    }

    onInstantiated.forEach(fn => fn(providerInstance));
  }

  if (onReady) {
    if (!Array.isArray(onReady)) {
      onReady = [ onReady ];
    }

    readyCallback = () => onReady.forEach(fn => fn(providerInstance));

    if (!providerInstance.replication || store.initializedReplication) {
      readyCallback();
    } else if (store.onReady) {
      store.onReady(readyCallback);
    }
  }

  return providerInstance;
}
