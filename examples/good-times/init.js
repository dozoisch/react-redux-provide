import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import GoodTimes from './components/GoodTimes';

const states = {
  times: {
    list: [
      {
        time: Date.now()
      }
    ]
  }
};

assignProviders(states.times, { list }, {
  GoodTimes
});
