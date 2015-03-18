'use strict';

module.exports = class HistoryLocation {
  constructor() {
    this._length = 1;
    this._listeners = new Set();
    this._isListening = false;
  }

  get current() {
    return decodeURI(
      window.location.pathname + window.location.search
    );
  }

  dispose() {
    this._length = 1;
    this._listeners.clear();
    this._isListening = false;
    window.removeEventListener('popstate', this, false);
  }

  addListener(listener) {
    this._listeners.add(listener);
    if (!this._isListening) {
      window.addEventListener('popstate', this, false);
      this._isListening = true;
    }
  }

  removeListener(listener) {
    this._listeners.delete(listener);
    if (this._listeners.size === 0) {
      window.removeEventListener('popstate', this, false);
      this._isListening = false;
    }
  }

  emit(type) {
    const change = {path: this.current, type};

    for (let listener of this._listeners) {
      listener.call(this, change);
    }
  }

  handleEvent(event) {
    if (event.state === undefined) {
      return;
    }
    this.emit('POP');
  }

  push(path) {
    window.history.pushState({ path }, '', path);
    this._length += 1;
    this.emit('PUSH');
  }

  replace(path) {
    window.history.replaceState({ path }, '', path);
    this.emit('REPLACE');
  }

  pop() {
    this._length -= 1;
    window.history.back();
  }
}
