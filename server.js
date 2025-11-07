const http = require("http");
const https = require("https");
const fs = require("fs");
const app = require("./app"); // ✅ import the actual app

const HTTP_PORT = 3000;
const HTTPS_PORT = 4433;

const options = {
  key: fs.readFileSync("certs/server.key"),
  cert: fs.readFileSync("certs/server.crt")
};

// HTTP server
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP server running at http://localhost:${HTTP_PORT}`);
});

// HTTPS server
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log(`🔒 HTTPS server running at https://localhost:${HTTPS_PORT}`);
});
