import assignProviders from '../src/assignProviders';
import * as list from 'react-redux-provide-list';
import Test from './components/Test';
import TestItem from './components/TestItem';

const states = {
  values: {
    list: [
      {
        value: 'test'
      }
    ]
  }
};

assignProviders(states.values, { list }, {
  Test,
  TestItem
});
