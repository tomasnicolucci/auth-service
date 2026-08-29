export const schemas = {
  Error: {
    type: "object",
    properties: {
      error: {
        type: "string",
      },
    },
    required: ["error"],
  },

  User: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        format: "uuid",
      },
      email: {
        type: "string",
        format: "email",
      },
      role: {
        type: "string",
      },
    },
    required: ["userId", "email", "role"],
  },

  RegisterRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      password: {
        type: "string",
        format: "password",
      },
    },
  },

  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      password: {
        type: "string",
        format: "password",
      },
    },
  },

  TokenPair: {
    type: "object",
    properties: {
      accessToken: {
        type: "string",
      },
      refreshToken: {
        type: "string",
      },
    },
    required: ["accessToken", "refreshToken"],
  },

  RefreshRequest: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: {
        type: "string",
      },
    },
  },

  EmailRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
    },
  },

  TokenRequest: {
    type: "object",
    required: ["token"],
    properties: {
      token: {
        type: "string",
      },
    },
  },

  ResetPasswordRequest: {
    type: "object",
    required: ["token", "password"],
    properties: {
      token: {
        type: "string",
      },
      password: {
        type: "string",
        format: "password",
      },
    },
  },

  ChangePasswordRequest: {
    type: "object",
    required: [
      "currentPassword",
      "newPassword",
      "refreshToken",
    ],
    properties: {
      currentPassword: {
        type: "string",
        format: "password",
      },
      newPassword: {
        type: "string",
        format: "password",
      },
      refreshToken: {
        type: "string",
      },
    },
  },

  Session: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      lastUsedAt: {
        type: "string",
        format: "date-time",
        nullable: true,
      },
      expiresAt: {
        type: "string",
        format: "date-time",
      },
    },
    required: [
      "id",
      "createdAt",
      "expiresAt",
    ],
  },
};