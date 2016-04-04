import React, { Component, PropTypes } from 'react';

export default class GoodTimes extends Component {
  static propTypes = {
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
    pushItem: PropTypes.func.isRequired,
    setRoll: PropTypes.func.isRequired,
    roll: PropTypes.any
  };

  addTime = () => {
    this.props.pushItem({
      time: Date.now()
    });
  };

  setRoll = event => {
    if (event) {
      event.preventDefault();
    }

    this.props.setRoll(window.prompt('Let the good times what?'));
  };

  render() {
    return (
      <div className="good-times">
        {this.renderButton()}
        {this.renderTimes()}
      </div>
    );
  }

  renderButton() {
    const style = {
      fontSize: '20px',
      marginBottom: '20px'
    };
    
    return (
      <input
        type="button"
        style={style}
        value={`Let the good times ${this.props.roll}`}
        onClick={this.addTime}
        onContextMenu={this.setRoll}
      />
    );
  }

  renderTimes() {
    return this.props.list.map(
      item => (
      	<li key={item.time}>
      	  {new Date(item.time).toString()}
      	</li>
      )
    );
  }
}
