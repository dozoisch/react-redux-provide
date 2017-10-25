import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TodoItem from './TodoItem';
import Footer from './Footer';

export default class MainSection extends Component {
  static propTypes = {
    todoList: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedFilter: PropTypes.func.isRequired,
    updateTodoList: PropTypes.func.isRequired,
    filterMap: PropTypes.instanceOf(Map).isRequired
  };

  toggleAll = () => {
    const completed = this.refs.toggleAll.checked;

    this.props.updateTodoList(todoItem => ({ ...todoItem, completed }));
  };

  render() {
    const { todoList } = this.props;
    const completedCount = todoList.reduce(
      (count, todoItem) => todoItem.completed ? count + 1 : count, 0
    );

    return (
      <section className="main">
        {this.renderToggleAll(completedCount)}

        <ul className="todo-list">
          {this.renderTodoItems()}
        </ul>
        
        {this.renderFooter(completedCount)}
      </section>
    );
  }

  renderTodoItems() {
    const { selectedFilter } = this.props;
    const todoItems = [];

    this.props.todoList.forEach((todoItem, index) => {
      if (selectedFilter(todoItem)) {
        todoItems.unshift(
          <TodoItem key={index} index={index} />
        );
      }
    });

    return todoItems;
  }

  renderToggleAll(completedCount) {
    const { todoList } = this.props;

    if (todoList.length) {
      return (
        <input
          ref="toggleAll"
          className="toggle-all"
          type="checkbox"
          checked={completedCount === todoList.length}
          onChange={this.toggleAll}
        />
      );
    }
  }

  renderFooter(completedCount) {
    const { todoList } = this.props;
    const activeCount = todoList.length - completedCount;

    if (todoList.length) {
      return (
        <Footer completedCount={completedCount} activeCount={activeCount} />
      );
    }
  }
}
