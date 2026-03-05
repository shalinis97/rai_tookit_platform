let _counter = 100;

/**
 * Generate a unique ID with an optional prefix.
 * @param {string} prefix - e.g. 'n', 'e', 'wf'
 * @returns {string}
 */
export function genId(prefix = 'id') {
  _counter += 1;
  return `${prefix}-${_counter}-${Date.now().toString(36)}`;
}
