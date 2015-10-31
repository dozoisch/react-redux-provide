import assignProviders from '../src/assignProviders';
import * as list from 'react-redux-provide-list';
import Test from './components/Test';
import TestItem from './components/TestItem';

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
