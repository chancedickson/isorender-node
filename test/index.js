"use strict";
const assert = require("assert"),
  net = require("net"),
  fs = require("fs"),
  {v4: uuid} = require("uuid"),
  Isorender = require("../src");

describe("Isorender", function() {
  describe("Server/Client", function() {
    it("should render synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        return `Hello, ${data.name}! You went to ${conn.path}!`;
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.rendered === "Hello, world! You went to /test!");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });

    it("should render asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        cb(null, `Hello, ${data.name}! You went to ${conn.path}!`);
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.rendered === "Hello, world! You went to /test!");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });

    it("should respond error synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        throw new Error("Error!");
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.error === "Error: Error!");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });

    it("should respond error asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        process.nextTick(cb, new Error("Error!"));
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.error === "Error: Error!");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });

    it("should respond custom error synchronously", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        throw new Error("Error!");
      }, (e) => `${e.toString()} custom`);
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.error === "Error: Error! custom");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });

    it("should respond custom error asynchronously", function(cb) {
      const server = Isorender.Server(function(conn, data, cb) {
        process.nextTick(cb, new Error("Error!"));
      }, (e) => `${e.toString()} custom`);
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        const request = client.send({path: "/test"}, {name: "world"}, (err, response) => {
          assert(request.id === response.id);
          assert(response.error === "Error: Error! custom");
          client.close();
          server.close(() => {
            fs.unlink("/tmp/isorender-test.sock", () => {
              cb();
            });
          });
        });
      });
    });
  });

  describe("Client", function() {
    it("should automatically send after connection", function(cb) {
      const server = Isorender.Server(function(conn, data) {
        return `Hello, ${data.name}! You went to ${conn.path}!`;
      });
      server.listen("/tmp/isorender-test.sock", () => {
        const client = Isorender.Client("/tmp/isorender-test.sock");
        setTimeout(function() {
          const request = client.send({path: "/test"}, {name: "world"}, (err, response) => { assert(request.id === response.id);
            assert(response.rendered === "Hello, world! You went to /test!");
            client.close();
            server.close(() => {
              fs.unlink("/tmp/isorender-test.sock", () => {
                cb();
              });
            });
          });
        }, 5000);
      });
    }).timeout(6000);
  });
});
