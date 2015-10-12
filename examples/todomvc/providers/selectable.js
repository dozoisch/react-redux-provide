export const name = 'selectable';

export const ADD = 'ADD';
export const REMOVE = 'REMOVE';
export const SELECT = 'SELECT';

export const actions = {
  add(key, value) {
    return { type: ADD, key, value };
  },
  
  remove(key) {
    return { type: REMOVE, key };
  },

  select(key) {
    return { type: SELECT, key };
  }
};

export const reducers = {
  map(state = {}, action) {
    const { key, value } = action;

    switch (action.type) {
      case ADD:
        return { ...state, [key]: value };

      case REMOVE:
        const nextState = { ...state };
        delete nextState[key];
        return nextState;

      default:
        return state;
    }
  },

  selectedKey(state = null, action) {
    switch (action.type) {
      case SELECT:
        return action.key;

      default:
        return state;
    }
  }
};

export function merge (stateProps, dispatchProps, parentProps) {
  return Object.assign({}, parentProps, {
    selected: stateProps.map[stateProps.selectedKey]
  });
}
