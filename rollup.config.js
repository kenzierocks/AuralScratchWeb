import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import UglifyJS from "uglify-es";
import sourceMaps from "rollup-plugin-sourcemaps";
import process from "process";

const dest = './dist/client.js';
const plugins = [];
plugins.push(
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env['ENVIRONMENT'] || 'production')
    }),
    commonjs({
        include: 'node_modules/**'
    }),
    nodeResolve({
        jsnext: true,
        main: true
    }),
    babel({
        exclude: 'node_modules/**', // only transpile our source code
        sourceMaps: "inline"
    }),
    sourceMaps()
);
if (process.env['ENVIRONMENT'] !== 'DEV') {
    plugins.push(
        uglify({
            sourceMap: {
                content: "inline"
            }
        }, UglifyJS['minify'])
    );
}
export default {
    input: 'ts-bin/client.js',
    output: {
        format: 'iife',
        file: dest,
        name: 'auralScratch',
        sourcemap: true
    },
    plugins: plugins,
    globals: {
        "jquery": "jQuery",
        "jsmediatags": "jsmediatags",
        "firebase": "firebase",
        "firebaseui": "firebaseui",
        "moment": "moment",
        "react": "React",
        "react-dom": "ReactDOM",
        "redux": "Redux",
        "react-redux": "ReactRedux",
        "reactstrap": "Reactstrap"
    },
    external: [
        "bootstrap",
        "jquery",
        "jsmediatags",
        "firebase",
        "firebaseui",
        "moment",
        "react",
        "react-dom",
        "redux",
        "react-redux",
        "reactstrap"
    ],
    watch: {
        useChokidar: false,
        include: ['ts-bin/**']
    }
};