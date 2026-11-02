import { env } from "../../config/env.js";

export const syncExternalUser = async (
    authUserId: string
): Promise<void> => {
    if (!env.serviceSyncEnabled) {
        return;
    }

    try {
        const response = await fetch(env.serviceSyncUrl!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-service-key": env.serviceSyncSecret!,
            },
            body: JSON.stringify({ authUserId }),
            signal: AbortSignal.timeout(env.serviceSyncTimeoutMs),
        });

        if (!response.ok) {
            throw new Error(
                `Service synchronization returned HTTP ${response.status}`
            );
        }
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown synchronization error";

        console.error(
            `[ServiceSync] Failed for user ${authUserId}: ${message}`
        );
    }
};