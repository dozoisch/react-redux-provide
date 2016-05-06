export default function createKeyConcat(key, unshift, subKey) {
  return function (providers, value) {
    for (let providerKey in providers) {
      let provider = providers[providerKey];
      let target = subKey ? provider[subKey] : provider;

      if (target) {
        if (!target[key]) {
          target[key] = [];
        } else if (!Array.isArray(target[key])) {
          target[key] = [ target[key] ];
        }
  
        if (unshift) {
          target[key] = [].concat(value).concat(target[key]);
        } else {
          target[key] = target[key].concat(value);
        }
      }
    }
  }
}
