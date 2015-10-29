import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import * as map from 'react-redux-provide-map';
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
      All: item => true,
      Active: item => !item.completed,
      Completed: item => item.completed
    },
    selectedKey: 'All'
  }
};

assignProviders(states.todo, { list }, {
  Header,
  MainSection,
  TodoItem,
  Footer
});

assignProviders(states.filters, { map }, {
  MainSection,
  Footer
});
