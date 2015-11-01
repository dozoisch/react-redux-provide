import { assignProviders } from 'react-redux-provide';
import provideList from 'react-redux-provide-list';
import GoodTimes from './components/GoodTimes';

const list = provideList();

const initialState = {
  list: [
    { time: Date.now() }
  ]
};

assignProviders(initialState, { list }, {
  GoodTimes
});
