const http = require("node:http");
const { readFile } = require("node:fs/promises");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const assets = new Map([
  ["/laid.html", { file: "laid.html", type: "text/html; charset=utf-8" }],
  ["/words.js", { file: "words.js", type: "text/javascript; charset=utf-8" }]
]);

http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  const asset = assets.get(pathname);

  if (!asset) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const body = await readFile(join(root, asset.file));
    response.writeHead(200, { "content-type": asset.type, "cache-control": "no-store" });
    response.end(body);
  } catch (error) {
    console.error(`Unable to serve ${asset.file}:`, error);
    response.writeHead(500);
    response.end("Unable to read game asset.");
  }
}).listen(4173, "127.0.0.1");
