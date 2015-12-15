import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';

@provide
export default class GoodTimes extends Component {
  static propTypes = {
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
    pushItem: PropTypes.func.isRequired
  };
  
  addTime() {
    this.props.pushItem({
      time: Date.now()
    });
  }

  render() {
    console.log(Object.keys(this.props));
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
        value="Let the good times roll"
        onClick={::this.addTime}
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
