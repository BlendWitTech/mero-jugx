const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
    return {
        ...options,
        externals: [
            nodeExternals({
                allowlist: ['@nestjs/microservices', '@nestjs/common', '@nestjs/core', '@nestjs/platform-express'],
            }),
        ],
    };
};
