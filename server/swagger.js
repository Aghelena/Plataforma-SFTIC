import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minha API",
      version: "1.0.0",
      description: "Documentação Swagger da API",
    },
    servers: [{ url: "http://localhost:5001", description: "Local" }],
  },
  apis: [path.join(__dirname, "routes", "*.js")], 
};

export const swaggerSpec = swaggerJSDoc(options);