import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';

@provide({
  createItem: PropTypes.func.isRequired
})
export default class Header extends Component {
  createItem() {
    const { input } = this.refs;
    const value = input.value.trim();

    if (value) {
      this.props.createItem({ value });
      input.value = '';
    }
  }

  createItemOnEnter(event) {
    if (event.key === 'Enter') {
      this.createItem();
    }
  }

  render() {
    return (
      <header className="header">
        <h1>todos</h1>

        <input
          ref="input"
          className="new-todo"
          type="text"
          placeholder="What needs to be done?"
          autoFocus={true}
          onBlur={::this.createItem}
          onKeyDown={::this.createItemOnEnter}
        />
      </header>
    );
  }
}
