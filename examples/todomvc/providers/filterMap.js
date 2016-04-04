import provideMap from 'provide-map';

const filterMap = provideMap('filterMap', 'filterItem', 'filterName');

export const SELECT_FILTER = 'SELECT_FILTER';

filterMap.actions.selectFilter = filterName => (
  { type: SELECT_FILTER, filterName }
);

filterMap.reducers.selectedFilterName = (state = '', action) => {
  switch (action.type) {
    case SELECT_FILTER:
      return action.filterName;

    default:
      return state;
  }
};

filterMap.merge = {
  filterMapSize: {
    keys: ['filterMap'],
    get({ filterMap }) {
      return filterMap.size;
    }
  },

  hasFilterItem: {
    keys: ['filterMap'],
    get({ filterMap }, { filterName }) {
      return filterMap.has(filterName);
    }
  },

  filterItem: {
    keys: ['filterMap'],
    get({ filterMap }, { filterName }) {
      return filterMap.get(filterName) || null;
    }
  },

  selectedFilter: {
    keys: ['selectedFilterName'],
    get({ filterMap, selectedFilterName }) {
      return filterMap.get(selectedFilterName) || () => true;
    }
  }
};

export default filterMap;
