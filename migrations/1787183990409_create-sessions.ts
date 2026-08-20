import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    token_family_id: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },

    refresh_token_hash: {
      type: "text",
      notNull: true,
      unique: true,
    },

    user_agent: {
      type: "text",
    },

    ip_hash: {
      type: "text",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    last_used_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    expires_at: {
      type: "timestamptz",
      notNull: true,
    },

    revoked_at: {
      type: "timestamptz",
    },
  });

  pgm.createIndex("sessions", "user_id");
  pgm.createIndex("sessions", "token_family_id");
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("sessions");
};
