import assignProviders from '../src/assignProviders';
import provideList from 'react-redux-provide-list';
import Test from './components/Test';
import TestItem from './components/TestItem';

const list = provideList();

const initialState = {
  list: [
    {
      value: 'test'
    }
  ]
};

assignProviders(initialState, { list }, {
  Test,
  TestItem
});
