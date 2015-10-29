import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';
import classnames from 'classnames';

@provide({
  filterList: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  updateMap: PropTypes.func.isRequired
})
export default class Footer extends Component {
  static propTypes = {
    completedCount: PropTypes.number.isRequired,
    activeCount: PropTypes.number.isRequired
  };

  clearCompleted() {
    this.props.filterList(item => !item.completed);
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
    return Object.keys(this.props.map).map(
      filterName => (
        <li key={filterName}>
          {this.renderFilterLink(filterName)}
        </li>
      )
    );
  }

  renderFilterLink(filterName) {
    const { map, updateMap } = this.props;

    return (
      <a
        className={classnames({ selected: map[filterName].selected })}
        style={{ cursor: 'pointer' }}
        onClick={() => updateMap(
          (item, index) => ({ ...item, selected: filterName === index })
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
