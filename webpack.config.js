const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    devtool: false,
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
};