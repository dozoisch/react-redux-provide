import { UPDATE_ITEM } from './list';

export const NOOP = 'NOOP';

export default {
  actions: {
    noop: () => (
      { type: NOOP }
    )
  },

  reducers: {
    updatedIndex(state = -1, action) {
      switch (action.type) {
        case UPDATE_ITEM:
          return action.index;

        default:
          return -1;
      }
    },

    noopCount(state = 0, action) {
      switch (action.type) {
        case NOOP:
          return state + 1;

        default:
          return state;
      }
    }
  }
};
