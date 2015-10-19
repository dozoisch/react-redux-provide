import React, { Component, PropTypes } from 'react';
import provide from '../../src/provide';
import TestItem from './TestItem';

@provide({
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  createItem: PropTypes.func.isRequired
})
export default class Test extends Component {
  static propTypes = {
    placeholder: PropTypes.string.isRequired
  };

  createItem() {
    this.props.createItem({
      value: this.refs.input.value
    });
  }

  createItemOnEnter(event) {
    if (event.key === 'Enter') {
      this.createItem();
    }
  }

  render() {
    return (
      <div className="test">
        {this.renderInput()}
        {this.renderItems()}
      </div>
    );
  }

  renderInput() {
    return (
      <input
        ref="input"
        type="text"
        placeholder={this.props.placeholder}
        onKeyDown={::this.createItemOnEnter}
      />
    );
  }

  renderItems() {
    return this.props.list.map(
      (item, index) => <TestItem key={index} index={index} />
    );
  }
}
