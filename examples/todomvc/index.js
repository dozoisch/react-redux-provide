import 'babel-core/polyfill';
import 'todomvc-app-css/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createProvidersStore, assignProviders } from 'react-redux-provide';
import * as list from './providers/list';
import * as selectable from './providers/selectable';
import App from './components/App';
import Header from './components/Header';
import MainSection from './components/MainSection';
import TodoItem from './components/TodoItem';
import Footer from './components/Footer';

const listProviders = { list };
const selectableProviders = { filters: selectable };
const providers = { ...listProviders, ...selectableProviders };

const initialState = {
  list: [{
    value: 'Use redux providers',
    completed: false
  }],

  filters: {
    map: {
      All: item => true,
      Active: item => !item.completed,
      Completed: item => item.completed
    },
    selectedKey: 'All'
  }
};

const store = createProvidersStore(providers, initialState);

assignProviders(listProviders, {
  Header,
  MainSection,
  TodoItem,
  Footer
});

assignProviders(selectableProviders, {
  MainSection,
  Footer
});

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root')
);
