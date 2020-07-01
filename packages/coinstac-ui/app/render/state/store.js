/**
 * Store configuration.
 *
 * This configures the Redux store by adding middleware. See Redux's
 * 'Real World' example:
 *
 * @{@link  https://github.com/rackt/redux/blob/master/examples/real-world/store/configureStore.js}
 *
 * Uses ApolloClient as outlined: https://medium.com/react-weekly/implementing-graphql-in-your-redux-app-dad7acf39e1b
 */
import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
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

export default function (apolloClient) {
  const persistedReducer = persistReducer(persistConfig, rootReducer(apolloClient));

  const store = createStore(
    persistedReducer,
    applyMiddleware(
      apolloClient.middleware(),
      thunkMiddleware,
      promiseMiddleware,
      createLogger({ collapsed: true })
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

    store.dispatch(clearState());
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
