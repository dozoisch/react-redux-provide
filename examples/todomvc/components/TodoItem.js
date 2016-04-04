import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

export default class TodoItem extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    todoItem: PropTypes.object.isRequired,
    updateTodoItem: PropTypes.func.isRequired,
    deleteTodoItem: PropTypes.func.isRequired
  };

  edit = () => {
    const { index } = this.props;

    this.props.updateTodoItem(index, { editing: true });
  };

  save = () => {
    const { index } = this.props;
    const value = this.refs.input.value;

    if (value.length) {
      this.props.updateTodoItem(index, { value, editing: false });
    } else {
      this.props.deleteTodoItem(index);
    }
  };

  saveOnEnter = (event) => {
    if (event.key === 'Enter') {
      this.save();
    }
  };

  toggle = () => {
    const { index } = this.props;
    const completed = this.refs.checkbox.checked;

    this.props.updateTodoItem(index, { completed });
  };

  destroy = () => {
    const { index } = this.props;

    this.props.deleteTodoItem(index);
  };

  render() {
    const { todoItem } = this.props;
    const { value, completed, editing } = todoItem;
    const className = classnames({ completed, editing });

    if (editing) {
      return (
        <li className={className}>
          <input
            ref="input"
            className="edit"
            type="text"
            defaultValue={value}
            autoFocus={true}
            onBlur={this.save}
            onKeyDown={this.saveOnEnter}
          />
        </li>
      );
    } else {
      return (
        <li className={className}>
          <div className="view">
            <input
              ref="checkbox"
              className="toggle"
              type="checkbox"
              checked={completed}
              onChange={this.toggle}
            />

            <label onDoubleClick={this.edit}>
              {value}
            </label>

            <button
              className="destroy"
              onClick={this.destroy}
            />
          </div>
        </li>
      );
    }
  }
}
