import provide, { reloadProviders } from './provide';
import instantiateProvider from './instantiateProvider';
import createProviderStore from './createProviderStore';
import createKeyConcat from './createKeyConcat';
import shallowEqual from './shallowEqual';

const pushMiddleware = createKeyConcat('middleware');
const unshiftMiddleware = createKeyConcat('middleware', true);

const pushEnhancer = createKeyConcat('enhancer');
const unshiftEnhancer = createKeyConcat('enhancer', true);

const pushOnInstantiated = createKeyConcat('onInstantiated');
const unshiftOnInstantiated = createKeyConcat('onInstantiated', true);

const pushOnReady = createKeyConcat('onReady');
const unshiftOnReady = createKeyConcat('onReady', true);

const pushReplication = createKeyConcat('replication');
const unshiftReplication = createKeyConcat('replication', true);
const pushReplicator = createKeyConcat(['replication', 'replicator']);
const unshiftReplicator = createKeyConcat(['replication', 'replicator'], true);

export default provide;
export {
  provide,
  reloadProviders,
  instantiateProvider,
  createProviderStore,
  createKeyConcat,
  shallowEqual,

  pushMiddleware,
  unshiftMiddleware,

  pushEnhancer,
  unshiftEnhancer,

  pushOnInstantiated,
  unshiftOnInstantiated,

  pushOnReady,
  unshiftOnReady,

  pushReplication,
  unshiftReplication,
  pushReplicator,
  unshiftReplicator
};
