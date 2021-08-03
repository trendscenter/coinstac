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
import { dirname, join } from 'path';
import { ipcRenderer, remote } from 'electron';
import rootReducer, { clearState, rehydrate } from './root-reducer';

const ElectronStore = require('electron-store');
const { deepParseJson } = require('deep-parse-json');

const electronStore = new ElectronStore();

const persistConfig = {
  key: 'root',
  storage: createElectronStorage({ electronStore }),
  whitelist: ['maps', 'localRunResults'],
};

/* async function loadPersistedState(userId, persistor, store) {
  const electronStoreFolder = dirname(electronStore.path);
  electronStore.path = join(electronStoreFolder, `local-db-${userId}.json`);

  const data = await persistConfig.storage.getItem('persist:root');
  persistor.persist();

  // Rehydrate is done only once by redux-persist, so we do it manually
  // for hydrating state on consecutive logins
  if (data) {
    const parsedState = deepParseJson(data);

    delete parsedState._persist;

    store.dispatch(rehydrate(parsedState));
  }
} */

export default function () {
  const persistedReducer = persistReducer(persistConfig, rootReducer());
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

  ipcRenderer.on('login-success', async (event, userId) => {
    const electronStoreFolder = dirname(electronStore.path);
    electronStore.path = join(electronStoreFolder, `local-db-${userId}.json`);

    const data = await persistConfig.storage.getItem('persist:root');
    persistor.persist();

    // Rehydrate is done only once by redux-persist, so we do it manually
    // for hydrating state on consecutive logins
    if (data) {
      const parsedState = deepParseJson(data);

      delete parsedState._persist;

      store.dispatch(rehydrate(parsedState));
    }

    remote.getCurrentWindow().webContents.send('app-init-finished');
  });

  ipcRenderer.on('logout', () => {
    persistor.pause();

    // clear persisted state
    store.dispatch(clearState({
      maps: null,
      localRunResults: null,
    }));
  });

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
