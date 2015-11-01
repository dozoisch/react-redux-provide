import { assignProviders } from 'react-redux-provide';
import provideList from 'react-redux-provide-list';
import provideMap from 'react-redux-provide-map';
import App from './components/App';
import Header from './components/Header';
import MainSection from './components/MainSection';
import TodoItem from './components/TodoItem';
import Footer from './components/Footer';

const initialState = {
  todoList: [
    {
      value: 'Use redux providers',
      completed: true
    }
  ],

  filterMap: new Map([
    ['All', {
      filter: todoItem => true,
      selected: true
    }],
    ['Active', {
      filter: todoItem => !todoItem.completed
    }],
    ['Completed', {
      filter: todoItem => todoItem.completed
    }]
  ])
};

const todoList = provideList('todoList', 'todoItem');
const filterMap = provideMap('filterMap', 'filterItem', 'filterName');

assignProviders(initialState, { todoList }, {
  Header,
  MainSection,
  TodoItem,
  Footer
});

assignProviders(initialState, { filterMap }, {
  MainSection,
  Footer
});
