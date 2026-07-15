const http = require("http");
const next = require("next");
const fs = require("fs");

const logFile = `${__dirname}/preview-server.runtime.log`;
const log = (message) => fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
process.stdout.write = () => true;
process.stderr.write = () => true;
process.on("uncaughtException", (error) => log(`uncaughtException: ${error.stack || error.message}`));
process.on("unhandledRejection", (error) => log(`unhandledRejection: ${error?.stack || error}`));

const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res);
    })
    .listen(port, () => {
      log(`Preview server ready at http://localhost:${port}`);
    });
});
