import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import GoodTimes from './components/GoodTimes';

const initialState = {
  list: [
    {
      time: Date.now()
    }
  ]
};

assignProviders(initialState, { list }, {
  GoodTimes
});
