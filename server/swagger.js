// server/swagger.js

import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Plataforma SFTIC API",
      version: "1.0.0",
      description: "Documentação Swagger da API da Plataforma SFTIC",
    },
    servers: [
      {
        url: API_URL,
        description:
          process.env.NODE_ENV === "production" ? "Produção" : "Local",
      },
    ],
  },
  apis: [path.join(__dirname, "routes", "*.js")],
};

export const swaggerSpec = swaggerJSDoc(options);