import React, { Component, PropTypes } from 'react';
import provide from '../../src/provide';
import TestItem from './TestItem';

@provide
export default class Test extends Component {
  static propTypes = {
    placeholder: PropTypes.string.isRequired,
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
    unshiftItem: PropTypes.func.isRequired,
    updatedIndex: PropTypes.number.isRequired,
    noop: PropTypes.func.isRequired
  };

  unshiftItem() {
    this.props.unshiftItem({
      value: this.refs.input.value
    });
  }

  unshiftItemOnEnter(event) {
    if (event.key === 'Enter') {
      this.unshiftItem();
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
        onKeyDown={::this.unshiftItemOnEnter}
      />
    );
  }

  renderItems() {
    return this.props.list.map(
      (item, index) => (
        <TestItem ref={`item${index}`} key={index} index={index} />
      )
    );
  }
}
