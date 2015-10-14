import 'babel-core/polyfill';
import 'todomvc-app-css/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { assignProviders } from 'react-redux-provide';
import * as list from './providers/list';
import * as selectable from './providers/selectable';
import App from './components/App';
import Header from './components/Header';
import MainSection from './components/MainSection';
import TodoItem from './components/TodoItem';
import Footer from './components/Footer';

const states = {
  todo: {
    list: [{
      value: 'Use redux providers',
      completed: false
    }]
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

assignProviders(states.filters, { selectable }, {
  MainSection,
  Footer
});

ReactDOM.render(<App/>, document.getElementById('root'));
