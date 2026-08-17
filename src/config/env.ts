import "dotenv/config";

const port = Number(process.env.PORT);

if (!port) {
  throw new Error("PORT environment variable is required");
}

export const env = {
  port,
};