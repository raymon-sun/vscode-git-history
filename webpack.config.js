//@ts-check

"use strict";

const path = require("path");
const { merge } = require("webpack-merge");

/**@type {import('webpack').Configuration}*/
const baseConfig = {
	mode: "development",
	devtool: "source-map",
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: [".tsx", ".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
};

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
	target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	// mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
	},
	externals: {
		vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vsceignore file
	},
};

/**@type {import('webpack').Configuration}*/
const viewConfig = {
	target: "web",
	entry: "./src/views/index.tsx",
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, "dist"),
		filename: "view.js",
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				exclude: /\.module\.scss$/,
				use: [
					{
						loader: "style-loader",
					},
					{
						loader: "css-loader",
						options: {
							importLoaders: 1,
							modules: {
								compileType: "icss",
							},
						},
					},
					{
						loader: "sass-loader",
					},
				],
			},
			{
				test: /\.module\.scss$/,
				use: [
					"style-loader",
					{
						loader: "css-loader",
						options: {
							importLoaders: 1,
							modules: {
								compileType: "module",
							},
						},
					},
					{
						loader: "sass-loader",
					},
				],
			},
		],
	},
};

module.exports = [
	merge(extensionConfig, baseConfig),
	merge(viewConfig, baseConfig),
];
