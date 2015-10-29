import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';
import TodoItem from './TodoItem';
import Footer from './Footer';

@provide({
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateList: PropTypes.func.isRequired,
  filter: PropTypes.func.isRequired
})
export default class MainSection extends Component {
  toggleAll() {
    const completed = this.refs.toggleAll.checked;

    this.props.updateList(item => {
      return { ...item, completed };
    });
  }

  render() {
    const { list } = this.props;
    const completedCount = list.reduce(
      (count, item) => item.completed ? count + 1 : count, 0
    );

    return (
      <section className="main">
        {this.renderToggleAll(completedCount)}

        <ul className="todo-list">
          {this.renderItems()}
        </ul>
        
        {this.renderFooter(completedCount)}
      </section>
    );
  }

  renderItems() {
    const items = [];

    this.props.list.forEach((item, index) => {
      if (this.props.filter(item)) {
        items.push(
          <TodoItem key={index} index={index} />
        );
      }
    });

    return items;
  }

  renderToggleAll(completedCount) {
    const { list } = this.props;

    if (list.length) {
      return (
        <input
          ref="toggleAll"
          className="toggle-all"
          type="checkbox"
          checked={completedCount === list.length}
          onChange={::this.toggleAll}
        />
      );
    }
  }

  renderFooter(completedCount) {
    const { list } = this.props;
    const activeCount = list.length - completedCount;

    if (list.length) {
      return (
        <Footer completedCount={completedCount} activeCount={activeCount} />
      );
    }
  }
}
