import 'todomvc-app-css/index.css';
import 'react-redux-provide/lib/install';
import React from 'react';
import { render } from 'react-dom';
import { App } from './components/index';
import defaultProps from './defaultProps';

render(<App { ...defaultProps } />, document.getElementById('root'));
