import provideArray from 'provide-array';

export const SET_ROLL = 'SET_ROLL';

const list = provideArray();

list.actions.setRoll = roll => (
  { type: SET_ROLL, roll }
);

list.reducers.roll = (state = null, action) => {
  switch (action.type) {
    case SET_ROLL:
      return action.roll;

    default:
      return state;
  }
};

export default list;
