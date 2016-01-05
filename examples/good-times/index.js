import 'babel-core/polyfill';
import React from 'react';
import { render } from 'react-dom';
import GoodTimes from './components/GoodTimes';
import providers from './providers/index';

const context = {
  providers,
  providedState: {
    list: [
      { time: Date.now() }
    ]
  }
};

render(<GoodTimes { ...context } />, document.getElementById('root'));
