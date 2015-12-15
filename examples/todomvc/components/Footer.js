import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';
import classnames from 'classnames';

@provide
export default class Footer extends Component {
  static propTypes = {
    completedCount: PropTypes.number.isRequired,
    activeCount: PropTypes.number.isRequired,
    filterTodoList: PropTypes.func.isRequired,
    filterMap: PropTypes.instanceOf(Map).isRequired,
    updateFilterMap: PropTypes.func.isRequired
  };

  clearCompleted() {
    this.props.filterTodoList(todoItem => !todoItem.completed);
  }

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
    const { updateFilterMap } = this.props;

    return (
      <a
        className={classnames({ selected: filterItem.selected })}
        style={{ cursor: 'pointer' }}
        onClick={() => updateFilterMap(
          ([someFilterName, someFilterItem]) => [
            someFilterName,
            { ...someFilterItem, selected: filterName === someFilterName }
          ]
        )}
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
          onClick={::this.clearCompleted}
        >
          Clear completed
        </button>
      );
    }
  }
}
