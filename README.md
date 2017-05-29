# Isorender
Add isomorphic rendering to any server, regardless of language.

## Server
```javascript
const {Server} = require("isorender");

// You can use Isorender synchronously...
const server = Server((conn, data) => {
  return `Hello, ${data.name}! You went to ${conn.path}!`;
});

// ...or asynchronously.
const server = Server((conn, data, cb) => {
  setTimeout(() => {
    cb(null, `Hello, ${data.name}! You went to ${conn.path}!`);
  }, 2500);
});


// You can also override the default error handling function.
const server = Server((conn, data) => {
  throw new Error("This could be sensitive information!");
}, (e) => "But it's okay because this is what will be sent.");

// Isorender is best used with some sort of rendering framework.
const server = Server((conn, data) => {
  return ReactDOMServer.renderToString(<App path={conn.path} data={data} />);
});

server.listen(8080, () => console.log("Listening on port 8080"));
```

## Protocol
The Isorender protocol consists of a length-prefixed JSON payload. The length
prefix is always a 32-bit integer in big endian. The JSON payload should be
encoded in `utf8`.

### Request
A request will be in the following format.
```json
{
  "id": "random UUIDv4",
  "conn": {...},
  "data": {...}
}
```

`conn` is information based on the request you will be rendering for. It should
be in the following format.
```json
{
  "host": "HTTP host of the request",
  "path": "HTTP path of the request",
  "query": "HTTP query parameters"
}
```

`data` is an arbitrary object provided to the client. For example, this could
consist of data retrieved from a database.

### Response
A response can be in one of two formats.

```json
{
  "id": "UUIDv4 sent in the request",
  "rendered": "Rendered markup"
}
```

```json
{
  "id": "UUIDv4 sent in the request",
  "error": "Error string"
}
```

If the request was successfully rendered, the rendered markup will be in the
`rendered` key of the response. If it was not successful, a string representing
the error will be in the `error` key of the response. The `id` of the response
should be used to match with the `id` of the request to determine which request
the response is for. The Isorender server does not respond to requests in the
order they are received, so the responses could be out of order.
