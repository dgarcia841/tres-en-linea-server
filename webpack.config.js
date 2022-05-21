// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const nodeExternals = require("webpack-node-externals");
const isProduction = process.env.NODE_ENV == "production";
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin");
const package = require("./package.json");


const config = {
  entry: "./src/index.ts",
  target: "node",
  output: {
    path: path.resolve(__dirname, "lib"),
  },
  devServer: {
    open: true,
    host: "localhost",
  },
  plugins: [
    new GeneratePackageJsonPlugin({
      //type: "module",
      main: "./main.js",
      name: package.name,
      author: package.author,
      version: package.version,
      description: package.description,
      license: package.license
    })
  ],
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: "eval-source-map",
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
