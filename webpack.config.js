const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ExtractPlugin = require('extract-text-webpack-plugin'); //CSS单独打包

const isDev = process.env.NODE_ENV === 'development';
//__dirname:当前文件所在的目录 这里就是根目录
//path.join 生成绝对地址  
//用corss-env区分生产和开发环境  因为公用一份webpack.config.js 先安装cross-env
//然后在package.json里设置环境变量 
//"build": "cross-env NODE_ENV=production webpack --config webpack.config.js",
//"dev":"cross-env NODE_ENV=development webpack-dev-server --config webpack.config.js"

//我们在package.json里写在script里环境变量都存在 process.env下 可随便设置
const config = {
    target: 'web',
    entry: path.join(__dirname, 'src/index.js'),   // 输入：项目主文件（入口文件）
    output: {       // 输出
        filename: 'build.[hash:8].js',  // 输出的文件名
        path: path.join(__dirname, 'dist')  // 输出路径
    },
    module: {       // 配置加载资源
        rules: [    // 规则
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.jsx$/,
                loader: 'babel-loader'
            },
            {
                test: /\.(gif|jpg|jpeg|png|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 1024,  // 文件小于1024字节，转换成base64编码，写入文件里面
                            name: '[name]-output.[ext]'
                        }
                    }
                ]
            }
        ]
    },
    // webpack插件配置
    plugins: [
    //DefinePlugin 是判断生产/开发环境的
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: isDev ? '"development"' : '"production"'
            }
        }),
        new HTMLPlugin()
    ]
};

if (isDev) {
    // 开发坏境的配置
    config.module.rules.push({
        test: /\.styl/,
        use: [
            'style-loader',
            'css-loader',
            {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            },
            'stylus-loader'
        ]
    });
    //devtool 方便调试的时候映射源代码（因为被压缩过）
    config.devtool = '#cheap-module-eval-source-map';
    config.devServer = {
        port: '8888',
        host: '0.0.0.0',//即可通过localhost访问也可以通过自己机器IP访问 （可通过手机）
        overlay: {  // webpack编译出现错误，则显示到网页上
            errors: true,
        },
        // open: true,

        // 不刷新热加载数据
        hot: true
    };
    config.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    )
} else {
    // 生成坏境的配置
    config.entry = {   // 将所用到的类库单独打包
        app: path.join(__dirname, 'src/index.js'),
        vendor: ['vue'] //['vue', 'axios','vue-router']
    };
    config.output.filename = '[name].[chunkhash:8].js';
    config.module.rules.push({
        test: /\.styl/,
        use: ExtractPlugin.extract({ //css单独打包
            fallback: 'style-loader', //style-loader在生产环境下只是将CSS文件用JS形式插入到页面中
            use: [
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        sourceMap: true
                    }
                },
                'stylus-loader'
            ]
        })
    });
    config.plugins.push(
        new ExtractPlugin('styles.[contentHash:8].css')

        // // 将类库文件单独打包出来
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: 'vendor'
        // })

        // webpack相关的代码单独打包
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: 'runtime'
        // })
    );

    config.optimization = {
        splitChunks: {
            cacheGroups: {                  // 这里开始设置缓存的 chunks
                commons: {
                    chunks: 'initial',      // 必须三选一： "initial" | "all" | "async"(默认就是异步)
                    minSize: 0,             // 最小尺寸，默认0,
                    minChunks: 2,           // 最小 chunk ，默认1
                    maxInitialRequests: 5   // 最大初始化请求书，默认1
                },
                vendor: {
                    test: /node_modules/,   // 正则规则验证，如果符合就提取 chunk
                    chunks: 'initial',      // 必须三选一： "initial" | "all" | "async"(默认就是异步)
                    name: 'vendor',         // 要缓存的 分隔出来的 chunk 名称
                    priority: 10,           // 缓存组优先级
                    enforce: true
                }
            }
        },
        runtimeChunk: true
    }


}

module.exports = config;
