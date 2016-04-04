import localforage from 'redux-replicate-localforage';
import { list } from './providers/index';

export default {
  providers: {
    list: {
      ...list,

      state: {
        list: [
          { time: Date.now() }
        ]
      },

      replication: {
        reducerKeys: ['list', 'roll'],
        replicator: localforage
      }
    }
  }
};
