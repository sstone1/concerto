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

const BaseFileWriter = require('./basefilewriter');

/**
 * FileWriter creates text files under a directory tree. It can be used
 * by code generators to create source files for example.
 * Basic usage is: openFile(fileName), writeLine(...), closeFile().
 *
 * @private
 * @extends Writer
 * @see See {@link Writer}
 * @class
 * @memberof module:concerto-core
 */
class ZipFileWriter extends BaseFileWriter {

    /**
     * Create a FileWriter.
     *
     * @param {string} outputDirectory - the path to an output directory
     * that will be used to store generated files.
     */
    constructor(outputDirectory) {
        super();
        this.zip = new Jszip();
    }

    /**
     * Opens a file for writing. The file will be created in the
     * root directory of this FileWriter.
     *
     * @param {string} fileName - the name of the file to open
     */
    openFile(fileName) {
        this.fileName = fileName;
        this.relativeDir = null;
    }

    /**
     * Opens a file for writing, with a location relative to the
     * root directory of this FileWriter.
     *
     * @param {string} relativeDir - the relative directory to use
     * @param {string} fileName - the name of the file to open
     */
    openRelativeFile(relativeDir, fileName) {
        this.relativeDir = relativeDir;
        this.fileName = fileName;
    }

    /**
     * Writes text to the current open file
     * @param {number} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeLine(tabs,text) {
        if (this.fileName) {
            super.writeLine(tabs,text);
        } else {
            throw Error('File has not been opened!');
        }
    }

    /**
     * Writes text to the start of the current open file
     * @param {number} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeBeforeLine(tabs,text) {
        if (this.fileName) {
            super.writeBeforeLine(tabs,text);
        } else {
            throw Error('File has not been opened!');
        }
    }

    /**
     * Closes the current open file
     */
    closeFile() {
        if (!this.fileName) {
            throw new Error('No file open');
        }

        let filePath = this.outputDirectory;
        if (this.relativeDir) {
            filePath = path.resolve(filePath, this.relativeDir);
        }
        filePath = path.resolve(filePath, this.fileName);

        this.zip.file(filePath, this.getBuffer());

        this.fileName = null;
        this.relativeDir = null;
        this.clearBuffer();
    }

    getZip() {
        return this.zip.getMeTheBuffer();
    }
}

module.exports = ZipFileWriter;

const writer = new ZipFileWriter();
// write the things
const zip = writer.getZip();
// concerto.cto => "namespace concerto asset Thing ..."
// com.example.a.cto => "namespace com.example.a asset Thing ..."
