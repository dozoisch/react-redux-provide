import './init';
import 'todomvc-app-css/index.css';
import React from 'react';
import { render } from 'react-dom';
import { App } from './components/index';
import defaultProps from './defaultProps';

render(<App { ...defaultProps } />, document.getElementById('root'));
