# common-history
Consistent API of HTML5 history API and hash fragments control.

## Installation
```sh
npm install common-history
```

## Usage
common-history consist of `HashLocation` and `HistoryLocation`.
It provides same interface.

- `HashLocation` is wrap hash fragments control.
- `HistoryLocation` is wrap HTML5 history API.

```js
// ececute http://example.com/
import {HashLocation} from 'common-history';

const hashLocation = new HashLocation();

// It is executed each time the location is changed.
hashLocation.addListener(changes => {
  let {path, type} = changes;
  console.log('current path:' + path);
  console.log('transition type:' + type);
  console.log(location.href);
});

hashLocation.push('/path/to');
// current path: /path/to
// transition type: PUSH
// http://example.com/#/path/to
```

### #current
(string): The path of current location. In hashLocation deal with hash fragments.

### #addListener(listener)
Adds a function to be called by a location changes. 

1. **listener (function)**: The listener of location changes.

Listener is executed when the following:

- In HashLocation when `hashchange` event was dispatched.
- In HistoryLocation when `popstate` event was dispatched.
- In HistoryLocation when execute of `push` and `replace`.

### #removeListener(listener)
Stop calling the given function.

1. **listener (function)**: The listener of location changes.

### #push(path)
Change the URL in the browser’s location bar without page transition.

1. **path (string)**: The path of destination.

### #replace(path)
Change the URL in the browser’s location bar without page transition. It does not remain in the history.

1. **path (string)**: The path of destination.

### #pop()
Go back one entry in the history.

## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License
MIT License
