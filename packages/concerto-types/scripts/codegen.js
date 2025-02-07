'use strict';

const { CodeGen: { TypescriptVisitor }} = require('@accordproject/concerto-tools');
const { MetaModelUtil: {metaModelCto} } = require('@accordproject/concerto-metamodel');
const { ModelLoader } = require('@accordproject/concerto-core');
const { FileWriter } = require('@accordproject/concerto-util');
const path = require('path');

/**
 * Generate TypeScript files from the metamodel.
 */
async function main() {
    const modelManager = await ModelLoader.loadModelManagerFromModelFiles([metaModelCto]);
    const visitor = new TypescriptVisitor();
    const fileWriter = new FileWriter(path.resolve(__dirname, '..', 'src', 'generated'));
    const parameters = { fileWriter };
    modelManager.accept(visitor, parameters);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
