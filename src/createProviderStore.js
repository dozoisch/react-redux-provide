import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import replicate from 'redux-replicate';

function getClientState({ key, state }) {
  if (typeof window !== 'undefined' && window.clientStates) {
    const clientState = window.clientStates[key];

    if (typeof clientState !== 'undefined') {
      return clientState;
    }
  }

  return null;
}

function getInitialState({ key, state }) {
  const clientState = getClientState({ key, state });

  if (clientState) {
    delete window.clientStates[key];

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
  const { reducers, middleware, enhancer, replication } = providerInstance;
  const watchedReducers = {};
  const watching = {};
  let enhancers = [];
  let create;
  let store;
  let state;
  let setState;

  function unshiftReplication({ key, reducerKeys, queryable, replicator }) {
    enhancers.unshift(
      replicate({
        key: key || providerInstance.key,
        reducerKeys,
        queryable,
        replicator,
        clientState: getClientState(providerInstance)
      })
    );
  }

  if (middleware) {
    enhancers.push(applyMiddleware.apply(null, [].concat(middleware)));
  }

  if (enhancer) {
    enhancers = enhancers.concat(enhancer);
  }

  if (replication) {
    if (Array.isArray(replication)) {
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
      const nextState = reducers[reducerKey](state, action);

      if (watching[reducerKey] && state !== nextState) {
        watching[reducerKey].forEach(fn => fn(nextState));
      }

      return nextState;
    };
  });

  store = create(
    combineReducers(watchedReducers),
    getInitialState(providerInstance)
  );

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
  if (setState) {
    store.setState = nextState => {
      const state = store.getState();

      for (let reducerKey in nextState) {
        let current = state[reducerKey];
        let next = nextState[reducerKey];

        if (watching[reducerKey] && current !== next) {
          watching[reducerKey].forEach(fn => fn(next));
        }
      }

      setState(nextState);
    };
  }

  return store;
}
