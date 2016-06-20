import shallowEqual from './shallowEqual';
import getRelevantKeys from './getRelevantKeys';
import createProviderStore from './createProviderStore';
import { pushOnReady, unshiftOnReady, unshiftMiddleware } from './keyConcats';

const globalProviderInstances = {};

/**
 * Instantiates a provider with its own store.
 *
 * @param {Object} fauxInstance resembles { props, context }
 * @param {Object} provider
 * @param {String|Function} providerKey Optional
 * @param {Function} readyCallback Optional
 * @param {Boolean} createReplication Optional
 * @return {Object}
 * @api public
 */
export default function instantiateProvider(
  fauxInstance,
  provider,
  providerKey,
  readyCallback,
  createReplication
) {
  if (typeof providerKey === 'undefined') {
    providerKey = provider.key;
  }

  const providers = getProviders(fauxInstance);
  const providerInstances = getProviderInstances(fauxInstance);
  let providerInstance;
  let isStatic = typeof providerKey !== 'function';
  let storeKey;

  if (!isStatic) {
    // get actual `providerKey`
    providerKey = providerKey(fauxInstance);
    // if actual `providerKey` matches `key`, treat as static provider
    isStatic = providerKey === provider.key;
  }

  if (providerKey === null) {
    storeKey = null;
    providerKey = provider.defaultKey;
    isStatic = true;
  }

  providerInstance = provider.isGlobal
    ? globalProviderInstances[providerKey]
    : providerInstances && providerInstances[providerKey];

  if (fauxInstance.relevantProviders) {
    fauxInstance.relevantProviders[providerKey] = true;
  }

  if (providerInstance) {
    if (readyCallback) {
      if (providerInstance.ready) {
        readyCallback(providerInstance);
      } else {
        pushOnReady({ providerInstance }, readyCallback);
      }
    }

    providerInstances[providerKey] = providerInstance;
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

    function findProvider(props) {
      if (getRelevantKeys(provider.reducers, props).length) {
        return provider;
      }

      for (let key in providers) {
        if (getRelevantKeys(providers[key].reducers, props).length) {
          return providers[key];
        }
      }

      return provider;
    }

    function getResultInstances(result, callback) {
      const resultInstances = [];
      let semaphore = result && result.length;
      function clear() {
        if (--semaphore === 0) {
          callback(resultInstances);
        }
      }

      if (!semaphore) {
        semaphore = 1;
        clear();
        return;
      }

      result.forEach((resultProps, index) => {
        resultInstances[index] = null;

        instantiateProvider(
          getNewFauxInstance(fauxInstance, resultProps),
          findProvider(resultProps),
          undefined,
          resultInstance => {
            resultInstances[index] = resultInstance;
            clear();
          }
        );
      });
    }

    function getInstance(props, callback, createReplication) {
      return instantiateProvider(
        getNewFauxInstance(fauxInstance, props),
        findProvider(props),
        undefined,
        callback,
        createReplication
      );
    }

    function createInstance(props, callback) {
      return getInstance(props, callback, true);
    }

    function setStates(states) {
      const gettingInstances = [];
      const settingStates = [];
      let clientStates = null;

      if (typeof window !== 'undefined') {
        if (!window.clientStates) {
          window.clientStates = {};
        }

        clientStates = window.clientStates;
      }

      for (let providerKey in states) {
        const state = states[providerKey];
        const providerInstance = providerInstances[providerKey];

        if (providerInstance) {
          if (providerInstance.store.setState) {
            settingStates.push(() => providerInstance.store.setState(state));
          }
        } else {
          if (clientStates) {
            clientStates[providerKey] = state;
          }

          gettingInstances.push(state);
        }
      }

      // now that `clientStates` are cached...
      while (gettingInstances.length) {
        getInstance(gettingInstances.shift());
      }
      while (settingStates.length) {
        settingStates.shift()();
      }
    }

    function find(props, doInstantiate, callback) {
      if (arguments.length === 2) {
        callback = doInstantiate;
        doInstantiate = false;
      }

      handleQueries(getNewFauxInstance(fauxInstance, props), () => {
        if (!doInstantiate) {
          callback(props.query ? props.result : props.results);
          return;
        }

        if (props.query) {
          getResultInstances(props.result, callback);
          return;
        }

        const { results } = props;
        const resultsInstances = {};
        const resultsKeys = results && Object.keys(results);
        let semaphore = resultsKeys && resultsKeys.length;
        function clear() {
          if (--semaphore === 0) {
            callback(resultsInstances);
          }
        }

        if (!semaphore) {
          semaphore = 1;
          clear();
        }

        resultsKeys.forEach(resultKey => {
          resultsInstances[resultKey] = [];

          getResultInstances(
            results[resultKey],
            resultInstances => {
              resultsInstances[resultKey] = resultInstances;
              clear();
            }
          );
        });
      });
    }

    const providerApi = {
      getInstance, createInstance, setStates, find
    };

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
        }, getState, providerApi);
      };
    });
  }

  if (provider.wait) {
    provider.wait.forEach(fn => fn());
  }

  providerInstance = Object.create(provider);
  providerInstance.providerKey = providerKey;
  providerInstance.isStatic = isStatic;

  const store = createProviderStore(
    providerInstance, storeKey, createReplication
  );
  const initialState = store.getState();
  const { actions } = providerInstance;
  const actionCreators = {};
  const setKey = store.setKey;

  if (setKey) {
    store.setKey = (newKey, readyCallback) => {
      if (provider.wait) {
        provider.wait.forEach(fn => fn());
      }

      setKey(newKey, () => {
        if (Array.isArray(providerInstance.onReady)) {
          providerInstance.onReady.forEach(fn => fn(providerInstance));
        } else if (providerInstance.onReady) {
          providerInstance.onReady(providerInstance);
        }

        if (readyCallback) {
          readyCallback();
        }

        if (provider.clear) {
          provider.clear.forEach(fn => fn(true));
        }
      });
    };
  }

  for (let actionKey in actions) {
    actionCreators[actionKey] = function() {
      return store.dispatch(actions[actionKey].apply(this, arguments));
    };
  }

  providerInstance.store = store;
  providerInstance.actionCreators = actionCreators;

  if (provider.isGlobal) {
    globalProviderInstances[providerKey] = providerInstance;
  }
  if (providerInstances) {
    providerInstances[providerKey] = providerInstance;
  }
  if (!provider.instances) {
    provider.instances = [];
  }
  provider.instances.push(providerInstance);

  if (provider.subscribers) {
    Object.keys(provider.subscribers).forEach(key => {
      const handler = provider.subscribers[key];
      const subProvider = providers[key];
      function callHandler() {
        const subProviderInstances = subProvider && subProvider.instances;

        if (subProviderInstances) {
          subProviderInstances.forEach(subProviderInstance => {
            handler(providerInstance, subProviderInstance);
          });
        }
      }

      if (subProvider) {
        if (!subProvider.subscribeTo) {
          subProvider.subscribeTo = {};
        }
        if (!subProvider.subscribeTo[provider.key]) {
          subProvider.subscribeTo[provider.key] = handler;
        }
      }

      providerInstance.store.subscribe(callHandler);
      callHandler();
    });
  }

  if (provider.subscribeTo) {
    Object.keys(provider.subscribeTo).forEach(key => {
      const handler = provider.subscribeTo[key];
      const supProvider = providers[key];

      if (!supProvider) {
        return;
      }

      if (!supProvider.subscribers) {
        supProvider.subscribers = {};
      }
      if (!supProvider.subscribers[provider.key]) {
        supProvider.subscribers[provider.key] = handler;

        if (supProvider.instances) {
          supProvider.instances.forEach(supProviderInstance => {
            supProviderInstance.store.subscribe(() => {
              provider.instances.forEach(providerInstance => {
                handler(supProviderInstance, providerInstance);
              });
            });
          });
        }
      }

      if (supProvider.instances) {
        supProvider.instances.forEach(supProviderInstance => {
          handler(supProviderInstance, providerInstance);
        });
      }
    });
  }

  if (Array.isArray(providerInstance.onInstantiated)) {
    providerInstance.onInstantiated.forEach(fn => fn(providerInstance));
  } else if (providerInstance.onInstantiated) {
    providerInstance.onInstantiated(providerInstance);
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
    } else if (providerInstance.onReady) {
      providerInstance.onReady(providerInstance);
    }

    if (provider.clear) {
      const storeChanged = initialState !== providerInstance.store.getState();
      provider.clear.forEach(fn => fn(storeChanged));
    }
  }

  if (provider.replication && store.onReady && !store.initializedReplication) {
    store.onReady(done);
  } else {
    done();
  }

  return providerInstance;
}

export function getNewFauxInstance(fauxInstance, state) {
  return {
    props: state,
    context: fauxInstance.context,
    providers: getProviders(fauxInstance),
    providerInstances: getProviderInstances(fauxInstance),
    activeQueries: getActiveQueries(fauxInstance),
    queryResults: getQueryResults(fauxInstance)
  };
}

export function getFromContextOrProps(fauxInstance, key, defaultValue) {
  if (typeof fauxInstance[key] === 'undefined') {
    const { props, context } = fauxInstance;

    if (typeof props[key] !== 'undefined') {
      fauxInstance[key] = props[key];
    } else if (typeof context[key] !== 'undefined') {
      fauxInstance[key] = context[key];
    } else {
      fauxInstance[key] = defaultValue;
    }
  }

  return fauxInstance[key];
}

export function getProviders(fauxInstance) {
  return getFromContextOrProps(fauxInstance, 'providers', {});
}

export function getProviderInstances(fauxInstance) {
  return getFromContextOrProps(fauxInstance, 'providerInstances', {});
}

export function getActiveQueries(fauxInstance) {
  return getFromContextOrProps(fauxInstance, 'activeQueries', {});
}

export function getQueryResults(fauxInstance) {
  return getFromContextOrProps(fauxInstance, 'queryResults', {});
}

export function getFunctionOrObject(fauxInstance, key, defaultValue = null) {
  if (typeof fauxInstance[key] !== 'undefined') {
    return fauxInstance[key];
  }

  let value = fauxInstance.props[key];

  if (typeof value === 'function') {
    value = value(fauxInstance);
  }

  fauxInstance[key] = value || defaultValue;

  return fauxInstance[key];
}

export function getQueries(fauxInstance) {
  if (typeof fauxInstance.queries !== 'undefined') {
    return fauxInstance.queries;
  }

  const { props, relevantProviders } = fauxInstance;
  const providers = getProviders(fauxInstance);
  const query = getQuery(fauxInstance);
  let queries = getFunctionOrObject(fauxInstance, 'queries');
  let hasQueries = false;

  if (query) {
    // we need to map the query to relevant provider(s)
    if (!queries) {
      queries = {};
    } else if (typeof props.queries !== 'function') {
      queries = { ...queries };
    }

    for (let key in providers) {
      let provider = providers[key];
      let queryKeys = getRelevantKeys(provider.reducers, query);

      if (queryKeys.length) {
        // provider is relevant, so we map it within the queries object
        if (!queries[key]) {
          queries[key] = {};
        }

        for (let queryKey of queryKeys) {
          queries[key][queryKey] = query[queryKey];
        }
      }
    }
  }

  for (let key in queries) {
    let query = queries[key];

    if (typeof query === 'function') {
      queries[key] = query(fauxInstance);
    }

    // make sure each provider is instantiated
    instantiateProvider(fauxInstance, providers[key]);
    hasQueries = true;
  }

  if (!hasQueries) {
    queries = null;

    if (props.query) {
      props.result = null;
    }

    if (props.queries) {
      props.results = {};
    }
  }

  fauxInstance.queries = queries;
  return queries;
}

export function getQuery(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'query');
}

export function getQueryOptions(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'queryOptions');
}

export function getQueriesOptions(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'queriesOptions', {});
}

// gets all `handleQuery` functions within replicators
export function getQueryHandlers(provider) {
  const queryHandlers = [];
  let { replication } = provider;

  if (replication) {
    if (!Array.isArray(replication)) {
      replication = [ replication ];
    }

    for (let { replicator, reducerKeys } of replication) {
      if (replicator) {
        if (!Array.isArray(replicator)) {
          replicator = [ replicator ];
        }

        for (let { handleQuery } of replicator) {
          if (handleQuery) {
            queryHandlers.push({
              handleQuery,
              reducerKeys: reducerKeys || Object.keys(provider.reducers)
            });
          }
        }
      }
    }
  }

  return queryHandlers;
}

export function getMergedResult(mergedResult, result) {
  if (Array.isArray(result)) {
    return [ ...(mergedResult || []), ...result ];
  } else if (result && typeof result === 'object') {
    return { ...(mergedResult || {}), ...result };
  } else if (typeof result !== 'undefined') {
    return result;
  } else {
    return mergedResult;
  }
}

export function resultsEqual(result, previousResult) {
  if (result === previousResult) {
    return true;
  }

  if (typeof result === typeof previousResult) {
    return false;
  }

  if (Array.isArray(result)) {
    if (Array.isArray(previousResult)) {
      let i = 0;
      const length = result.length;

      if (length !== previousResult.length) {
        return false;
      }

      while (i < length) {
        if (!shallowEqual(result[i], previousResult[i])) {
          return false;
        }

        i++;
      }
    } else {
      return false;
    }
  } else if (Array.isArray(previousResult)) {
    return false;
  }

  return shallowEqual(result, previousResult);
}

// this is admittedly a mess... :(
// trying to account for both synchronous and asynchronous query handling
// where asynchronous results will override the synchronous results
export function handleQueries(fauxInstance, callback) {
  const queries = getQueries(fauxInstance);

  if (!queries) {
    if (callback) {
      callback();
    }

    return false;
  }

  const { props } = fauxInstance;
  const query = getQuery(fauxInstance);
  const queryOptions = getQueryOptions(fauxInstance);
  const queriesOptions = getQueriesOptions(fauxInstance);
  const activeQueries = getActiveQueries(fauxInstance);
  const queryResults = getQueryResults(fauxInstance);
  const providers = getProviders(fauxInstance);
  const previousResults = { ...props.results };
  let asyncLeader = false;
  let asyncReset = false;

  let semaphore = Object.keys(queries).length;
  const clear = () => {
    if (--semaphore === 0 && callback) {
      callback();
    }
  };
  const setMergedResult = result => {
    if (props.query) {
      props.result = getMergedResult(props.result, result);
    }
  };

  const { autoUpdateQueryResults = true } = props;
  const { subscriptions, subbedAll } = fauxInstance;
  const subscribeToAll = autoUpdateQueryResults && subscriptions && !subbedAll;

  fauxInstance.subbedAll = true;

  if (props.query) {
    props.result = null;
  }

  props.results = {};

  Object.keys(queries).forEach(key => {
    const provider = providers[key];
    const query = queries[key];
    const options = queryOptions || queriesOptions[key] || {};
    const resultKey = JSON.stringify({ query, options });
    const queryResult = queryResults[resultKey];

    if (subscribeToAll) {
      // pretty hacky but whatever
      const requery = () => {
        if (!activeQueries[resultKey]) {
          delete queryResults[resultKey];
          handleQueries(fauxInstance, callback);
        }
      };

      if (provider.instances) {
        provider.instances.forEach(providerInstance => {
          subscriptions.push(
            providerInstance.store.subscribe(requery)
          );
        });
      }

      if (!provider.subscribers) {
        provider.subscribers = {};
      }

      const handler = provider.subscribers[key];
      provider.subscribers[key] = (providerInstance, subProviderInstance) => {
        if (handler) {
          handler(providerInstance, subProviderInstance);
        }

        requery();
      };
    }

    if (typeof queryResult !== 'undefined') {
      props.results[key] = queryResult;
      setMergedResult(queryResult);
      clear();
      return;
    }

    getQueryHandlers(provider).forEach(({ handleQuery, reducerKeys }) => {
      const setResult = result => {
        if (asyncReset) {
          props.results = {};

          if (props.query) {
            props.result = null;
          }

          asyncReset = false;
        }

        props.results[key] = result;
        previousResults[key] = result;
        queryResults[resultKey] = result;
        setMergedResult(result);

        if (Array.isArray(provider.clear)) {
          provider.clear.forEach(fn => fn(fauxInstance.doUpdate));
        } else if (provider.clear) {
          provider.clear(fauxInstance.doUpdate);
        }

        clear();
      };

      const resultHandler = result => {
        const previousResult = previousResults[key];

        if (!fauxInstance.doUpdate && !resultsEqual(result, previousResult)) {
          fauxInstance.doUpdate = true;
        }

        if (asyncQueryHandler) {
          if (asyncLeader) {
            while (activeQueries[resultKey].length) {
              activeQueries[resultKey].shift()(result);
            }

            delete activeQueries[resultKey];
          }
        } else {
          setResult(result);
        }
      };

      if (Array.isArray(provider.wait)) {
        provider.wait.forEach(fn => fn());
      } else if (provider.wait) {
        provider.wait();
      }

      const normalizedOptions = { ...options };
      if (typeof normalizedOptions.select === 'undefined') {
        normalizedOptions.select = reducerKeys;
      } else if (!Array.isArray(normalizedOptions.select)) {
        normalizedOptions.select = [ normalizedOptions.select ];
      }

      let asyncQueryHandler = false;
      const semaphoreBefore = semaphore;
      semaphore++;
      handleQuery(query, normalizedOptions, resultHandler);
      asyncQueryHandler = semaphore > semaphoreBefore;

      if (asyncQueryHandler) {
        asyncReset = true;

        if (activeQueries[resultKey]) {
          activeQueries[resultKey].push(setResult);
        } else {
          asyncLeader = true;
          activeQueries[resultKey] = [ setResult ];
        }
      }
    });

    clear();
  });

  return true;
}
