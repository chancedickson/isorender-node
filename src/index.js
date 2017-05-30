"use strict";

const net = require("net"),
  {v4: uuid} = require("uuid");

function FrameBuffer(onFrame) {
  let buffer, frameLength;
  return (data) => {
    if (!buffer) {
      buffer = data;
    } else {
      buffer = Buffer.concat([buffer, data]);
    }
    if (!frameLength && buffer.length >= 4) {
      frameLength = buffer.readInt32BE();
      buffer = buffer.slice(4);
    }
    while (frameLength && buffer.length >= frameLength) {
      const payload = buffer.slice(0, frameLength),
        json = payload.toString("utf8"),
        obj = JSON.parse(json);
      process.nextTick(onFrame, obj);
      if (buffer.length >= 4) {
        frameLength = buffer.readInt32BE();
        buffer = buffer.slice(4);
      } else {
        frameLength = null;
      }
    }
  };
}

function Client(path, timeout = 5000) {
  const client = net.connect(path, onConnect),
    requests = {},
    frameBuffer = FrameBuffer(onFrame);
  let ready = false,
    queue;

  client.on("data", frameBuffer);

  function onFrame(obj) {
    const cb = requests[obj.id];
    if (cb) {
      delete requests[obj.id];
      process.nextTick(cb, null, obj);
    }
  }

  function onConnect() {
    if (queue) {
      client.write(queue);
      queue = null;
    }
    ready = true;
  }

  function startTimeout(id) {
    setTimeout(() => {
      const cb = requests[id];
      if (cb) {
        delete requests[id];
        process.nextTick(cb, TimeoutError());
      }
    }, timeout);
  }

  function send(conn, data, cb) {
    const request = {id: uuid(), conn, data},
      json = JSON.stringify(request),
      payload = Buffer.from(json, "utf8"),
      length = Buffer.allocUnsafe(4);
    length.writeInt32BE(payload.length);
    requests[request.id] = cb;
    if (!ready) {
      queue = queue ?
        Buffer.concat([queue, length, payload]) :
        Buffer.concat([length, payload]);
    } else {
      client.write(Buffer.concat([length, payload]));
    }
    startTimeout(request.id);
    return request;
  }

  function close() {
    return client.end();
  }

  return {send, close};
}

function Server(renderFunc, handleError = (e) => e.toString()) {
  const server = net.createServer(handler);

  function handler(client) {
    const frameBuffer = FrameBuffer(onFrame);
    client.on("data", frameBuffer);

    function render(args, cb) {
      try {
        if (renderFunc.length === 2) {
          return process.nextTick(cb, null, renderFunc(...args));
        }
        process.nextTick(renderFunc, ...args, cb);
      } catch (e) {
        process.nextTick(cb, e);
      }
    }

    function respond(obj) {
      const json = JSON.stringify(obj),
        payload = Buffer.from(json, "utf8"),
        length = Buffer.allocUnsafe(4);
      length.writeInt32BE(payload.length);
      client.write(Buffer.concat([length, payload]));
    }

    function response(id, rendered) {
      return {id, rendered};
    }

    function error(id, error) {
      return {id, error: handleError(error)};
    }

    function onFrame(request) {
      render([request.conn, request.data], (err, rendered) => {
        if (err) {
          return respond(error(request.id, err));
        }
        respond(response(request.id, rendered));
      });
    }
  }

  function listen(...args) {
    return server.listen(...args);
  }

  function close(...args) {
    return server.close(...args);
  }

  return {listen, close};
}

module.exports.Server = Server;
module.exports.Client = Client;
