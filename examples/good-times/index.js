import 'babel-core/polyfill';
import './init';
import React from 'react';
import { render } from 'react-dom';
import GoodTimes from './components/GoodTimes';

render(<GoodTimes/>, document.getElementById('root'));
