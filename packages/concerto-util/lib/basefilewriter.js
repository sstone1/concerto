/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const Writer = require('./writer');

/**
 * FileWriter creates text files under a directory tree. It can be used
 * by code generators to create source files for example.
 * Basic usage is: openFile(fileName), writeLine(...), closeFile().
 *
 * @abstract
 * @private
 * @extends Writer
 * @see See {@link Writer}
 * @class
 * @memberof module:concerto-core
 */
class BaseFileWriter extends Writer {

    /**
     * Opens a file for writing. The file will be created in the
     * root directory of this FileWriter.
     *
     * @param {string} fileName - the name of the file to open
     */
    openFile(fileName) {
        throw new Error('not implemented');
    }

    /**
     * Opens a file for writing, with a location relative to the
     * root directory of this FileWriter.
     *
     * @param {string} relativeDir - the relative directory to use
     * @param {string} fileName - the name of the file to open
     */
    openRelativeFile(relativeDir, fileName) {
        throw new Error('not implemented');
    }

    /**
     * Closes the current open file
     */
    closeFile() {
        throw new Error('not implemented');
    }
}

module.exports = BaseFileWriter;
