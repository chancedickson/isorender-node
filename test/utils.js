const _ = require("ramda"),
  uuid = require("uuid/v4"),
  {Readable, Writable} = require("stream");

function randomFloat(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

function randomInt(min = 0, max = 1) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genNum() {
  return Math.random() * 100;
}

function genList() {
  return _.map(genNum, _.range(0, 10));
}

function genBool() {
  return randomInt() === 1;
}

function genObject() {
  return {
    str: uuid(),
    num: genNum(),
    arr: genList(),
    bool: genBool(),
    n: null
  };
}

function genJSON() {
  return Object.assign({}, genObject(), {obj: genObject()});
}

function DummyReadable(xs) {
  return new Readable({
    read() {}
  });
}

function DummyWritable() {
  return new Writable({
    write(chunk, encoding, cb) {
      this.emit("data", chunk);
      cb();
    },
    writev(chunks, cb) {
      chunks.forEach((chunk) => this.emit("data", chunk));
      cb();
    }
  });
}

module.exports = {genJSON, genObject, genBool, genList, genNum, randomFloat, randomInt, DummyReadable, DummyWritable};
