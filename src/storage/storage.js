import { storageFactory } from "storage-factory";

/*
 * Helper functions for localStorage and setting/getting items.
 */

const local = storageFactory(() => localStorage);
const session = storageFactory(() => sessionStorage);
const storage = {
  local,
  session
};

const getStorageItem = (name, method = "local") =>
  storage[method].getItem(name);

const getStorageItemJson = (name, method = "local") =>
  JSON.parse(storage[method].getItem(name));

const setStorageItem = (name, value, method = "local") =>
  storage[method].setItem(name, value);

const setStorageItemJson = (name, value, method = "local") =>
  storage[method].setItem(name, JSON.stringify(value));

const removeStorageItem = (name, method = "local") =>
  storage[method].removeItem(name);

export {
  local,
  session,
  getStorageItem,
  getStorageItemJson,
  setStorageItem,
  setStorageItemJson,
  removeStorageItem
};
