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

export default function provide(WrappedComponent) {
  const version = nextVersion++;
  const providers = WrappedComponent.providers || [];
  const pure = WrappedComponent.pure !== false;
  let shouldSubscribe = false;
  let doStatePropsDependOnOwnProps = false;
  let doDispatchPropsDependOnOwnProps = false;

  WrappedComponent.providers = providers;

  function getDisplayName() {
    return ''
      +'Provide'
      +(WrappedComponent.displayName || WrappedComponent.name || 'Component')
      +'('+providers.map(provider => provider.name).join(',')+')';
  }

  function addProvider(provider) {
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

    const mapStateProps = mapState.length !== 1;
    const mapDispatchProps = mapDispatch.length !== 1;

    if (mapStateProps) {
      doStatePropsDependOnOwnProps = true;
    }
    if (mapDispatchProps) {
      doDispatchPropsDependOnOwnProps = true;
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
    static displayName = getDisplayName();
    static WrappedComponent = WrappedComponent;
    static addProvider = addProvider;

    constructor(props) {
      super(props);
      this.version = version;
      this.initProviders();
      this.initState();
      this.clearCache();
    }

    initProviders() {
      this.providers = providers;
    }

    initState() {
      this.state = { storeState: this.getStoreState() };
    }

    getStoreState() {
      const storeState = {};

      for (let provider of this.providers) {
        Object.assign(storeState, provider.store.getState());
      }

      return storeState;
    }

    getWrappedInstance() {
      return this.refs.wrappedInstance;
    }

    componentDidMount() {
      this.trySubscribe();
    }

    componentWillReceiveProps(nextProps) {
      if (!pure || !shallowEqual(nextProps, this.props)) {
        this.haveOwnPropsChanged = true;
      }
    }

    componentWillUnmount() {
      this.tryUnsubscribe();
      this.clearCache();
    }

    clearCache() {
      this.dispatchProps = null;
      this.stateProps = null;
      this.mergedProps = null;
      this.haveOwnPropsChanged = true;
      this.hasStoreStateChanged = true;
      this.renderedElement = null;
    }

    isSubscribed() {
      return typeof this.unsubscribe === 'function';
    }

    trySubscribe() {
      if (shouldSubscribe && !this.unsubscribe) {
        // TODO: make sure subscribing once per store
        this.unsubscribe = this.providers.map(
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

    handleChange() {
      if (!this.unsubscribe) {
        return;
      }

      const prevStoreState = this.state.storeState;
      const storeState = this.getStoreState();

      if (!pure || !shallowEqual(prevStoreState, storeState)) {
        this.hasStoreStateChanged = true;
        this.setState({ storeState });
      }
    }

    shouldComponentUpdate() {
      return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged;
    }

    updateStatePropsIfNeeded() {
      const { stateProps } = this;
      const nextStateProps = this.computeStateProps();
      if (stateProps && shallowEqual(nextStateProps, stateProps)) {
        return false;
      }

      this.stateProps = nextStateProps;
      return true;
    }

    computeStateProps() {
      const stateProps = {};

      for (let provider of this.providers) {
        let { store } = provider;
        let state = store.getState();
        let providerStateProps = provider.mapStateProps
          ? provider.mapState(state, this.props)
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

    updateDispatchPropsIfNeeded() {
      const { dispatchProps } = this;
      const nextDispatchProps = this.computeDispatchProps();
      if (dispatchProps && shallowEqual(nextDispatchProps, dispatchProps)) {
        return false;
      }

      this.dispatchProps = nextDispatchProps;
      return true;
    }

    computeDispatchProps() {
      const dispatchProps = {};

      for (let provider of this.providers) {
        let { store } = provider;
        let { dispatch } = store;
        let providerDispatchProps = provider.mapDispatchProps
          ? provider.mapDispatch(dispatch, this.props)
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

    updateMergedProps() {
      this.mergedProps = this.computeMergedProps(
        this.stateProps,
        this.dispatchProps,
        this.props
      );
    }

    computeMergedProps(stateProps, dispatchProps, parentProps) {
      const mergedProps = defaultMerge(stateProps, dispatchProps, parentProps);

      for (let provider of this.providers) {
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

    render() {
      const {
        haveOwnPropsChanged,
        hasStoreStateChanged,
        renderedElement
      } = this;

      let shouldUpdateStateProps = true;
      let shouldUpdateDispatchProps = true;
      let haveStatePropsChanged = false;
      let haveDispatchPropsChanged = false;
      let haveMergedPropsChanged = true;

      this.haveOwnPropsChanged = false;
      this.hasStoreStateChanged = false;

      if (pure && renderedElement) {
        shouldUpdateStateProps = hasStoreStateChanged
          || (haveOwnPropsChanged && doStatePropsDependOnOwnProps);
        shouldUpdateDispatchProps = haveOwnPropsChanged
          && doDispatchPropsDependOnOwnProps;
      }

      if (shouldUpdateStateProps) {
        haveStatePropsChanged = this.updateStatePropsIfNeeded();
      }
      if (shouldUpdateDispatchProps) {
        haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded();
      }

      if (
        haveStatePropsChanged ||
        haveDispatchPropsChanged ||
        haveOwnPropsChanged
      ) {
        this.updateMergedProps();
      } else {
        haveMergedPropsChanged = false;
      }

      if (!haveMergedPropsChanged && renderedElement) {
        return renderedElement;
      }

      this.renderedElement = (
        <WrappedComponent ref="wrappedInstance" {...this.mergedProps} />
      );

      return this.renderedElement;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    Provide.prototype.componentWillUpdate = function componentWillUpdate() {
      if (this.version === version) {
        return;
      }

      // We are hot reloading!
      this.version = version;

      // Update the state and bindings.
      this.trySubscribe();
      this.clearCache();
    };
  }

  return hoistStatics(Provide, WrappedComponent);
}
