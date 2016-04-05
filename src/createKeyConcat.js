export default function createKeyConcat(key, unshift) {
  return function (providers, value) {
    for (let providerKey in providers) {
      let provider = providers[providerKey];

      if (!provider[key]) {
        provider[key] = [];
      } else if (!Array.isArray(provider[key])) {
        provider[key] = [ provider[key] ];
      }

      if (unshift) {
        provider[key] = [].concat(value).concat(provider[key]);
      } else {
        provider[key] = provider[key].concat(value);
      }
    }
  }
}
