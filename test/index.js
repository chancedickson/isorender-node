"use strict";
const assert = require("assert"),
  net = require("net"),
  fs = require("fs"),
  {v4: uuid} = require("uuid"),
  Isorender = require("../src");

describe("Isorender", function() {
  describe("Server", function() {
    it("should render synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        return `Hello, ${data.name}! You went to ${conn.path}!`;
      }, {sync: true});
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, rendered} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(rendered === "Hello, world! You went to /test!");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });

    it("should render asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        cb(null, `Hello, ${data.name}! You went to ${conn.path}!`);
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, rendered} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(rendered === "Hello, world! You went to /test!");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });

    it("should render error synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        throw "Error!";
      }, {sync: true});
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, error} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(error === "Error!");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });

    it("should render error asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        cb("Error!");
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, error} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(error === "Error!");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });

    it("should handle error synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        throw new Error("Error!");
      }, {sync: true, handleError: (e) => "Test handle"});
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, error} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(error === "Test handle");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });

    it("should handle error asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        cb(new Error("Error!"));
      }, {handleError: (e) => "Test handle"});
      server.listen("/tmp/isorender-test.sock", () => {
        const req = {id: uuid(), data: {name: "world"}, conn: {path: "/test"}},
          client = net.connect("/tmp/isorender-test.sock", () => {
            const payload = Buffer.from(JSON.stringify(req), "utf8"),
              length = Buffer.allocUnsafe(4);
            length.writeInt32BE(payload.length);
            client.write(Buffer.concat([length, payload]));
          });
        let buffer, frameLength;
        client.on("data", (data) => {
          if (!buffer) {
            buffer = data;
          } else {
            buffer = Buffer.concat([buffer, data]);
          }
          if (!frameLength && buffer.length >= 4) {
            frameLength = buffer.readInt32BE();
            buffer = buffer.slice(4);
          }
          if (frameLength && frameLength === buffer.length) {
            const {id, error} = JSON.parse(buffer.toString("utf8"));
            assert(req.id === id);
            assert(error === "Test handle");
            client.end();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          }
        });
      });
    });
  });
});
