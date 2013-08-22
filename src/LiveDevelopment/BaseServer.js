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

    /**
     * @constructor
     * Base class for live preview servers
     *
     * @param {!{baseUrl: string, root: string, pathResolver: function(string)}} config
     *    Configuration parameters for this server:
     *        baseUrl       - Optional base URL (populated by the current project)
     *        pathResolver  - Function to covert absolute native paths to project relative paths
     *        root          - Native path to the project root (and base URL)
     */
    function BaseServer(config) {
        this._baseUrl       = config.baseUrl;
        this._root          = config.root;          // ProjectManager.getProjectRoot().fullPath
        this._pathResolver  = config.pathResolver;  // ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
        this._liveDocuments = {};
    }

    /**
     * Returns a base url for current project. 
     *
     * @return {String}
     * Base url for current project.
     */
    BaseServer.prototype.getBaseUrl = function () {
        return this._baseUrl;
    };

    /**
     * @private
     * Augments the given Brackets document with information that's useful for live development
     */
    BaseServer.prototype._setDocInfo = function (liveDocument) {
        var parentUrl,
            rootUrl,
            matches,
            doc = liveDocument.doc;

        // FUTURE: some of these things should just be moved into core Document; others should
        // be in a LiveDevelopment-specific object attached to the doc.
        matches = /^(.*\/)(.+\.([^.]+))$/.exec(doc.file.fullPath);
        if (!matches) {
            return;
        }

        doc.extension = matches[3];

        parentUrl = this.pathToUrl(matches[1]);
        doc.url = parentUrl + encodeURI(matches[2]);

        // the root represents the document that should be displayed in the browser
        // for live development (the file for HTML files)
        // TODO: Issue #2033 Improve how default page is determined
        doc.root = { url: doc.url };

        // TODO: Better workflow of liveDocument.doc.url assignment
        // Force sync the browser after a URL is assigned
        if (liveDocument._updateBrowser) {
            liveDocument._updateBrowser();
        }
    };

    /**
     * Returns a URL for a given path
     * @param {string} path
     * @param {string} Path using the project's base URL
     */
    BaseServer.prototype.pathToUrl = function (path) {
        var url             = null,
            baseUrl         = this.getBaseUrl(),
            relativePath    = this._pathResolver(path);

        // See if base url has been specified and path is within project
        if (relativePath !== path) {
            // Map to server url. Base url is already encoded, so don't encode again.
            var encodedDocPath = encodeURI(path);
            var encodedProjectPath = encodeURI(this._root);

            return encodedDocPath.replace(encodedProjectPath, baseUrl);
        }

        return null;
    };

    /**
     * Convert a URL to a local full file path
     * @param {string} url
     * @return {string}
     */
    BaseServer.prototype.urlToPath = function (url) {
        var path,
            baseUrl = "";

        baseUrl = this.getBaseUrl();

        if (baseUrl !== "" && url.indexOf(baseUrl) === 0) {
            // Use base url to translate to local file path.
            // Need to use encoded project path because it's decoded below.
            path = url.replace(baseUrl, encodeURI(this._root));
        
            return decodeURI(path);
        }

        return null;
    }

    /**
     * Used to check if the server has finished launching after opening
     * the project. User is required to make sure their external sever
     * is ready, so indicate that we're always ready.
     *
     * @return {jQuery.Promise} Promise that is already resolved
     */
    BaseServer.prototype.readyToServe = function () {
        return $.Deferred().resolve().promise();
    };
    
    /**
     * Determines if this server can serve local file.
     * @param {String} localPath A local path to file being served.
     * @return {Boolean} true When the file can be served, otherwise false.
     */
    BaseServer.prototype.canServe = function (localPath) {
        return true;
    };

    BaseServer.prototype._documentKey = function (liveDocument) {
        return "/" + encodeURI(this._pathResolver(liveDocument.doc.file.fullPath));
    };

    /**
     * Adds a live document to server
     * @param {Object} liveDocument
     */
    BaseServer.prototype.add = function (liveDocument) {
        // use the project relative path as a key to lookup requests
        var key = this._documentKey(liveDocument);
        
        this._setDocInfo(liveDocument);
        this._liveDocuments[key] = liveDocument;
    };

    /**
     * Removes a live document from the server
     * @param {Object} liveDocument
     */
    BaseServer.prototype.remove = function (liveDocument) {
        var key = this._liveDocuments[this._documentKey(liveDocument)];
        
        if (key) {
            delete this._liveDocuments[key];
        }
    };

    /**
     * Clears all live documents currently attached to the server
     */
    BaseServer.prototype.clear = function () {
        this._liveDocuments = {};
    };

    /**
     * Start the server
     */
    BaseServer.prototype.start = function () {
        // do nothing
    };

    /**
     * Stop the server
     */
    BaseServer.prototype.stop = function () {
        // do nothing
    };

    exports.BaseServer = BaseServer;
});