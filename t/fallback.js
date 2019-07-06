let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "send to fallback",
  actions: [
    { action: 'fallback-send', from: 'A', value: 1000, expectError: 'DERR_UNKNOWN_METHOD', },
  ],
},

]);
