const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options) {
    return {
        ...options,
        externals: [
            nodeExternals({
                allowlist: ['@nestjs/microservices', '@nestjs/common', '@nestjs/core', '@nestjs/platform-express'],
            }),
        ],
        resolve: {
            ...options.resolve || {},
            alias: {
                ...options.resolve?.alias || {},
                '@': path.resolve(__dirname, 'src'),
                '@src': path.resolve(__dirname, 'src'),
                '@auth': path.resolve(__dirname, 'src/auth'),
                '@audit-logs': path.resolve(__dirname, 'src/audit-logs'),
                '@config': path.resolve(__dirname, 'src/config'),
                '@common': path.resolve(__dirname, 'src/common'),
                '@database': path.resolve(__dirname, 'src/database'),
                '@shared': path.resolve(__dirname, 'shared'),
                '@organizations': path.resolve(__dirname, 'src/organizations'),
                '@users': path.resolve(__dirname, 'src/users'),
                '@invitations': path.resolve(__dirname, 'src/invitations'),
                '@roles': path.resolve(__dirname, 'src/roles'),
                '@permissions': path.resolve(__dirname, 'src/permissions'),
                '@packages': path.resolve(__dirname, 'src/packages'),
                '@mfa': path.resolve(__dirname, 'src/mfa'),
                '@notifications': path.resolve(__dirname, 'src/notifications'),
            }
        }
    };
};
