import React, { Component, PropTypes } from 'react';
import provide from '../../src/provide';

@provide({
  item: PropTypes.object.isRequired,
  updateItem: PropTypes.func.isRequired
})
export default class TestItem extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired
  };

  update(value) {
    this.props.updateItem(this.props.index, { value, updated: true });
  }

  render() {
    return (
      <li className="test-item">
        {this.props.item.value}
      </li>
    );
  }
}
