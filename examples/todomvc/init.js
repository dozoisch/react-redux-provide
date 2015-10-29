import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import * as map from 'react-redux-provide-map';
import remap from 'react-redux-remap-provider';
import App from './components/App';
import Header from './components/Header';
import MainSection from './components/MainSection';
import TodoItem from './components/TodoItem';
import Footer from './components/Footer';

const states = {
  todo: {
    list: [
      {
        value: 'Use redux providers',
        completed: true
      }
    ]
  },

  filters: {
    map: {
      All: {
        filter: item => true,
        selected: true
      },
      Active: {
        filter: item => !item.completed
      },
      Completed: {
        filter: item => item.completed
      }
    }
  }
};

const filterMap = remap(map, {
  merge(stateProps, dispatchProps, parentProps) {
    const { map = {} } = stateProps;
    const item = map[parentProps.index] || null;
    let filter = item => true;

    // ideally we'd have a reducer for selected `filter`
    // but since this is just a simple example...
    for (let index in map) {
      if (map[index].selected) {
        filter = map[index].filter;
        break;
      }
    }

    return Object.assign({}, parentProps, { item, filter });
  }
});

assignProviders(states.todo, { list }, {
  Header,
  MainSection,
  TodoItem,
  Footer
});

assignProviders(states.filters, { filterMap }, {
  MainSection,
  Footer
});
