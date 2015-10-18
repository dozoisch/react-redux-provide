import 'babel-core/polyfill';
import 'todomvc-app-css/index.css';
import './init';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

render(<App/>, document.getElementById('root'));
