import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';
import isPlainObject from 'react-redux/lib/utils/isPlainObject';
import wrapActionCreators from 'react-redux/lib/utils/wrapActionCreators';
import hoistStatics from 'hoist-non-react-statics';

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

    function addProvider (provider) {
      const { actions, reducers } = provider;
      let { mapState, mapDispatch, merge } = provider;

      if (typeof mapState === 'undefined') {
        mapState = (state) => {
          const props = {};

          for (let key in reducers) {
            props[key] = state[key];
          }

          return props;
        };
      }

      if (typeof mapState === 'function') {
        shouldSubscribe = true;
      } else {
        mapState = defaultMapState;
      }

      if (typeof mapDispatch === 'undefined') {
        mapDispatch = dispatch => bindActionCreators(actions, dispatch);
      } else if (isPlainObject(mapDispatch)) {
        mapDispatch = wrapActionCreators(mapDispatch);
      } else if (typeof mapDispatch !== 'function') {
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
        ...provider,
        mapState,
        mapStateProps,
        mapDispatch,
        mapDispatchProps,
        merge
      });

      Provide.displayName = getDisplayName();
    }

    function computeStateProps (props) {
      const stateProps = {};

      for (let provider of providers) {
        let { store } = provider;
        let state = store.getState();
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

    function computeDispatchProps (props) {
      const dispatchProps = {};

      for (let provider of providers) {
        let { store } = provider;
        let { dispatch } = store;
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

      return filterPropTypes(mergedProps);
    }

    function filterPropTypes(props) {
      const filtered = {};

      for (let key in WrappedComponent.propTypes) {
        if (props[key] !== undefined) {
          filtered[key] = props[key];
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
        let currentState;

        if (storeChanged || (propsChanged && shouldUpdateStateProps)) {
          mapStateProducedChange = this.updateStateProps(nextProps);
        }

        if (propsChanged && shouldUpdateDispatchProps) {
          dispatchPropsChanged = this.updateDispatchProps(nextProps);
        }

        if (propsChanged || mapStateProducedChange || dispatchPropsChanged) {
          currentState = this.nextState;
          this.updateState(nextProps);
          return !shallowEqual(currentState, this.nextState);
        }

        return false;
      }

      constructor(props) {
        super(props);
        this.version = version;
        this.stateProps = computeStateProps(props);
        this.dispatchProps = computeDispatchProps(props);
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
        const nextStateProps = computeStateProps(props);
        if (shallowEqual(nextStateProps, this.stateProps)) {
          return false;
        }

        this.stateProps = nextStateProps;
        return true;
      }

      updateDispatchProps(props = this.props) {
        const nextDispatchProps = computeDispatchProps(props);
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
          this.unsubscribe = providers.map(
            provider => provider.store.subscribe(::this.handleChange)
          );
          this.handleChange();
        }
      }

      tryUnsubscribe() {
        if (this.unsubscribe) {
          for (let unsubscribe of this.unsubscribe) {
            unsubscribe();
          }
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

        let storeState = {};

        for (let provider of providers) {
          Object.assign(storeState, provider.store.getState());
        }

        this.setState({ storeState });
      }

      getWrappedInstance() {
        return this.refs.wrappedInstance;
      }

      render() {
        return (
          <WrappedComponent ref="wrappedInstance" {...this.nextState} />
        );
      }
    }

    if (!WrappedComponent.propTypes) {
      WrappedComponent.propTypes = {};
    }
    Object.assign(WrappedComponent.propTypes, propTypes);

    Provide.displayName = getDisplayName();
    Provide.WrappedComponent = WrappedComponent;
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
