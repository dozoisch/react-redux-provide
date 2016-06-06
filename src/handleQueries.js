import instantiateProvider from './instantiateProvider';
import getRelevantKeys from './getRelevantKeys';

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

export function getFunctionOrObject(fauxInstance, key) {
  if (typeof fauxInstance[key] !== undefined) {
    return fauxInstance[key];
  }

  let value = fauxInstance.props[key];

  if (typeof value === 'function') {
    value = value(fauxInstance);
  }

  fauxInstance[key] = value || null;

  return fauxInstance[key];
}

export function getQueries(fauxInstance) {
  const { props, context, relevantProviders } = fauxInstance;
  const { providers } = context;
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

  return queries;
}

export function getQuery(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'query');
}

export function getQueryOptions(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'queryOptions');
}

export function getQueriesOptions(fauxInstance) {
  return getFunctionOrObject(fauxInstance, 'queriesOptions');
}

// finds the first `handleQuery` function within replicators
export function getQueryHandler(provider) {
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
            return {
              handleQuery,
              reducerKeys: reducerKeys || Object.keys(provider.reducers)
            };
          }
        }
      }
    }
  }

  return null;
}

export function getMergedResult(results) {
  let mergedResult = null;

  for (let providerKey in results) {
    let result = results[providerKey];

    if (Array.isArray(result)) {
      mergedResult = [ ...(mergedResult || []), ...result ];
    } else if (result && typeof result === 'object') {
      mergedResult = { ...(mergedResult || {}), ...result };
    } else if (typeof result !== 'undefined') {
      mergedResult = result;
    }
  }

  return mergedResult;
}

export default function handleQueries(fauxInstance) {
  const queries = getQueries(fauxInstance);

  if (!queries) {
    return false;
  }

  const { props, context } = fauxInstance;
  const query = getQuery(fauxInstance);
  const queryOptions = getQueryOptions(fauxInstance);
  const queriesOptions = getQueriesOptions(fauxInstance);
  const activeQueries = getActiveQueries(fauxInstance);
  const queryResults = getQueryResults(fauxInstance);
  const providers = getProviders(fauxInstance);
  const previousResults = props.results || {};

  let semaphore = Object.keys(queries).length;
  const clear = () => {
    if (--semaphore === 0) {
      if (query) {
        props.result = getMergedResult(props.results);
      }

      if (fauxInstance.doUpdate && fauxInstance.update) {
        // TODO: should mergers be checked (again) ??
        fauxInstance.update();
      }
    }
  };

  if (props.query) {
    props.result = null;
  }

  props.results = {};

  for (let key in queries) {
    let provider = providers[key];
    let query = queries[key];
    let options = queryOptions || queriesOptions[key] || {};
    let resultKey = JSON.stringify({ query, options });
    let queryResult = queryResults[resultKey];

    if (typeof queryResult !== 'undefined') {
      props.results[key] = queryResult;
      clear();
      continue;
    }

    if (provider.wait) {
      provider.wait();
    }

    let resultHandlers = activeQueries[resultKey];
    let resultHandler = result => {
      const previousResult = previousResults[key];

      if (!fauxInstance.doUpdate && !shallowEqual(result, previousResult)) {
        fauxInstance.doUpdate = true;
      }

      props.results[key] = result;
      queryResults[resultKey] = result;

      clear();

      if (provider.clear) {
        provider.clear(fauxInstance.doUpdate);
      }
    };

    if (resultHandlers) {
      resultHandlers.push(resultHandler);
    } else {
      let { handleQuery, reducerKeys } = getQueryHandler(provider);

      if (!options.select) {
        options.select = reducerKeys;
      }

      resultHandlers = [ resultHandler ];
      activeQueries[resultKey] = resultHandlers;

      handleQuery(query, options, result => {
        delete activeQueries[resultKey];

        while (resultHandlers.length) {
          resultHandlers.shift()(result);
        }
      });
    }
  }

  return true;
}
