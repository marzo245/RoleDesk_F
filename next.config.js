/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        domains: ['lh3.googleusercontent.com'],
    },
    
    swcMinify: true,

    experimental: {
        esmExternals: false,
    },
    
    webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
            config.infrastructureLogging = {
                level: 'error',
            };
        }

        config.resolve.symlinks = false;

        return config;
    },

    ...(process.env.NODE_ENV === 'development' && {
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
    }),
};

module.exports = nextConfig;
