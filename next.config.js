/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    
    // Optimizar para builds de producción
    swcMinify: true,
    
    // Configuración experimental para reducir warnings
    experimental: {
        esmExternals: false,
    },
    
    // Configuración de Webpack para resolver warnings
    webpack: (config, { dev, isServer }) => {
        // Reducir warnings en desarrollo
        if (dev && !isServer) {
            config.infrastructureLogging = {
                level: 'error',
            }
        }
        
        // Resolver problemas de paths en Windows
        config.resolve.symlinks = false
        
        return config
    },
    
    // Configuración para desarrollo
    ...(process.env.NODE_ENV === 'development' && {
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
    }),
};

module.exports = nextConfig;
