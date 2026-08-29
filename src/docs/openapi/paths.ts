const jsonContent = (schema: string) => ({
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schema}`,
      },
    },
  },
});

const requestBody = (schema: string) => ({
  required: true,
  ...jsonContent(schema),
});

const errorResponse = (description: string) => ({
  description,
  ...jsonContent("Error"),
});

const noContent = {
  description: "Operation completed successfully",
};

const bearerSecurity = [
  {
    bearerAuth: [],
  },
];

export const paths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      requestBody: requestBody("RegisterRequest"),
      responses: {
        "201": {
          description: "User registered",
        },
        "400": errorResponse("Invalid request"),
        "409": errorResponse("Email already registered"),
        "429": errorResponse("Rate limit exceeded"),
      },
    },
  },

  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Log in",
      requestBody: requestBody("LoginRequest"),
      responses: {
        "200": {
          description: "Authentication successful",
          ...jsonContent("TokenPair"),
        },
        "400": errorResponse("Invalid request"),
        "401": errorResponse("Invalid credentials"),
        "429": errorResponse("Rate limit exceeded"),
      },
    },
  },

  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Rotate refresh token",
      requestBody: requestBody("RefreshRequest"),
      responses: {
        "200": {
          description: "Tokens refreshed",
          ...jsonContent("TokenPair"),
        },
        "400": errorResponse("Invalid request"),
        "401": errorResponse("Invalid or expired refresh token"),
      },
    },
  },

  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Log out a session",
      requestBody: requestBody("RefreshRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Invalid request"),
      },
    },
  },

  "/auth/logout-all": {
    post: {
      tags: ["Auth"],
      summary: "Revoke all user sessions",
      security: bearerSecurity,
      responses: {
        "204": noContent,
        "401": errorResponse("Authentication required"),
      },
    },
  },

  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get authenticated identity",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Authenticated user",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  user: {
                    $ref: "#/components/schemas/User",
                  },
                },
                required: ["user"],
              },
            },
          },
        },
        "401": errorResponse("Authentication required"),
      },
    },
  },

  "/auth/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Verify email address",
      requestBody: requestBody("TokenRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Invalid verification token"),
      },
    },
  },

  "/auth/resend-verification": {
    post: {
      tags: ["Auth"],
      summary: "Resend email verification",
      requestBody: requestBody("EmailRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Invalid request"),
        "429": errorResponse("Rate limit exceeded"),
      },
    },
  },

  "/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request a password reset",
      requestBody: requestBody("EmailRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Invalid request"),
        "429": errorResponse("Rate limit exceeded"),
      },
    },
  },

  "/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password",
      requestBody: requestBody("ResetPasswordRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Invalid or expired reset token"),
      },
    },
  },

  "/auth/change-password": {
    post: {
      tags: ["Auth"],
      summary: "Change authenticated user password",
      security: bearerSecurity,
      requestBody: requestBody("ChangePasswordRequest"),
      responses: {
        "204": noContent,
        "400": errorResponse("Password change rejected"),
        "401": errorResponse("Authentication required"),
      },
    },
  },

  "/auth/sessions": {
    get: {
      tags: ["Sessions"],
      summary: "List active sessions",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Active sessions",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Session",
                },
              },
            },
          },
        },
        "401": errorResponse("Authentication required"),
      },
    },
  },

  "/auth/sessions/{sessionId}": {
    delete: {
      tags: ["Sessions"],
      summary: "Revoke a session",
      security: bearerSecurity,
      parameters: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses: {
        "204": noContent,
        "401": errorResponse("Authentication required"),
      },
    },
  },

  "/.well-known/jwks.json": {
    get: {
      tags: ["System"],
      summary: "Get public JSON Web Key Set",
      responses: {
        "200": {
          description: "Public signing keys",
        },
      },
    },
  },

  "/health": {
    get: {
      tags: ["System"],
      summary: "Check service health",
      responses: {
        "200": {
          description: "Service is running",
        },
      },
    },
  },

  "/ready": {
    get: {
      tags: ["System"],
      summary: "Check service readiness",
      responses: {
        "200": {
          description: "Service dependencies are ready",
        },
        "503": {
          description: "Service is not ready",
        },
      },
    },
  },
};