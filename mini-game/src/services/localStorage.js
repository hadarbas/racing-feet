export function getObject(key) {
  const raw = localStorage.getItem(key);
  
  if (!raw) {
    return raw;
  }

  return JSON.parse(raw);
}

export function setObject(key, value) {
  console.debug('setObject', key, value);
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeObject(key) {
  localStorage.removeItem(key);
}