/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";
    
    var BaseServer  = require("LiveDevelopment/BaseServer").BaseServer,
        FileUtils   = require("file/FileUtils");

    // The path on Windows starts with a drive letter (e.g. "C:").
    // In order to make it a valid file: URL we need to add an
    // additional slash to the prefix.
    var PREFIX = (brackets.platform === "win") ? "file:///" : "file://";

    /**
     * @constructor
     * Server for file: URLs
     *
     * @param {!{baseUrl: string, root: string, pathResolver: function(string)}} config
     *    Configuration parameters for this server:
     *        baseUrl       - Optional base URL (populated by the current project)
     *        pathResolver  - Function to covert absolute native paths to project relative paths
     *        root          - Native path to the project root (and base URL)
     */
    function FileServer(config) {
        BaseServer.call(this, config);
    }
    
    FileServer.prototype = Object.create(BaseServer.prototype);
    FileServer.prototype.constructor = BaseServer;

    /**
     * Determines whether we can serve local file.
     * @param {String} localPath A local path to file being served.
     * @return {Boolean} true for yes, otherwise false.
     */
    FileServer.prototype.canServe = function (localPath) {
        // FileServer requires that the base URL is undefined and static HTML files
        return (!this._baseUrl && FileUtils.isStaticHtmlFileExt(localPath));
    };

    /**
     * @private
     * See BaseServer#urlToPath
     */
    FileServer.prototype.urlToPath = function (url) {
        var path;
        
        if (url.indexOf("file://") === 0) {
            // Convert a file URL to local file path
            path = url.slice(7);
            
            if (path && brackets.platform === "win" && path.charAt(0) === "/") {
                path = path.slice(1);
            }
        
            return decodeURI(path);
        }

        return null;
    };

    /**
     * @private
     * See BaseServer#pathToUrl
     */
    FileServer.prototype.pathToUrl = function (path) {
        return encodeURI(PREFIX + path);
    };

    exports.FileServer = FileServer;
});