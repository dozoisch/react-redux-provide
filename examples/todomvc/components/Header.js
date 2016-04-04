import React, { Component, PropTypes } from 'react';

export default class Header extends Component {
  static propTypes = {
    pushTodoItem: PropTypes.func.isRequired
  };

  pushTodoItem = () => {
    const { input } = this.refs;
    const value = input.value.trim();

    if (value) {
      this.props.pushTodoItem({ value });
      input.value = '';
    }
  };

  pushTodoItemOnEnter = (event) => {
    if (event.key === 'Enter') {
      this.pushTodoItem();
    }
  };

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
          onBlur={this.pushTodoItem}
          onKeyDown={this.pushTodoItemOnEnter}
        />
      </header>
    );
  }
}
