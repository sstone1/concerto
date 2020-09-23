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

const HTTPModelFileLoader = require('../../../lib/introspect/loaders/httpmodelfileloader');
const ModelManager = require('../../../lib/modelmanager');
const moxios = require('moxios');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('HTTPModeFilelLoader', () => {

    let modelManager;
    let sandbox;

    let model = `namespace test
    enum Test {
        o ONE
    }`;

    beforeEach(() => {
        modelManager = new ModelManager();
        sandbox = sinon.createSandbox();
        moxios.install();
    });

    afterEach(() => {
        sandbox.restore();
        moxios.uninstall();
    });

    describe('#accept', () => {

        it('should accept http URIs', () => {
            const ml = new HTTPModelFileLoader(modelManager);
            ml.accepts('http://goo').should.be.true;
        });

        it('should accept https URIs', () => {
            const ml = new HTTPModelFileLoader(modelManager);
            ml.accepts('https://goo').should.be.true;
        });

        it('should reject unknown URIs', () => {
            const ml = new HTTPModelFileLoader(modelManager);
            ml.accepts('foo://goo').should.be.false;
        });
    });

    describe('#load', () => {

        it('should load https URIs', () => {

            // Match against an exact URL value
            const url = 'https://raw.githubusercontent.com/accordproject/models/master/src/usa/business.cto';

            moxios.stubRequest(url, {
                status: 200,
                responseText: model
            });

            const ml = new HTTPModelFileLoader(modelManager);
            return ml.load(url)
                .then((mf) => {
                    mf.getDefinitions().should.be.deep.equal(model);
                });
        });
    });
});
