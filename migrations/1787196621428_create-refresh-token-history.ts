import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable("refresh_token_history", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    session_id: {
      type: "uuid",
      notNull: true,
      references: "sessions",
      onDelete: "CASCADE",
    },

    refresh_token_hash: {
      type: "text",
      notNull: true,
      unique: true,
    },

    rotated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex(
    "refresh_token_history",
    "session_id"
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("refresh_token_history");
};
