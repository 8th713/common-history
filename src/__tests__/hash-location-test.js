jest.dontMock('../hash-location');

require('babel/polyfill');

const HashLocation = require('../hash-location');

const Spy = {
  items: new Set(),
  create(obj, name) {
    let org = obj[name];
    let spy = jest.genMockFunction();

    spy.restore = () => {
      obj[name] = org;
    }

    obj[name] = spy;
    Spy.items.add(spy);
    return spy;
  },
  restoreAll() {
    for(let spy of Spy.items) {
      spy.restore();
    }
    Spy.items = new Set();
  }
}

describe('HashLocation', function() {
  let hashLocation;

  beforeEach(function() {
    hashLocation = new HashLocation();
    location.href = 'http://example.com/path/to';
  })

  afterEach(function() {
    Spy.restoreAll();
    hashLocation.dispose();
  })

  describe('#current', function() {
    it('indicate hash of current location', function() {
      expect(hashLocation.current).toBe('');
      location.hash = '/foo/bar';
      expect(hashLocation.current).toBe('/foo/bar');
      location.hash += '?q=baz';
      expect(hashLocation.current).toBe('/foo/bar?q=baz');
    })
  })

  describe('#addListener(listener:Listener)', function() {
    beforeEach(function() {
      this.spy = Spy.create(window, 'addEventListener');
    })

    describe('if _hasSlash is true', function() {
      beforeEach(function() {
        location.hash = '/path/to';
        jest.runAllTicks();
        expect(hashLocation._hasSlash).toBe(true);
      })

      it('add listener to _listeners', function() {
        let func;

        func = ()=>{};
        hashLocation.addListener(func);
        expect(hashLocation._listeners.size).toBe(1);
        expect(hashLocation._listeners.has(func)).toBe(true);

        func = ()=>{};
        hashLocation.addListener(func);
        expect(hashLocation._listeners.size).toBe(2);
        expect(hashLocation._listeners.has(func)).toBe(true);
      })

      it('set true the _isListening', function() {
        let func;

        func = ()=>{};
        hashLocation.addListener(func);
        expect(hashLocation._isListening).toBe(true);
      })

      it('call addEventListener, if _isListening is false', function() {
        let func;

        func = ()=>{};
        hashLocation.addListener(func);
        expect(this.spy).toBeCalledWith('hashchange', hashLocation, false);
        expect(hashLocation._isListening).toBe(true);

        func = ()=>{};
        hashLocation.addListener(func);
        expect(this.spy.mock.calls.length).toBe(1);
      })
    })

    describe('if _hasSlash is false', function() {
      beforeEach(function() {
        expect(hashLocation._hasSlash).toBe(false);
      })

      afterEach(function() {
        jest.runAllTicks();
      })

      it('does not execute the listener additional processing', function() {
        let func;

        func = ()=>{};
        hashLocation.addListener(func);
        expect(hashLocation._listeners.size).toBe(0);
        expect(hashLocation._listeners.has(func)).toBe(false);
        expect(hashLocation._isListening).toBe(false);
        expect(this.spy).not.toBeCalled();
      })

      it('call _ensureSlash', function() {
        const func = ()=>{};
        const spy = Spy.create(hashLocation, '_ensureSlash');

        spy.mockImplementation(() => Promise.reject());
        hashLocation.addListener(func);
        expect(spy).toBeCalled();
      })

      it('re-execute itself, when _ensureSlash\'s resolved', function() {
        const func = ()=>{};

        expect(hashLocation._listeners.size).toBe(0);
        hashLocation.addListener(func);
        expect(hashLocation._listeners.size).toBe(0);

        const spy = Spy.create(hashLocation, 'addListener');

        jest.runAllTicks(); // resolve _ensureSlash.
        expect(spy).toBeCalledWith(func);
      })
    })
  })

  describe('#removeListener(listener:Listener)', function() {
    beforeEach(function() {
      location.hash = '/path/to';
      jest.runAllTicks();
      Spy.create(window, 'addEventListener');
      this.spy = Spy.create(window, 'removeEventListener');
    })

    it('remove listener to _listeners', function() {
      let func1 = ()=>{};
      let func2 = ()=>{};
      hashLocation.addListener(func1);
      hashLocation.addListener(func2);

      hashLocation.removeListener(func1);
      expect(hashLocation._listeners.size).toBe(1);
      expect(hashLocation._listeners.has(func1)).toBe(false);
      hashLocation.removeListener(func2);
      expect(hashLocation._listeners.size).toBe(0);
      expect(hashLocation._listeners.has(func2)).toBe(false);
    })

    it('set false the _isListening, if _listeners.size === 0', function() {
      let func;

      func = ()=>{};
      hashLocation.addListener(func);
      expect(hashLocation._listeners.size).toBe(1);
      expect(hashLocation._isListening).toBe(true);

      hashLocation.removeListener(func);
      expect(hashLocation._listeners.size).toBe(0);
      expect(hashLocation._isListening).toBe(false);
    })

    it('call removeEventListener, if _listeners.size === 0', function() {
      let func;

      func = ()=>{};
      hashLocation.addListener(func);
      hashLocation.removeListener(func);
      expect(this.spy).toBeCalledWith('hashchange', hashLocation, false);
    })
  })

  describe('#emit(type:string)', function() {
    beforeEach(function() {
      location.hash = '/path/to';
      jest.runAllTicks();
      Spy.create(window, 'addEventListener');
    })

    it('each call listener with Change', function() {
      let type = 'POP';
      let count = 0;

      hashLocation.addListener(function(change) {
        count++;
        expect(change).toEqual({type, path: hashLocation.current});
      });
      hashLocation.addListener(function(change) {
        count++;
        expect(change).toEqual({type, path: hashLocation.current});
      });

      hashLocation.emit(type);
      expect(count).toBe(2);
    })

    it('increment _length if type === PUSH', function() {
      hashLocation.emit('PUSH');
      expect(hashLocation._length).toBe(2);
      hashLocation.emit('PUSH');
      expect(hashLocation._length).toBe(3);
    })
  })

  describe('#push(path:string)', function() {
    it('update location.hash with the path', function() {
      let path;

      path = '/file/name';
      hashLocation.push(path);
      expect(location.hash).toBe('#/file/name');

      path = '/foo/bar';
      hashLocation.push(path);
      expect(location.hash).toBe('#/foo/bar');
    })

    it('set PUSH to _lastAction', function() {
      expect(hashLocation._lastAction).toBe(null);
      hashLocation.push('/file/name');
      expect(hashLocation._lastAction).toBe('PUSH');
      hashLocation.push('/foo/bar');
      expect(hashLocation._lastAction).toBe('PUSH');
    })
  })

  describe('#replace(path:string)', function() {
    beforeEach(function() {
      this.replace = Spy.create(window.location, 'replace');
    })

    it('call window.location.replace', function() {
      let path;

      path = '/file/name';
      hashLocation.replace(path);
      expect(this.replace).toBeCalledWith('/path/to#/file/name');

      path = '/foo/bar';
      hashLocation.replace(path);
      expect(this.replace).toBeCalledWith('/path/to#/foo/bar');
    })

    it('set REPLACE to _lastAction', function() {
      expect(hashLocation._lastAction).toBe(null);
      hashLocation.replace('/file/name');
      expect(hashLocation._lastAction).toBe('REPLACE');
      hashLocation.replace('/foo/bar');
      expect(hashLocation._lastAction).toBe('REPLACE');
    })
  })

  describe('#pop()', function() {
    beforeEach(function() {
      this.spy = Spy.create(window.history, 'back');
    })

    it('call window.history.back', function() {
      hashLocation.pop();
      expect(this.spy.mock.calls.length).toBe(1);
      hashLocation.pop();
      expect(this.spy.mock.calls.length).toBe(2);
    })

    it('decrement _length', function() {
      hashLocation._length = 3;
      hashLocation.pop();
      expect(hashLocation._length).toBe(2);
      hashLocation.pop();
      expect(hashLocation._length).toBe(1);
    })

    it('set POP to _lastAction', function() {
      expect(hashLocation._lastAction).toBe(null);
      hashLocation.pop();
      expect(hashLocation._lastAction).toBe('POP');
      hashLocation.pop();
      expect(hashLocation._lastAction).toBe('POP');
    })
  })

  describe('#handleEvent()', function() {
    beforeEach(function() {
      this.spy = Spy.create(hashLocation, 'emit');
    })

    describe('if _hasSlash is true', function() {
      beforeEach(function() {
        location.hash = '/path/to';
        jest.runAllTicks();
        expect(hashLocation._hasSlash).toBe(true);
      })

      it('call emit with _lastAction or POP', function() {
        expect(hashLocation._lastAction).toBe(null);
        hashLocation.handleEvent();
        expect(this.spy).toBeCalledWith('POP');

        hashLocation._lastAction = 'PUSH';
        hashLocation.handleEvent();
        expect(this.spy).toBeCalledWith('PUSH');
      })

      it('set null to _lastAction', function() {
        hashLocation._lastAction = 'PUSH';
        hashLocation.handleEvent();
        expect(hashLocation._lastAction).toBe(null);

        hashLocation._lastAction = 'POP';
        hashLocation.handleEvent();
        expect(hashLocation._lastAction).toBe(null);
      })
    })

    describe('if _hasSlash is false', function() {
      beforeEach(function() {
        this.spy2 = Spy.create(hashLocation, '_ensureSlash');
        expect(hashLocation._hasSlash).toBe(false);
      })

      it('not call emit', function() {
        hashLocation.handleEvent();
        expect(this.spy).not.toBeCalled();
      })

      it('not update _lastAction', function() {
        hashLocation._lastAction = 'POP';
        hashLocation.handleEvent();
        expect(hashLocation._lastAction).toBe('POP');
      })

      it('call _ensureSlash', function() {
        hashLocation.handleEvent();
        expect(this.spy2).toBeCalled();
      })
    })
  })
})
