export const name = 'list';

export const SET_LIST = 'SET_LIST';
export const MAP_LIST = 'MAP_LIST';
export const FILTER_LIST = 'FILTER_LIST';
export const CREATE_ITEM = 'CREATE_ITEM';
export const UPDATE_ITEM = 'UPDATE_ITEM';
export const DELETE_ITEM = 'DELETE_ITEM';

export const actions = {
  setList(list) {
    return { type: SET_LIST, list };
  },

  mapList(map) {
    return { type: MAP_LIST, map };
  },

  filterList(filter) {
    return { type: FILTER_LIST, filter };
  },

  createItem(item) {
    return { type: CREATE_ITEM, item };
  },

  updateItem(index, item) {
    return { type: UPDATE_ITEM, index, item };
  },

  deleteItem(index) {
    return { type: DELETE_ITEM, index };
  }
};

export const reducers = {
  item(state = {}, action) {
    switch(action.type) {
      case CREATE_ITEM:
      case UPDATE_ITEM:
        return { ...state, ...action.item };

      default:
        return state;
    }
  },

  list(state = [], action) {
    const { item, index } = action;

    switch (action.type) {
      case SET_LIST:
        return action.list;

      case MAP_LIST:
        return state.map(action.map);

      case FILTER_LIST:
        return state.filter(action.filter);

      case CREATE_ITEM:
        return [
          reducers.item(undefined, action),
          ...state
        ];

      case UPDATE_ITEM:
        return [
          ...state.slice(0, index),
          reducers.item(state[index], action),
          ...state.slice(index + 1)
        ];

      case DELETE_ITEM:
        return [
          ...state.slice(0, index),
          ...state.slice(index + 1)
        ];

      default:
        return state;
    }
  }
};

export function merge (stateProps, dispatchProps, parentProps) {
  return Object.assign({}, parentProps, {
    item: stateProps.list[parentProps.index]
  });
}
