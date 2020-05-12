import { storageFactory } from "storage-factory";

const local = storageFactory(() => localStorage);
const session = storageFactory(() => sessionStorage);
const storage = {
  local,
  session
};

const getStorageItem = ( name, method="local" ) => storage[method].getItem(name);
const setStorageItem = (name, value, method="local" ) => storage[method].setItem(name, value);

export {
  local,
  session,
  getStorageItem,
  setStorageItem
};
