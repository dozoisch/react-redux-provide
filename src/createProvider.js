import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

/**
 * Creates an object to be used as a provider from a set of actions and 
 * reducers.
 *
 * @param {Object} actions
 * @param {Object} reducers
 * @param {Function} merge Optional
 * @return {Object}
 * @api public
 */
export default function createProvider (actions, reducers, merge) {
  return {
    mapState(state) {
      const props = {};

      for (let key in reducers) {
        props[key] = state[key];
      }

      return props;
    },

    mapDispatch(dispatch) {
      return bindActionCreators(actions, dispatch);
    },

    merge
  };
}
