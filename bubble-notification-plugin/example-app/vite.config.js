"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    root: './src',
    build: {
        outDir: '../dist',
        minify: false,
        emptyOutDir: true,
    },
});
