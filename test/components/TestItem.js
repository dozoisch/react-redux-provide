import React, { Component, PropTypes } from 'react';
import provide from '../../src/provide';

class TestItem extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    item: PropTypes.object.isRequired,
    updateItem: PropTypes.func.isRequired,
    count: PropTypes.number.isRequired
  };

  update = (value) => {
    this.props.updateItem(this.props.index, { value });
  };

  render() {
    return (
      <li className="test-item">
        {this.props.item.value}
      </li>
    );
  }
}

export default provide(TestItem);
