import React, { Component, PropTypes } from 'react';
import isPlainObject from 'is-plain-object';
import { bindActionCreators } from 'redux';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';
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
  providedState: PropTypes.object,
  providers: PropTypes.object,
  combinedProviders: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object)
  ]),
  combinedProviderStores: PropTypes.object,
  providerReady: PropTypes.arrayOf(PropTypes.func)
};

const wrappedInstances = {};
let rootInstance = null;

export default function provide(WrappedComponent) {
  let wrappedName = WrappedComponent.displayName || WrappedComponent.name;
  let instances = wrappedInstances[wrappedName] || new Set();
  let pure = WrappedComponent.pure !== false;
  let doSubscribe = false;
  let statePropsDepend = false;
  let dispatchPropsDepend = false;

  if (!wrappedInstances[wrappedName]) {
    wrappedInstances[wrappedName] = instances;
  }

  function getDisplayName(providers = {}) {
    return `Provide${wrappedName}(${Object.keys(providers).join(',')})`;
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
        providedState: this.providedState,
        providers: this.contextProviders,
        combinedProviders: this.contextCombinedProviders,
        combinedProviderStores: this.contextCombinedProviderStores,
        providerReady: this.providerReady
      };
    }

    constructor(props, context) {
      super(props);

      if (!context.providers) {
        rootInstance = this;
      }

      this.prerenders = 1;
      this.renders = 0;
      this.initialize(props, context);
    }

    initialize(props, context) {
      this.stores = new Set();
      this.storesStates = new WeakMap();
      this.providedState = props.providedState || context.providedState || {};
      this.providerReady = props.providerReady || context.providerReady;
      this.initCombinedProviderStores(props, context);
      this.initProviders(props, context);
      this.initState(props, context);
    }

    reinitialize(props, context, newWrappedComponent) {
      if (newWrappedComponent) {
        this.setWrappedComponent(newWrappedComponent);
      }
      this.initialize(props, context);
      this.tryUnsubscribe();
      this.trySubscribe();
      this.forceUpdate();
    }

    setWrappedComponent(newWrappedComponent) {
      const prevWrappedName = wrappedName;

      WrappedComponent = newWrappedComponent;
      Provide.WrappedComponent = WrappedComponent;
      wrappedName = WrappedComponent.displayName || WrappedComponent.name;
      if (prevWrappedName !== wrappedName) {
        wrappedInstances[wrappedName] = instances;
        delete wrappedInstances[prevWrappedName];
      }
      pure = WrappedComponent.pure !== false;
      doSubscribe = false;
      statePropsDepend = false;
      dispatchPropsDepend = false;
    }

    initCombinedProviderStores(props, context) {
      if (!props.providers && context.combinedProviderStores) {
        this.contextCombinedProviders = context.combinedProviders;
        this.contextCombinedProviderStores = context.combinedProviderStores;
        return;
      }

      let { combinedProviders = [] } = props;

      if (!Array.isArray(combinedProviders)) {
        combinedProviders = [ combinedProviders ];
      }

      if (this.contextCombinedProviderStores) {
        const removed = new WeakSet();

        for (let name in this.contextCombinedProviderStores) {
          let store = this.contextCombinedProviderStores[name];

          if (store && store.remove && !removed.has(store)) {
            store.remove();
            removed.add(store);
          }
        }
      }

      this.contextCombinedProviders = combinedProviders;
      this.contextCombinedProviderStores = {};

      for (let providers of combinedProviders) {
        let store = createCombinedStore(providers, this.providedState);

        for (let name in providers) {
          this.contextCombinedProviderStores[name] = store;
        }
      }
    }

    initProviders(props, context) {
      const { propTypes = {} } = WrappedComponent;

      if (props.providers) {
        if (this.contextProviders) {
          const removed = new WeakSet();

          for (let name in this.contextProviders) {
            let { store } = this.contextProviders[name];

            if (store && store.remove && !removed.has(store)) {
              store.remove();
              removed.add(store);
            }
          }
        }

        this.contextProviders = {};

        for (let name in props.providers) {
          this.initProvider(name, props.providers[name]);
        }
      } else {
        this.contextProviders = context.providers;
      }

      this.providers = {};

      for (let name in this.contextProviders) {
        let provider = this.contextProviders[name];
        let { actions = {}, reducers = {}, merge } = provider;
        let merged = merge && merge(getReduced(reducers), {}, {}) || {};

        for (let propKey in propTypes) {
          if (propKey in actions || propKey in reducers || propKey in merged) {
            this.providers[name] = provider;
            this.addStore(provider.store);

            if (provider.shouldSubscribe) {
              doSubscribe = true;
            }
            if (provider.mapStateProps) {
              statePropsDepend = true;
            }
            if (provider.mapDispatchProps) {
              dispatchPropsDepend = true;
            }

            break;
          }
        }
      }

      Provide.displayName = getDisplayName(this.providers);
    }

    initProvider(name, provider) {
      const { actions = {}, reducers = {} } = provider;
      let { mapState, mapDispatch, merge } = provider;
      let shouldSubscribe = false;

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
      
      this.contextProviders[name] = this.setProviderStore({
        name,
        ...provider,
        shouldSubscribe,
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
        provider.store = this.contextCombinedProviderStores[provider.name]
          || createProviderStore(provider, this.providedState);

        this.setProviderReady(provider);
      }

      return provider;
    }

    setProviderReady(provider) {
      if (this.providerReady) {
        for (let ready of this.providerReady) {
          ready(provider);
        }
      }
    }

    initState(props, context) {
      this.state = { storesStates: this.storesStates };
      this.setStateProps(props);
      this.setDispatchProps(props);
      this.setMergedProps(props);
    }

    setStateProps(props) {
      const { stateProps } = this;
      const nextStateProps = this.computeStateProps(props);

      if (stateProps && shallowEqual(nextStateProps, stateProps)) {
        return false;
      }

      this.stateProps = nextStateProps;
      return true;
    }

    computeStateProps(props) {
      const stateProps = {};

      for (let name in this.providers) {
        let provider = this.providers[name];
        let state = provider.store.getState();
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

    setDispatchProps(props) {
      const { dispatchProps } = this;
      const nextDispatchProps = this.computeDispatchProps(props);
      if (dispatchProps && shallowEqual(nextDispatchProps, dispatchProps)) {
        return false;
      }

      this.dispatchProps = nextDispatchProps;
      return true;
    }

    computeDispatchProps(props) {
      const dispatchProps = {};

      for (let name in this.providers) {
        let provider = this.providers[name];
        let { dispatch } = provider.store;
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

    setMergedProps(props) {
      const { stateProps, dispatchProps, mergedProps } = this;

      this.mergedProps = this.computeMergedProps(
        stateProps,
        dispatchProps,
        WrappedComponent.defaultProps
          ? { ...WrappedComponent.defaultProps, ...props }
          : props
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

    componentDidMount() {
      this.trySubscribe();
      instances.add(this);
    }

    componentWillUnmount() {
      this.tryUnsubscribe();
      instances.delete(this);
    }

    componentWillReceiveProps(nextProps) {
      if (!pure || !shallowEqual(nextProps, this.props)) {
        this.propsChanged = true;
      }
    }

    isSubscribed() {
      return this.unsubscribe && typeof this.unsubscribe[0] === 'function';
    }

    trySubscribe() {
      if (doSubscribe && !this.unsubscribe) {
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
        this.storesChanged = true;
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

    getCurrentProvidedState() {
      const { contextProviders } = this;
      const providedState = {};

      for (let name in contextProviders) {
        Object.assign(providedState, contextProviders[name].store.getState());
      }

      return providedState;
    }

    shouldComponentUpdate(props) {
      const { propsChanged, storesChanged } = this;
      let statePropsChanged = false;
      let dispatchPropsChanged = false;
      let mergedPropsChanged = false;

      if (!pure) {
        return true;
      }

      if (!propsChanged && !storesChanged) {
        return false;
      }

      if (storesChanged || (propsChanged && statePropsDepend)) {
        statePropsChanged = this.setStateProps(props);
      }
      if (propsChanged && dispatchPropsDepend) {
        dispatchPropsChanged = this.setDispatchProps(props);
      }
      if (statePropsChanged || dispatchPropsChanged || propsChanged) {
        mergedPropsChanged = this.setMergedProps(props);
      }

      this.prerenders++;
      this.propsChanged = false;
      this.storesChanged = false;

      return mergedPropsChanged;
    }

    render() {
      this.renders++;

      return (
        <WrappedComponent ref="wrappedInstance" {...this.mergedProps} />
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    for (let instance of instances) {
      const { props, context } = instance;

      instance.reinitialize(props, context, WrappedComponent);
    }
  }

  return hoistStatics(Provide, WrappedComponent);
}

export function reloadProviders({ providers, combinedProviders }) {
  rootInstance.reinitialize({
    ...rootInstance.props,
    providedState: rootInstance.getCurrentProvidedState(),
    providers,
    combinedProviders
  }, rootInstance.context);

  const {
    contextProviders,
    contextCombinedProviders,
    contextCombinedProviderStores
  } = rootInstance;

  for (let wrappedName in wrappedInstances) {
    let instances = wrappedInstances[wrappedName];

    for (let instance of instances) {
      let { props, context } = instance;

      if (instance !== rootInstance) {
        context.providers = contextProviders;
        context.combinedProviders = contextCombinedProviders;
        context.combinedProviderStores = contextCombinedProviderStores;
        instance.reinitialize(props, context);
      }
    }
  }
}
