import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import replicate from 'redux-replicate';

export function getClientState({ providerKey }) {
  if (typeof window !== 'undefined' && window.clientStates) {
    const clientState = window.clientStates[providerKey];

    if (typeof clientState !== 'undefined') {
      return clientState;
    }
  }

  return null;
}

export function getInitialState({ providerKey, state }) {
  const clientState = getClientState({ providerKey, state });

  if (clientState) {
    delete window.clientStates[providerKey];

    return state ? { ...state, ...clientState } : clientState;
  }

  return state || {};
}

/**
 * Creates and returns a store specifically for some provider instance.
 *
 * @param {Object} providerInstance
 * @return {Object}
 * @api public
 */
export default function createProviderStore(providerInstance) {
  let storeKey = providerInstance.providerKey;
  const { reducers, middleware, enhancer, replication } = providerInstance;
  const watchedReducers = {};
  const watching = {};
  let enhancers = [];
  let create;
  let store;
  let setState;
  let settingState;
  let combinedReducers;

  function unshiftReplication({ key, reducerKeys, queryable, replicator }) {
    if (replicator) {
      enhancers.unshift(
        replicate({
          key: typeof key === 'undefined' ? storeKey : key,
          reducerKeys,
          queryable,
          replicator,
          clientState: getClientState(providerInstance)
        })
      );
    }
  }

  if (middleware) {
    enhancers.push(applyMiddleware.apply(null, [].concat(middleware)));
  }

  if (enhancer) {
    enhancers = enhancers.concat(enhancer);
  }

  if (replication) {
    if (Array.isArray(replication)) {
      for (let { key } of replication) {
        if (typeof key !== 'undefined') {
          storeKey = key;
          break;
        }
      }

      replication.forEach(unshiftReplication);
    } else {
      unshiftReplication(replication);
    }
  }

  if (enhancers.length) {
    create = compose(...enhancers)(createStore);
  } else {
    create = createStore;
  }

  Object.keys(reducers).forEach(reducerKey => {
    watchedReducers[reducerKey] = (state, action) => {
      let nextState;

      if (settingState && typeof settingState[reducerKey] !== 'undefined') {
        nextState = settingState[reducerKey];
      } else {
        nextState = reducers[reducerKey](state, action);
      }

      if (watching[reducerKey] && state !== nextState) {
        watching[reducerKey].forEach(fn => fn(nextState));
      }

      return nextState;
    };
  });

  combinedReducers = combineReducers(watchedReducers);
  store = create(combinedReducers, getInitialState(providerInstance));

  // we use a custom `watch` method with instead of a replicator
  // since it's slightly more efficient and every clock cycle counts,
  // especially with potentially thousands or even millions of components
  store.watch = (reducerKey, fn) => {
    if (!watching[reducerKey]) {
      watching[reducerKey] = new Set();
    }

    watching[reducerKey].add(fn);

    return () => watching[reducerKey].delete(fn);
  };

  setState = store.setState;
  store.setState = nextState => {
    const state = store.getState();

    if (setState) {
      for (let reducerKey in nextState) {
        let current = state[reducerKey];
        let next = nextState[reducerKey];

        if (watching[reducerKey] && current !== next) {
          watching[reducerKey].forEach(fn => fn(next));
        }
      }

      setState(nextState);
    } else {
      settingState = nextState;
      store.replaceReducer(combinedReducers);
      settingState = null;
    }
  };

  return store;
}
