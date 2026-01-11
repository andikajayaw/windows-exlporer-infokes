import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { fileRoutes } from "./routes/fileRoutes";
import { folderRoutes } from "./routes/folderRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { searchRoutes } from "./routes/searchRoutes";

const app = new Elysia()
  .use(cors())
  .use(healthRoutes)
  .use(folderRoutes)
  .use(fileRoutes)
  .use(searchRoutes);

export default app;
