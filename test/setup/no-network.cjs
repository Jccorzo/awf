// Preloaded with NODE_OPTIONS=--require into processes the tests spawn, so they run with the network blocked too.
const dns = require('node:dns');
const net = require('node:net');
const tls = require('node:tls');

function blocked(what) {
  throw new Error(`Network access is blocked in tests (${what}). awf must not use the network.`);
}

net.Socket.prototype.connect = () => blocked('net.Socket.connect');
net.connect = () => blocked('net.connect');
net.createConnection = () => blocked('net.createConnection');
tls.connect = () => blocked('tls.connect');
dns.lookup = () => blocked('dns.lookup');
dns.resolve = () => blocked('dns.resolve');
globalThis.fetch = () => blocked('fetch');
