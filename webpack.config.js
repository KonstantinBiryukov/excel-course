const path = require("path");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // to retrieve css from js in a separate file

// identify which mode we are currently in: prod or dev (we use cross-env lib to track it from package.json when we start server)
// we can user it to make plugin's options flexible, for example - minify code by HTMLWebpackPlugin only if we're in production mode
const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;

// when we're in production mode, we don't need hash numbers in the names of our css and js files
// since js (in output) and css (in MiniCssExtractPlugin) have the same pattern (bundle.[hash]), we can create a function fileName,
// with argument 'ext' (it will be 'css' or 'js'), if flag isDev is true -> do not use [hash], otherwise, use it (in Prod).
const fileName = ext => isDev ? `bundle.${ext}` : `bundle.[hash].${ext}`;


// return array of loaders for Babel
const jsLoaders = () => {
    const loaders = [
        {
            loader: "babel-loader",
            options: {
                presets: ["@babel/preset-env"]
            }
        }
    ];

    // if we're in Dev we need to add one more loader to the array
    if (isDev) {
        loaders.push("eslint-loader"); // loader for js
    }

    return loaders;
};

module.exports = {
    context: path.resolve(__dirname, "src"), // where all sources are placed,
    // __dirname - absolute path to the current directory (Excel-course), and
    // we concatenate this path with 'src'
    mode: "development",
    // entry points for app, './index.js' because we are already in the src folder.
    // since we use Babel, we use polyfills we need to use at the first entry point
    entry: ["@babel/polyfill", "./index.js"],
    output: {
        // filename: "bundle.[hash].js", // all js files will be bundled into this file, [hash] allows us to avoid problems with caching,
        filename: fileName("js"),
        // otherwise, if we always have bundle.js file, a user might not see the changes because of the cached 'bundle.js',
        // now bundle has a unique hash_id
        path: path.resolve(__dirname, "dist") // path.resolve() will return absolute path to us and put into 'dist' folder
    },
    resolve: {
        extensions: [".js"],
        alias: { // for using relative paths
            "@": path.resolve(__dirname, "src"), // when we write @, we will be in 'src' folder, so if the path starts from @, it's relative to 'src'
            "@core": path.resolve(__dirname, "src/core")
        }
    },
    devtool: isDev ? "source-map" : false, // we need SourceMap if we're in Dev Mode
    devServer: { // use dev-server to host our /dist folder files. We don't want to create static /dist folder, but we want
        // to change everything dynamically. ('webpack-dev-server' is added to npm run start package.json)
        port: 3000,
        hot: isDev
    },
    plugins: [
        new CleanWebpackPlugin(), // to clean dist folder after npm run build
        new HTMLWebpackPlugin({ // to create a route to html file
            template: "index.html",
            minify: { // minify for production
                removeComments: isProd,
                collapseWhitespace: isProd
            }
        }),
        new CopyPlugin(// constructor takes array of object, and we use this plugin to move favicon
            {
                patterns: [
                    {
                        from: path.resolve(__dirname, "src/favicon.ico"),
                        to: path.resolve(__dirname, "dist")
                    }
                ]
            }
        ),
        new MiniCssExtractPlugin({ // to retrieve css from js in a separate file, this Plugin gathers all styles
            // from all modules into the single file (bundle)
            filename: fileName("css")
        })
    ],
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i, // test extension .sass or .css
                use: [
                    // order matters and it's reversed:
                    // first of all: sass-loader works, sass compiles into CSS, than CSS loader works, then MiniCssExtractPlugin
                    // gathers all styles from all modules into a bundle
                    // MiniCssExtractPlugin.loader, // loader - static variable in MiniCssExtractPlugin
                    // if we want to have hot reload server not for js updates only, but for css as well, we have to
                    // get rid of MiniCssExtractPlugin.loader and replace it by the same object but with specific options
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev, // hmr = hotModuleReplacement
                            reloadAll: true
                        }

                    },
                    "css-loader", // Translate CSS into CommonJS
                    "sass-loader" // Compiles SASS to CSS

                ],
            },
            { // exclude node modules out of processing via babel. Apart of that, all js files will be processed through Babel
                test: /\.js$/,
                exclude: /node_modules/,
                use: jsLoaders() // 'use' is required if we want to add several loaders, 'use' returns an array
            }
        ]
    }

};