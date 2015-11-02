import { createStore, applyMiddleware, combineReducers } from 'redux';

/**
 * Creates a store for some provider.
 *
 * @param {Object} provider
 * @param {Object} initialState Optional
 * @return {Object}
 * @api public
 */
export default function createProviderStore (provider, initialState) {
  const { reducers, middleware, enhancer } = provider;
  let create = createStore;
  let store;

  if (middleware) {
    create = applyMiddleware.apply(null, [].concat(middleware))(createStore);
  }

  if (initialState) {
    initialState = { ...initialState };

    for (let key in initialState) {
      if (reducers[key] === undefined) {
        delete initialState[key];
      }
    }
  }

  store = create(combineReducers(reducers), initialState);

  if (enhancer) {
    [].concat(enhancer).forEach(enhance => enhance(store));
  }

  return store;
}
