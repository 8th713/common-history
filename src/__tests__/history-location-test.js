jest.dontMock('../history-location');

require('babel/polyfill');

const HistoryLocation = require('../history-location');

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

describe('historyLocation', function() {
  let historyLocation;

  beforeEach(function() {
    location.href = 'http://example.com/path/to';
    historyLocation = new HistoryLocation();
  })

  afterEach(function() {
    Spy.restoreAll();
    historyLocation.dispose();
  })

  describe('#current', function() {
    it('indicate pathname + search of current location', function() {
      expect(historyLocation.current).toBe('/path/to');
      location.href = '/foo/bar';
      expect(historyLocation.current).toBe('/foo/bar');
      location.search = '?q=baz';
      expect(historyLocation.current).toBe('/foo/bar?q=baz');
    })
  })

  describe('#addListener(listener:Listener)', function() {
    beforeEach(function() {
      this.spy = Spy.create(window, 'addEventListener');
    })

    it('add listener to _listeners', function() {
      let func;

      func = ()=>{};
      historyLocation.addListener(func);
      expect(historyLocation._listeners.size).toBe(1);
      expect(historyLocation._listeners.has(func)).toBe(true);

      func = ()=>{};
      historyLocation.addListener(func);
      expect(historyLocation._listeners.size).toBe(2);
      expect(historyLocation._listeners.has(func)).toBe(true);
    })

    it('set true the _isListening', function() {
      let func;

      func = ()=>{};
      historyLocation.addListener(func);
      expect(historyLocation._isListening).toBe(true);
    })

    it('call addEventListener, if _isListening is false', function() {
      let func;

      func = ()=>{};
      historyLocation.addListener(func);
      expect(this.spy).toBeCalledWith('popstate', historyLocation, false);
      expect(historyLocation._isListening).toBe(true);

      func = ()=>{};
      historyLocation.addListener(func);
      expect(this.spy.mock.calls.length).toBe(1);
    })
  })

  describe('#removeListener(listener:Listener)', function() {
    beforeEach(function() {
      Spy.create(window, 'addEventListener');
      this.spy = Spy.create(window, 'removeEventListener');
    })

    it('remove listener to _listeners', function() {
      let func1 = ()=>{};
      let func2 = ()=>{};
      historyLocation.addListener(func1);
      historyLocation.addListener(func2);

      historyLocation.removeListener(func1);
      expect(historyLocation._listeners.size).toBe(1);
      expect(historyLocation._listeners.has(func1)).toBe(false);
      historyLocation.removeListener(func2);
      expect(historyLocation._listeners.size).toBe(0);
      expect(historyLocation._listeners.has(func2)).toBe(false);
    })

    it('set false the _isListening, if _listeners.size === 0', function() {
      let func;

      func = ()=>{};
      historyLocation.addListener(func);
      expect(historyLocation._listeners.size).toBe(1);
      expect(historyLocation._isListening).toBe(true);

      historyLocation.removeListener(func);
      expect(historyLocation._listeners.size).toBe(0);
      expect(historyLocation._isListening).toBe(false);
    })

    it('call removeEventListener, if _listeners.size === 0', function() {
      let func;

      func = ()=>{};
      historyLocation.addListener(func);
      historyLocation.removeListener(func);
      expect(this.spy).toBeCalledWith('popstate', historyLocation, false);
    })
  })

  describe('#emit(type:string)', function() {
    beforeEach(function() {
      Spy.create(window, 'addEventListener');
    })

    it('each call listener with Change', function() {
      let type = 'POP';
      let count = 0;

      historyLocation.addListener(function(change) {
        count++;
        expect(change).toEqual({type, path: historyLocation.current});
      });
      historyLocation.addListener(function(change) {
        count++;
        expect(change).toEqual({type, path: historyLocation.current});
      });

      historyLocation.emit(type);
      expect(count).toBe(2);
    })
  })

  describe('#push(path:string)', function() {
    beforeEach(function() {
      this.pushState = Spy.create(window.history, 'pushState');
      this.emit = Spy.create(historyLocation, 'emit');
    })

    it('call window.history.pushState', function() {
      let path;

      path = '/file/name';
      historyLocation.push(path);
      expect(this.pushState).toBeCalledWith({path}, '', path);

      path = '/foo/bar';
      historyLocation.push(path);
      expect(this.pushState).toBeCalledWith({path}, '', path);
    })

    it('increment _length', function() {
      expect(historyLocation._length).toBe(1);
      historyLocation.push('/file/name');
      expect(historyLocation._length).toBe(2);
      historyLocation.push('/foo/bar');
      expect(historyLocation._length).toBe(3);
    })

    it('call emit with PUSH', function() {
      historyLocation.push('/file/name');
      expect(this.emit).toBeCalledWith('PUSH');
    })
  })

  describe('#replace(path:string)', function() {
    beforeEach(function() {
      this.replaceState = Spy.create(window.history, 'replaceState');
      this.emit = Spy.create(historyLocation, 'emit');
    })

    it('call window.history.replaceState', function() {
      let path;

      path = '/file/name';
      historyLocation.replace(path);
      expect(this.replaceState).toBeCalledWith({path}, '', path);

      path = '/foo/bar';
      historyLocation.replace(path);
      expect(this.replaceState).toBeCalledWith({path}, '', path);
    })

    it('does not change _length', function() {
      expect(historyLocation._length).toBe(1);
      historyLocation.replace('/file/name');
      expect(historyLocation._length).toBe(1);
      historyLocation.replace('/foo/bar');
      expect(historyLocation._length).toBe(1);
    })

    it('call emit with REPLACE', function() {
      historyLocation.replace('/file/name');
      expect(this.emit).toBeCalledWith('REPLACE');
    })
  })

  describe('#pop()', function() {
    beforeEach(function() {
      this.spy = Spy.create(window.history, 'back');
    })

    it('call window.history.back', function() {
      historyLocation.pop();
      expect(this.spy.mock.calls.length).toBe(1);
      historyLocation.pop();
      expect(this.spy.mock.calls.length).toBe(2);
    })

    it('decrement _length', function() {
      historyLocation._length = 3;
      historyLocation.pop();
      expect(historyLocation._length).toBe(2);
      historyLocation.pop();
      expect(historyLocation._length).toBe(1);
    })
  })

  describe('#handleEvent(event:PopStateEvent)', function() {
    beforeEach(function() {
      this.spy = Spy.create(historyLocation, 'emit');
    })

    it('call emit with POP', function() {
      const event = {state: {path: historyLocation.current}};

      historyLocation.handleEvent(event);
      expect(this.spy).toBeCalledWith('POP');
    })

    it('not call emit, if state is undefined', function() {
      const event = {state: undefined};

      historyLocation.handleEvent(event);
      expect(this.spy).not.toBeCalled();
    })
  })
})
