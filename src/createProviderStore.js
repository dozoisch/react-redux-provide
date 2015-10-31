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
  const { reducers, middleware } = provider;
  let create = createStore;

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

  return create(combineReducers(reducers), initialState);
}
