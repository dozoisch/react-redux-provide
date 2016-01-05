import React, { Component } from 'react';
import provide from 'react-redux-provide';
import Header from './Header';
import MainSection from './MainSection';

@provide
export default class App extends Component {
  render() {
    return (
      <div>
        <Header/>
        <MainSection/>
      </div>
    );
  }
}
