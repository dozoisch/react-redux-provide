import 'react-redux-provide/lib/install';
import React from 'react';
import { render } from 'react-dom';
import { reloadProviders } from 'react-redux-provide';
import { GoodTimes } from './components/index';
import defaultProps from './defaultProps';

function renderGoodTimes(props, element = document.getElementById('root')) {
  return render(<GoodTimes { ...props } />, element);
}

renderGoodTimes({ ...defaultProps });

export default renderGoodTimes;

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept('./defaultProps', () => {
      reloadProviders(require('./defaultProps').default.providers);
    });
  }
}
