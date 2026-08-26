export const rateLimits = {
  login: {
    keyPrefix: "login",
    maxRequests: 5,
    windowSeconds: 15 * 60,
  },

  register: {
    keyPrefix: "register",
    maxRequests: 5,
    windowSeconds: 60 * 60,
  },

  forgotPassword: {
    keyPrefix: "forgot-password",
    maxRequests: 3,
    windowSeconds: 15 * 60,
  },

  resendVerification: {
    keyPrefix: "resend-verification",
    maxRequests: 3,
    windowSeconds: 15 * 60,
  },
} as const;