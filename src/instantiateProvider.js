import createProviderStore from './createProviderStore';
import { pushOnReady, unshiftOnReady, unshiftMiddleware } from './keyConcats';

/**
 * Instantiates a provider with its own store.
 *
 * @param {Object} provider
 * @param {Object} providerInstances Optional cache of instances
 * @param {Object} componentInstance Optional passed to providerKey function
 * @param {Function} readyCallback
 * @return {Object}
 * @api public
 */
export default function instantiateProvider(
  provider,
  providerInstances,
  componentInstance = { props: {}, context: {} },
  readyCallback
) {
  let providerInstance;
  let providerKey = provider.key;
  let isStatic = typeof providerKey !== 'function';

  if (!isStatic) {
    // get actual `providerKey`
    providerKey = providerKey(componentInstance);
    // if actual `providerKey` matches `key`, treat as static provider
    isStatic = providerKey === provider.key;
  }

  providerInstance = providerInstances && providerInstances[providerKey];

  if (providerInstance) {
    if (readyCallback) {
      if (providerInstance.ready) {
        readyCallback(providerInstance);
      } else {
        pushOnReady({ providerInstance }, readyCallback);
      }
    }

    return providerInstance;
  }

  if (!provider.hasThunk) {
    provider.hasThunk = true;

    if (provider.wait && !Array.isArray(provider.wait)) {
      provider.wait = [ provider.wait ];
    }

    if (provider.clear && !Array.isArray(provider.clear)) {
      provider.clear = [ provider.clear ];
    }

    function getInstance(someProvider, props, callback) {
      if (arguments.length === 2) {
        callback = props;
        props = someProvider;
        someProvider = provider;
      }

      instantiateProvider(
        someProvider,
        providerInstances,
        { ...componentInstance, props },
        callback
      );
    }

    unshiftMiddleware({ provider }, ({ dispatch, getState }) => {
      return next => action => {
        if (typeof action !== 'function') {
          return next(action);
        }

        if (provider.wait) {
          provider.wait.forEach(fn => fn());
        }

        return action(action => {
          const state = store.getState();
          let storeChanged = false;

          dispatch(action);

          if (provider.clear) {
            storeChanged = state !== store.getState();
            provider.clear.forEach(fn => fn(storeChanged));
          }
        }, getState, getInstance);
      };
    });
  }

  if (provider.wait) {
    provider.wait.forEach(fn => fn());
  }

  providerInstance = Object.create(provider);
  providerInstance.key = providerKey;
  providerInstance.isStatic = isStatic;

  const store = createProviderStore(providerInstance);
  const initialState = store.getState();
  const { actions } = providerInstance;
  const actionCreators = {};

  for (let actionKey in actions) {
    actionCreators[actionKey] = function() {
      return store.dispatch(actions[actionKey].apply(this, arguments));
    };
  }

  providerInstance.store = store;
  providerInstance.actionCreators = actionCreators;

  if (providerInstances) {
    providerInstances[providerKey] = providerInstance;
  }

  if (providerInstance.onInstantiated) {
    if (Array.isArray(providerInstance.onInstantiated)) {
      providerInstance.onInstantiated.forEach(fn => fn(providerInstance));
    } else {
      providerInstance.onInstantiated(providerInstance);
    }
  }

  unshiftOnReady({ providerInstance }, () => {
    providerInstance.ready = true;
  });

  if (readyCallback) {
    pushOnReady({ providerInstance }, readyCallback);
  }

  function done() {
    if (Array.isArray(providerInstance.onReady)) {
      providerInstance.onReady.forEach(fn => fn(providerInstance));
    } else {
      providerInstance.onReady(providerInstance);
    }

    if (provider.clear) {
      const storeChanged = initialState !== providerInstance.store.getState();
      provider.clear.forEach(fn => fn(storeChanged));
    }
  }

  if (
    providerInstance.replication
    && store.onReady
    && !store.initializedReplication
  ) {
    store.onReady(done);
  } else {
    done();
  }

  return providerInstance;
}
