function timestamp() {
    return new Date().toISOString();
}

export const Logger = {
    info(message: string) {
        console.log(`[${timestamp()}] [INFO] ${message}`);
    },

    success(message: string) {
        console.log(`[${timestamp()}] [SUCCESS] ${message}`);
    },

    warn(message: string) {
        console.warn(`[${timestamp()}] [WARN] ${message}`);
    },

    error(message: string) {
        console.error(`[${timestamp()}] [ERROR] ${message}`);
    },
};
