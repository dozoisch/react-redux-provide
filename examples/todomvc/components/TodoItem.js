import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';
import classnames from 'classnames';

@provide({
  item: PropTypes.object.isRequired,
  updateItem: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired
})
export default class TodoItem extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired
  };

  edit() {
    const { index } = this.props;

    this.props.updateItem(index, { editing: true });
  }

  save() {
    const { index } = this.props;
    const value = this.refs.input.value;

    if (value.length) {
      this.props.updateItem(index, { value, editing: false });
    } else {
      this.props.deleteItem(index);
    }
  }

  saveOnEnter(event) {
    if (event.which === 13) {
      this.save();
    }
  }

  toggle() {
    const { index } = this.props;

    this.props.updateItem(index, { completed: this.refs.checkbox.checked });
  }

  destroy() {
    const { index } = this.props;

    this.props.deleteItem(index);
  }

  render() {
    const { item } = this.props;
    const { value, completed, editing } = item;
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
            onBlur={::this.save}
            onKeyDown={::this.saveOnEnter}
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
              onChange={::this.toggle}
            />

            <label onDoubleClick={::this.edit}>
              {value}
            </label>

            <button
              className="destroy"
              onClick={::this.destroy}
            />
          </div>
        </li>
      );
    }
  }
}
