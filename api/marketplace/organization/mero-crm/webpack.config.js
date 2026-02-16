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
            ...options.resolve || {}, // Preserving existing resolve options if any
            alias: {
                ...options.resolve?.alias || {}, // Preserving existing aliases if any
                '@src': path.resolve(__dirname, '../../../src'),
                '@auth': path.resolve(__dirname, '../../../src/auth'),
                '@audit-logs': path.resolve(__dirname, '../../../src/audit-logs'),
                '@config': path.resolve(__dirname, '../../../src/config'),
                '@common': path.resolve(__dirname, '../../../src/common'),
                '@database': path.resolve(__dirname, '../../../src/database'),
                '@shared': path.resolve(__dirname, '../../../shared'),
            }
        }
    };
};
