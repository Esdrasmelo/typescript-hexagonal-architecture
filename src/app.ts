require("dotenv");

import { ExpressServer } from "./infrastructure/adapters/api/express/server";

const appPort = Number(process.env.APP_PORT);

new ExpressServer(appPort).server();
