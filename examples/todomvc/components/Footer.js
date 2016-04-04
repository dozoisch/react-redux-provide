import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

export default class Footer extends Component {
  static propTypes = {
    completedCount: PropTypes.number.isRequired,
    activeCount: PropTypes.number.isRequired,
    filterTodoList: PropTypes.func.isRequired,
    filterMap: PropTypes.instanceOf(Map).isRequired,
    selectFilter: PropTypes.func.isRequired,
    selectedFilterName: PropTypes.string.isRequired
  };

  clearCompleted = () => {
    this.props.filterTodoList(todoItem => !todoItem.completed);
  };

  render() {
    return (
      <footer className="footer">
        {this.renderTodoCount()}

        <ul className="filters">
          {this.renderFilters()}
        </ul>

        {this.renderClearButton()}
      </footer>
    );
  }

  renderTodoCount() {
    const { activeCount } = this.props;
    const itemWord = activeCount === 1 ? 'item' : 'items';

    return (
      <span className="todo-count">
        <strong>{activeCount || 'No'}</strong> {itemWord} left
      </span>
    );
  }

  renderFilters() {
    const filters = [];

    for (let [filterName, filterItem] of this.props.filterMap.entries()) {
      filters.push(
        <li key={filterName}>
          {this.renderFilterLink(filterName, filterItem)}
        </li>
      );
    }

    return filters;
  }

  renderFilterLink(filterName, filterItem) {
    const { selectedFilterName, selectFilter } = this.props;

    return (
      <a
        className={classnames({ selected: filterName === selectedFilterName })}
        style={{ cursor: 'pointer' }}
        onClick={() => selectFilter(filterName)}
      >
        {filterName}
      </a>
    );
  }

  renderClearButton() {
    const { completedCount } = this.props;

    if (completedCount > 0) {
      return (
        <button
          className="clear-completed"
          onClick={this.clearCompleted}
        >
          Clear completed
        </button>
      );
    }
  }
}
