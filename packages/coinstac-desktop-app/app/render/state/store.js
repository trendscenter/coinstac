/**
 * Store configuration.
 *
 * This configures the Redux store by adding middleware. See Redux's
 * 'Real World' example:
 *
 * @{@link  https://github.com/rackt/redux/blob/master/examples/real-world/store/configureStore.js}
 */
import { applyMiddleware, createStore } from 'redux';
import promiseMiddleware from 'redux-promise';
import thunkMiddleware from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import createElectronStorage from 'redux-persist-electron-storage';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';

import rootReducer from './root-reducer';
import { init as initPersistStateReducer, CURRENT_PERSISTED_STORE_VERSION } from './ducks/statePersist';

const ElectronStore = require('electron-store');

const electronStore = new ElectronStore();

const persistConfig = {
  key: 'root',
  storage: createElectronStorage({ electronStore }),
  whitelist: ['maps', 'localRunResults', 'suspendedRuns', 'runs'],
  stateReconciler: autoMergeLevel1,
  version: CURRENT_PERSISTED_STORE_VERSION,
};

export default function configureStore() {
  const persistedReducer = persistReducer(persistConfig, rootReducer(persistConfig.storage));
  const middleware = [
    thunkMiddleware,
    promiseMiddleware,
  ];
  const store = createStore(
    persistedReducer,
    applyMiddleware.apply(
      this,
      middleware
    )
  );

  const persistor = persistStore(store, { manualPersist: true });

  initPersistStateReducer(electronStore, persistConfig, persistor);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./root-reducer', () => {
      /* eslint-disable global-require */
      const nextRootReducer = require('./root-reducer').default;
      /* eslint-enable global-require */
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
