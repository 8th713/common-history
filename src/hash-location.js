'use strict';

module.exports = class HashLocation {
  constructor() {
    this._length = 1;
    this._lastAction = null;
    this._listeners = new Set();
    this._isListening = false;
  }

  get current() {
    return decodeURI(
      window.location.href.split('#')[1] || ''
    );
  }

  dispose() {
    this._length = 1;
    this._lastAction = null;
    this._listeners.clear();
    this._isListening = false;
    window.removeEventListener('hashchange', this, false);
  }

  addListener(listener) {
    if (this._hasSlash) {
      this._listeners.add(listener);
      if (!this._isListening) {
        window.addEventListener('hashchange', this, false);
        this._isListening = true;
      }
    } else {
      this._ensureSlash().then(() => {
        this.addListener(listener);
      });
    }
  }

  removeListener(listener) {
    this._listeners.delete(listener);
    if (this._listeners.size === 0) {
      window.removeEventListener('hashchange', this, false);
      this._isListening = false;
    }
  }

  emit(type) {
    if (type === 'PUSH') {
      this._length += 1;
    }

    const change = {path: this.current, type};

    for (let listener of this._listeners) {
      listener.call(this, change);
    }
  }

  handleEvent() {
    if (this._hasSlash) {
      this.emit(this._lastAction || 'POP');
      this._lastAction = null;
    } else {
      this._ensureSlash();
    }
  }

  push(path) {
    this._lastAction = 'PUSH';
    window.location.hash = path;
  }

  replace(path) {
    this._lastAction = 'REPLACE';
    window.location.replace(
      window.location.pathname + window.location.search + '#' + path
    );
  }

  pop() {
    this._lastAction = 'POP';
    this._length -= 1;
    window.history.back();
  }

  get _hasSlash() {
    return this.current.charAt(0) === '/';
  }

  _ensureSlash() {
    const current = this.current;

    this.replace('/' + current);
    return new Promise(done => {
      const checkSlash = () => {
        if (this._hasSlash) {
          done();
        } else {
          process.nextTick(checkSlash);
        }
      };

      checkSlash();
    });
  }
}
