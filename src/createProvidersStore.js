import { createStore, applyMiddleware, combineReducers } from 'redux';

/**
 * Creates a store from a set of providers.
 *
 * @param {Object} providers
 * @param {Object} initialState Optional
 * @return {Object}
 * @api public
 */
export default function createProvidersStore (providers, initialState) {
  const reducers = {};
  const middleware = [];
  let create = createStore;

  for (let key in providers) {
    let provider = providers[key];

    Object.assign(reducers, provider.reducers);

    if (provider.middleware) {
      if (Array.isArray(provider.middleware)) {
        for (let mid of provider.middleware) {
          if (middleware.indexOf(mid) < 0) {
            middleware.push(mid);
          }
        }
      } else if (middleware.indexOf(provider.middleware) < 0) {
        middleware.push(provider.middleware);
      }
    }
  }

  if (middleware.length) {
    create = applyMiddleware.apply(null, middleware)(createStore);
  }

  return create(combineReducers(reducers), initialState);
}
