import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';
import isPlainObject from 'react-redux/lib/utils/isPlainObject';
import wrapActionCreators from 'react-redux/lib/utils/wrapActionCreators';
import createProviderStore from './createProviderStore';
import createCombinedStore from './createCombinedStore';
import hoistStatics from 'hoist-non-react-statics';

const defaultMapState = () => ({});
const defaultMapDispatch = dispatch => ({ dispatch });
const defaultMerge = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
});

const contextTypes = {
  allProviders: PropTypes.object,
  providedState: PropTypes.object,
  providers: PropTypes.object,
  combinedProviders: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object)
  ]),
  combinedProviderStores: PropTypes.object
};

export default function provide(WrappedComponent) {
  const instances = WrappedComponent.instances || new Set();
  const pure = WrappedComponent.pure !== false;
  let shouldSubscribe = false;
  let doStatePropsDependOnOwnProps = false;
  let doDispatchPropsDependOnOwnProps = false;

  WrappedComponent.instances = instances;

  function getDisplayName(providers = {}) {
    return ''
      +'Provide'
      +(WrappedComponent.displayName || WrappedComponent.name || 'Component')
      +'('+Object.keys(providers).join(',')+')';
  }

  function getReduced(reducers) {
    const reduced = {};

    for (let key in reducers) {
      reduced[key] = reducers[key](undefined, {});
    }

    return reduced;
  }

  const Provide = class extends Component {
    static WrappedComponent = WrappedComponent;
    static displayName = getDisplayName();
    static propTypes = contextTypes;
    static contextTypes = contextTypes;
    static childContextTypes = contextTypes;

    getChildContext() {
      return {
        allProviders: this.allProviders,
        providedState: this.providedState,
        providers: this.contextProviders,
        combinedProviders: this.contextCombinedProviders,
        combinedProviderStores: this.contextCombinedProviderStores
      };
    }

    constructor(props, context) {
      super(props);
      this.prerenders = 0;
      this.renders = 0;
      this.stores = new Set();
      this.storesStates = new WeakMap();
      this.providedState = props.providedState || context.providedState || {};
      this.initCombinedProviderStores(props, context);
      this.initProviders(props, context);
      this.initState(props, context);
      this.clearCache();
    }

    initCombinedProviderStores(props, context) {
      if (context.combinedProviderStores) {
        this.contextCombinedProviders = context.combinedProviders;
        this.contextCombinedProviderStores = context.combinedProviderStores;
        return;
      }

      let { combinedProviders = [] } = props;

      if (!Array.isArray(combinedProviders)) {
        combinedProviders = [ combinedProviders ];
      }

      this.contextCombinedProviders = combinedProviders;
      this.contextCombinedProviderStores = {};

      for (let providers of combinedProviders) {
        let store = createCombinedStore(providers, this.providedState);

        for (let name in providers) {
          this.contextCombinedProviderStores[name] = store;
        }

        this.addStore(store);
      }
    }

    initProviders(props, context) {
      const allProviders = props.providers || context.allProviders || {};

      this.allProviders = allProviders;
      this.contextProviders = context.providers || {};
      this.providers = {};

      for (let name in allProviders) {
        this.addValidProvider(name, allProviders[name]);
      }

      Provide.displayName = getDisplayName(this.providers);
    }

    addValidProvider(name, provider) {
      const { propTypes = {} } = WrappedComponent;
      const { actions = {}, reducers = {}, merge } = provider;
      const merged = merge && merge(getReduced(reducers), {}, {}) || {};

      for (let propKey in propTypes) {
        if (propKey in actions || propKey in reducers || propKey in merged) {
          this.addProvider(name, provider);
          return;
        }
      }
    }

    addProvider(name, provider) {
      const { providers, contextProviders } = this;

      if (contextProviders[name]) {
        providers[name] = contextProviders[name];
        this.addStore(providers[name].store);

        if (typeof providers[name].mapState === 'function') {
          shouldSubscribe = true;
        }
        if (providers[name].mapState.length !== 1) {
          doStatePropsDependOnOwnProps = true;
        }
        if (providers[name].mapDispatch.length !== 1) {
          doDispatchPropsDependOnOwnProps = true;
        }

        return;
      }

      const { actions = {}, reducers = {} } = provider;
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
      
      contextProviders[name] = providers[name] = this.setProviderStore({
        name,
        ...provider,
        mapState,
        mapStateProps,
        mapDispatch,
        mapDispatchProps,
        merge
      });
    }

    addStore(store) {
      this.stores.add(store);
      this.storesStates.set(store, store.getState());
    }

    setProviderStore(provider) {
      if (!provider.store) {
        if (this.contextCombinedProviderStores[provider.name]) {
          provider.store = this.contextCombinedProviderStores[provider.name];
        } else {
          provider.store = createProviderStore(provider, this.providedState);
          this.addStore(provider.store);
        }
      }

      return provider;
    }

    initState(props, context) {
      this.state = { storesStates: this.storesStates };
    }

    componentDidMount() {
      this.trySubscribe();
      instances.add(this);
    }

    componentWillReceiveProps(nextProps) {
      if (!pure || !shallowEqual(nextProps, this.props)) {
        this.haveOwnPropsChanged = true;
      }
    }

    componentWillUnmount() {
      this.tryUnsubscribe();
      this.clearCache();
      instances.delete(this);
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
      return this.unsubscribe && typeof this.unsubscribe[0] === 'function';
    }

    trySubscribe() {
      if (shouldSubscribe && !this.unsubscribe) {
        this.unsubscribe = Array.from(this.stores).map(
          store => store.subscribe(::this.handleChange)
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

      if (!pure || this.storesDidChange()) {
        this.hasStoreStateChanged = true;
        this.setState({ storesStates: this.storesStates });
      }
    }

    storesDidChange() {
      const { stores, storesStates } = this;
      let changed = false;

      this.storesStates = new WeakMap();

      for (let store of stores) {
        let prevStoreState = storesStates.get(store);
        let storeState = store.getState();

        if (
          prevStoreState !== storeState
          && !shallowEqual(prevStoreState, storeState)
        ) {
          changed = true;
        }

        this.storesStates.set(store, storeState);
      }

      return changed;
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

      for (let name in this.providers) {
        let provider = this.providers[name];
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

      for (let name in this.providers) {
        let provider = this.providers[name];
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
      const { mergedProps } = this;

      this.mergedProps = this.computeMergedProps(
        this.stateProps,
        this.dispatchProps,
        this.props
      );

      return !mergedProps || !shallowEqual(mergedProps, this.mergedProps);
    }

    computeMergedProps(stateProps, dispatchProps, parentProps) {
      const mergedProps = defaultMerge(stateProps, dispatchProps, parentProps);
      const filtered = {};

      for (let name in this.providers) {
        let provider = this.providers[name];
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

      for (let key in WrappedComponent.propTypes) {
        if (mergedProps[key] !== undefined) {
          filtered[key] = mergedProps[key];
        }
      }

      return filtered;
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
      let haveMergedPropsChanged = false;

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
        haveMergedPropsChanged = this.updateMergedProps();
      }

      this.prerenders++;

      if (!haveMergedPropsChanged && renderedElement) {
        return renderedElement;
      }

      this.renderedElement = (
        <WrappedComponent ref="wrappedInstance" {...this.mergedProps} />
      );

      this.renders++;

      return this.renderedElement;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    for (let instance of instances) {
      let { props, context } = instance;
      let providedState = props.providedState || context.providedState || {};

      instance.stores = new Set();
      instance.storesStates = new WeakMap();
      instance.providedState = providedState;
      instance.initCombinedProviderStores(props, context);
      instance.initProviders(props, context);
      instance.initState(props, context);
      instance.tryUnsubscribe();
      instance.trySubscribe();
      instance.clearCache();
      instance.forceUpdate();
    }
  }

  return hoistStatics(Provide, WrappedComponent);
}
