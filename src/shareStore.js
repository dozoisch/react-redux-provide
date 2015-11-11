import createProviderStore from './createProviderStore';

/**
 * Creates and returns a shared store based on the combination of each
 * provider and assigns it to them.
 *
 * @param {Object} providers
 * @param {Object} initialState Optional
 * @return {Object}
 * @api public
 */
export default function shareStore (providers, initialState) {
  const combinedProvider = {
    reducers: {},
    middleware: [],
    enhancer: []
  };

  for (let providerName in providers) {
    copyValues(combinedProvider, providers[providerName]);
  }

  const sharedStore = createProviderStore(combinedProvider);

  for (let providerName in providers) {
    providers[providerName].store = sharedStore;
  }

  return sharedStore;
}

function copyValues (combinedProvider, provider) {
  for (let key in combinedProvider) {
    let value = combinedProvider[key];
    let providerValue = provider[key];

    if (!providerValue) {
      continue;
    }

    if (Array.isArray(value)) {
      if (!Array.isArray(providerValue)) {
        providerValue = [ providerValue ];
      }

      for (let item of providerValue) {
        if (value.indexOf(item) < 0) {
          value.push(item);
        }
      }
    } else if (typeof providerValue === 'object') {
      Object.assign(value, providerValue);
    }
  }
}
