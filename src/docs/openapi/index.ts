import { paths } from "./paths.js";
import { schemas } from "./schemas.js";

export const openApiDocument = {
  openapi: "3.0.3",

  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description:
      "Reusable authentication and session management microservice.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],

  tags: [
    {
      name: "Auth",
      description: "Authentication and credential management",
    },
    {
      name: "Sessions",
      description: "User session management",
    },
    {
      name: "System",
      description: "Service infrastructure endpoints",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas,
  },

  paths,
};