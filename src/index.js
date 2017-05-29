"use strict";

const net = require("net");

function Handler(renderFunc, handleError = (e) => e.toString()) {
  return (socket) => {
    function render(args, cb) {
      try {
        if (renderFunc.length === 2) {
          return process.nextTick(cb, null, renderFunc.apply(null, args));
        }
        process.nextTick(() => renderFunc(...args, cb));
      } catch (e) {
        process.nextTick(cb, e);
      }
    }

    function respond(o) {
      const payload = Buffer.from(JSON.stringify(o), "utf8"),
        length = Buffer.allocUnsafe(4);
      length.writeInt32BE(payload.length);
      socket.write(Buffer.concat([length, payload]));
    }

    function response(id, rendered) {
      return {id, rendered};
    }

    function error(id, error) {
      return {id, error: handleError(error)};
    }

    function handle(frame) {
      const {id, conn, data} = JSON.parse(frame.toString("utf8"));
      render([conn, data], (err, rendered) => {
        if (err) {
          return respond(error(id, err));
        }
        return respond(response(id, rendered));
      });
    }

    let buffer, frameLength;
    socket.on("data", (buf) => {
      if (!buffer) {
        buffer = buf;
      } else {
        buffer = Buffer.concat([buffer, buf]);
      }
      if (!frameLength && buffer.length >= 4) {
        frameLength = buffer.readInt32BE();
        buffer = buffer.slice(4);
      }
      while (frameLength && buffer.length >= frameLength) {
        const frame = buffer.slice(0, frameLength);
        handle(frame);
        buffer = buffer.slice(frameLength);
        frameLength = null;
        if (buffer.length >= 4) {
          frameLength = buffer.readInt32BE();
          buffer = buffer.slice(4);
        }
      }
    });
  };
}

function Server(renderFunc, handleError) {
  return net.createServer(Handler(renderFunc, handleError));
}

module.exports.Server = Server;
module.exports.Handler = Handler;
