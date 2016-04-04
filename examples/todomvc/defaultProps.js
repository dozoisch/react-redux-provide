import 'babel-polyfill';
import localforage from 'redux-replicate-localforage';
import { todoList, filterMap } from './providers/index';

const hasLocalStorage = typeof localStorage !== 'undefined'; // so tests pass

export default {
  providers: {
    todoList: {
      ...todoList,

      state: {
        todoList: [
          {
            value: 'Use redux providers',
            completed: true
          }
        ]
      },

      replication: hasLocalStorage ? {
        reducerKeys: ['todoList'],
        replicator: localforage
      } : null
    },

    filterMap: {
      ...filterMap,

      state: {
        filterMap: new Map([
          ['All', todoItem => true],
          ['Active', todoItem => !todoItem.completed],
          ['Completed', todoItem => todoItem.completed]
        ]),

        selectedFilterName: 'All'
      },

      replication: hasLocalStorage ? {
        reducerKeys: ['selectedFilterName'],
        replicator: localforage
      } : null
    }
  }
};
