import React, { Component, PropTypes } from 'react';

export default class QueryTest extends Component {
  static propTypes = {
    query: PropTypes.object.isRequired,
    queryOptions: PropTypes.object.isRequired,
    result: PropTypes.any
  };

  static defaultProps = {
    query: {
      roll: 'roll'
    },
    queryOptions: {
      select: 'roll'
    }
  };

  render() {
    const { result } = this.props;
    const enteredRoll = result && result.length ? 'Yes.' : 'No.';

    return (
      <div className="query-test" style={{ marginBottom: 20 }}>
        Right clicked on button and entered "roll"? {enteredRoll}
      </div>
    );
  }
}
