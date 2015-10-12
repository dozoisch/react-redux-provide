/**
 * Prefixes a provider's actions' and reducers' keys with some key.
 *
 * @param {String} key
 * @param {Object} provider
 * @api public
 */
export default function namespaceProvider (key, provider) {
  const prefix = key+'_';
  const { actions, reducers, merge } = provider;
  const namespaced = {
    actions: {},
    reducers: {}
  };

  for (let actionKey in actions) {
    namespaced.actions[prefix+actionKey] = actions[actionKey];
  }

  for (let reducerKey in reducers) {
    namespaced.reducers[prefix+reducerKey] = reducers[reducerKey];
  }

  if (merge) {
    namespaced.merge = function (stateProps, dispatchProps, parentProps) {
      const merged = merge.apply(this, arguments);
      const namespacedMerged = {};

      for (let mergedKey in merged) {
        let value = merged[mergedKey];

        if (parentProps[mergedKey] === undefined) {
          namespacedMerged[prefix+mergedKey] = value;
        } else {
          namespacedMerged[mergedKey] = value;
        }
      }
    };
  }

  return namespaced;
}
