// Every test runs with network access blocked: any attempt to open a socket,
// resolve a host or call fetch throws, so a network call anywhere in awf fails the suite.
import dns from 'node:dns';
import net from 'node:net';
import tls from 'node:tls';

function blocked(what: string): never {
  throw new Error(`Network access is blocked in tests (${what}). awf must not use the network.`);
}

net.Socket.prototype.connect = function connect() {
  blocked('net.Socket.connect');
} as typeof net.Socket.prototype.connect;
net.connect = (() => blocked('net.connect')) as typeof net.connect;
net.createConnection = (() => blocked('net.createConnection')) as typeof net.createConnection;
tls.connect = (() => blocked('tls.connect')) as typeof tls.connect;
dns.lookup = (() => blocked('dns.lookup')) as unknown as typeof dns.lookup;
dns.resolve = (() => blocked('dns.resolve')) as unknown as typeof dns.resolve;
globalThis.fetch = (() => blocked('fetch')) as typeof fetch;
