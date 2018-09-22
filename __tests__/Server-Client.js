'use strict';

const fs = require('fs');
const { promisify } = require('util');
const { v4: uuid } = require('uuid');
const { Server, Client } = require('../src');

const unlink = promisify(fs.unlink);

function randomRequests(num) {
  const ret = [];
  for (let i = 0; i < num; i++) {
    ret.push({
      id: uuid(),
      conn: { path: `/${i}` },
      data: { name: 'world' }
    });
  }
  return ret;
}

describe('Server/Client sync rendering', () => {
  const requestAmount = 64;
  let server = null;
  let client = null;
  
  afterEach(async () => {
    client.close();
    server.close();
  });

  test('should render synchronously', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data) => {
      return `Hello, ${data.name}! You went to ${conn.path}.`;
    });

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.rendered).toEqual(`Hello, ${requestData.data.name}! You went to ${requestData.conn.path}.`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });

  test('should render asynchronously', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data, cb) => {
      process.nextTick(cb, null, `Hello, ${data.name}! You went to ${conn.path}.`);
    });

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.rendered).toEqual(`Hello, ${requestData.data.name}! You went to ${requestData.conn.path}.`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });

  test('should error synchronously', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data) => {
      throw `Error on ${conn.path}! Sorry, ${data.name} :(`;
    });

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.error).toBe(`Error on ${requestData.conn.path}! Sorry, ${requestData.data.name} :(`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });

  test('should error asynchronously', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data, cb) => {
      process.nextTick(cb, `Error on ${conn.path}! Sorry, ${data.name} :(`);
    });

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.error).toBe(`Error on ${requestData.conn.path}! Sorry, ${requestData.data.name} :(`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });

  test('should error synchronously with custom error', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data) => {
      throw `Error on ${conn.path}! Sorry, ${data.name} :(`;
    }, e => `${e} - Custom`);

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.error).toBe(`Error on ${requestData.conn.path}! Sorry, ${requestData.data.name} :( - Custom`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });

  test('should error asynchronously', async () => {
    expect.assertions(requestAmount * 3);
    const requests = randomRequests(requestAmount);

    server = Server((conn, data, cb) => {
      process.nextTick(cb, `Error on ${conn.path}! Sorry, ${data.name} :(`);
    }, e => `${e} - Custom`);

    return new Promise(resolve => {
      server.listen('/tmp/isorender-test.sock', () => {
        let i = 0;
        client = Client('/tmp/isorender-test.sock');

        requests.forEach(requestData => {
          const request = client.send(requestData.conn, requestData.data, (err, response) => {
            expect(err).toBeNull();
            expect(response.id).toEqual(request.id);
            expect(response.error).toBe(`Error on ${requestData.conn.path}! Sorry, ${requestData.data.name} :( - Custom`);
            if (++i === requestAmount) {
              resolve();
            }
          });
        });
      });
    });
  });
});
