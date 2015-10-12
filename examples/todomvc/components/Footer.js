import React, { Component, PropTypes } from 'react';
import provide from 'react-redux-provide';
import classnames from 'classnames';

@provide({
  filterList: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  select: PropTypes.func.isRequired,
  selectedKey: PropTypes.string.isRequired
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
      key => (
        <li key={key}>
          {this.renderFilterLink(key)}
        </li>
      )
    );
  }

  renderFilterLink(key) {
    const { selectedKey, select } = this.props;

    return (
      <a
        className={classnames({ selected: key === selectedKey })}
        style={{ cursor: 'pointer' }}
        onClick={() => select(key)}
      >
        {key}
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
