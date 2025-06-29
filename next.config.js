/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    
    // Configuración para desarrollo
    ...(process.env.NODE_ENV === 'development' && {
        // Reducir mensajes informativos en desarrollo
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
        webpack: (config, { dev, isServer }) => {
            if (dev && !isServer) {
                config.infrastructureLogging = {
                    level: 'error',
                }
            }
            return config
        },
    }),
};

module.exports = nextConfig;
