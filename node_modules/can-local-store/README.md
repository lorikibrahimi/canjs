# can-local-store

[![Build Status](https://travis-ci.org/canjs/can-local-store.svg?branch=master)](https://travis-ci.org/canjs/can-local-store)

A localStorage database for the client

## Usage

### ES6 use

With StealJS, you can import this module directly in a template that is autorendered:

```js
import plugin from 'can-local-store';
```

### CommonJS use

Use `require` to load `can-local-store` and everything else
needed to create a template that uses `can-local-store`:

```js
var plugin = require("can-local-store");
```

### Standalone use

Load the `global` version of the plugin:

```html
<script src='./node_modules/can-local-store/dist/global/can-local-store.js'></script>
```
