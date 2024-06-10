import ElectronStore from 'electron-store';
import createElectronStorage from 'redux-persist-electron-storage';

const electronStore = new ElectronStore();

const storage = createElectronStorage({ electronStore });

export { electronStore, storage };
