export default function createKeyConcat (key) {
  return function (providers, value) {
    for (let providerName in providers) {
      let provider = providers[providerName];

      if (!provider[key]) {
        provider[key] = [];
      } else if (!Array.isArray(provider[key])) {
        provider[key] = [ provider[key] ];
      }

      provider[key] = provider[key].concat(value);
    }
  }
}
