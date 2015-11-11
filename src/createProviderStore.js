import { createStore, applyMiddleware, combineReducers, compose } from 'redux';

/**
 * Creates and returns a store specifically for some provider.
 *
 * @param {Object} provider
 * @param {Object} initialState Optional
 * @return {Object}
 * @api public
 */
export default function createProviderStore (provider, initialState) {
  const { reducers, middleware, enhancer } = provider;
  let enhancers = [];
  let create;

  if (middleware) {
    enhancers.push(applyMiddleware.apply(null, [].concat(middleware)));
  }

  if (enhancer) {
    enhancers = enhancers.concat(enhancer);
  }

  if (initialState) {
    initialState = { ...initialState };

    for (let key in initialState) {
      if (reducers[key] === undefined) {
        delete initialState[key];
      }
    }
  }

  if (enhancers.length) {
    create = compose(...enhancers)(createStore);
  } else {
    create = createStore;
  }

  return create(combineReducers(reducers), initialState);
}
