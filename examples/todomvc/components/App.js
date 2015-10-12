import React, { Component } from 'react';
import Header from './Header';
import MainSection from './MainSection';

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
