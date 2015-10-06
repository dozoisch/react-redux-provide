import React, { Component, PropTypes } from 'react';
import createStoreShape from 'react-redux/lib/utils/createStoreShape';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';
import isPlainObject from 'react-redux/lib/utils/isPlainObject';
import wrapActionCreators from 'react-redux/lib/utils/wrapActionCreators';
import hoistStatics from 'hoist-non-react-statics';

const storeShape = createStoreShape(PropTypes);
const defaultMapState = () => ({});
const defaultMapDispatch = dispatch => ({ dispatch });
const defaultMerge = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
});

// Helps track hot reloading.
let nextVersion = 0;

export default function provide (propTypes, options = {}) {
  return function wrapWithProvide (WrappedComponent) {
    const version = nextVersion++;
    const providers = [];
    const { pure = true } = options;
    let shouldSubscribe = false;
    let shouldUpdateStateProps = false;
    let shouldUpdateDispatchProps = false;

    function getDisplayName () {
      return ''
        +'Provide'
        +(WrappedComponent.displayName || WrappedComponent.name || 'Component')
        +'('+providers.map(provider => provider.name).join(',')+')';
    }

    function addProvider (name, { mapState, mapDispatch, merge }) {
      if (Boolean(mapState)) {
        shouldSubscribe = true; 
      } else {
        mapState = defaultMapState;
      }

      if (isPlainObject(mapDispatch)) {
        mapDispatch = wrapActionCreators(mapDispatch);
      } else if (!mapDispatch) {
        mapDispatch = defaultMapDispatch;
      }

      if (!merge) {
        merge = defaultMerge;
      }

      const mapStateProps = mapState.length > 1;
      const mapDispatchProps = mapDispatch.length > 1;

      if (mapStateProps) {
        shouldUpdateStateProps = true;
      }
      if (mapDispatchProps) {
        shouldUpdateDispatchProps = true;
      }
      
      providers.push({
        name,
        mapState,
        mapStateProps,
        mapDispatch,
        mapDispatchProps,
        merge
      });

      Provide.displayName = getDisplayName();
    }

    function computeStateProps (store, props) {
      const state = store.getState();
      const stateProps = {};

      for (let provider of providers) {
        let providerStateProps = provider.mapStateProps
          ? provider.mapState(state, props)
          : provider.mapState(state);

        if (!isPlainObject(providerStateProps)) {
          throw new Error(
            '`mapState` must return an object. Instead received %s.',
            providerStateProps
          );
        }

        Object.assign(stateProps, providerStateProps);
      }

      return stateProps;
    }

    function computeDispatchProps (store, props) {
      const { dispatch } = store;
      const dispatchProps = {};

      for (let provider of providers) {
        let providerDispatchProps = provider.mapDispatchProps
          ? provider.mapDispatch(dispatch, props)
          : provider.mapDispatch(dispatch);

        if (!isPlainObject(providerDispatchProps)) {
          throw new Error(
            '`mapDispatch` must return an object. Instead received %s.',
            providerDispatchProps
          );
        }

        Object.assign(dispatchProps, providerDispatchProps);
      }

      return dispatchProps;
    }

    function computeNextState (stateProps, dispatchProps, parentProps) {
      const mergedProps = defaultMerge(stateProps, dispatchProps, parentProps);
      const filtered = {};

      for (let provider of providers) {
        let providerMergedProps = provider.merge(
          stateProps, dispatchProps, mergedProps
        );

        if (!isPlainObject(providerMergedProps)) {
          throw new Error(
            '`merge` must return an object. Instead received %s.',
            providerMergedProps
          );
        }

        Object.assign(mergedProps, providerMergedProps);
      }

      for (let key in propTypes) {
        if (mergedProps[key] !== undefined) {
          filtered[key] = mergedProps[key];
        }
      }

      return filtered;
    }

    const Provide = class extends Component {
      shouldComponentUpdate(nextProps, nextState) {
        if (!pure) {
          this.updateStateProps(nextProps);
          this.updateDispatchProps(nextProps);
          this.updateState(nextProps);
          return true;
        }

        const storeChanged = nextState.storeState !== this.state.storeState;
        const propsChanged = !shallowEqual(nextProps, this.props);
        let mapStateProducedChange = false;
        let dispatchPropsChanged = false;

        if (storeChanged || (propsChanged && shouldUpdateStateProps)) {
          mapStateProducedChange = this.updateStateProps(nextProps);
        }

        if (propsChanged && shouldUpdateDispatchProps) {
          dispatchPropsChanged = this.updateDispatchProps(nextProps);
        }

        if (propsChanged || mapStateProducedChange || dispatchPropsChanged) {
          this.updateState(nextProps);
          return true;
        }

        return false;
      }

      constructor(props, context) {
        super(props, context);
        this.version = version;
        this.store = props.store || context.store;

        if (!this.store) {
          throw new Error(
            `Could not find "store" in either the context or ` +
            `props of "${this.constructor.displayName}". ` +
            `Either wrap the root component in a <Provider>, ` +
            `or explicitly pass "store" as a prop to ` +
            `"${this.constructor.displayName}".`
          );
        }

        this.stateProps = computeStateProps(this.store, props);
        this.dispatchProps = computeDispatchProps(this.store, props);
        this.state = { storeState: null };
        this.updateState();
      }

      computeNextState(props = this.props) {
        return computeNextState(
          this.stateProps,
          this.dispatchProps,
          props
        );
      }

      updateStateProps(props = this.props) {
        const nextStateProps = computeStateProps(this.store, props);
        if (shallowEqual(nextStateProps, this.stateProps)) {
          return false;
        }

        this.stateProps = nextStateProps;
        return true;
      }

      updateDispatchProps(props = this.props) {
        const nextDispatchProps = computeDispatchProps(this.store, props);
        if (shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false;
        }

        this.dispatchProps = nextDispatchProps;
        return true;
      }

      updateState(props = this.props) {
        this.nextState = this.computeNextState(props);
      }

      isSubscribed() {
        return typeof this.unsubscribe === 'function';
      }

      trySubscribe() {
        if (shouldSubscribe && !this.unsubscribe) {
          this.unsubscribe = this.store.subscribe(::this.handleChange);
          this.handleChange();
        }
      }

      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      }

      componentDidMount() {
        this.trySubscribe();
      }

      componentWillUnmount() {
        this.tryUnsubscribe();
      }

      handleChange() {
        if (!this.unsubscribe) {
          return;
        }

        this.setState({
          storeState: this.store.getState()
        });
      }

      getWrappedInstance() {
        return this.refs.wrappedInstance;
      }

      render() {
        return (
          <WrappedComponent ref='wrappedInstance' {...this.nextState} />
        );
      }
    }

    Provide.displayName = getDisplayName();
    Provide.WrappedComponent = WrappedComponent;
    Provide.contextTypes = {
      store: storeShape
    };
    Provide.propTypes = {
      store: storeShape
    };
    Provide.addProvider = addProvider;

    if (process.env.NODE_ENV !== 'production') {
      Provide.prototype.componentWillUpdate = function componentWillUpdate () {
        if (this.version === version) {
          return;
        }

        // We are hot reloading!
        this.version = version;

        // Update the state and bindings.
        this.trySubscribe();
        this.updateStateProps();
        this.updateDispatchProps();
        this.updateState();
      };
    }

    return hoistStatics(Provide, WrappedComponent);
  }
}
