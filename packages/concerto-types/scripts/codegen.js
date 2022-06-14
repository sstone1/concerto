'use strict';

const { CodeGen: { TypescriptVisitor }} = require('@accordproject/concerto-tools');
const { MetaModelUtil: {metaModelCto} } = require('@accordproject/concerto-metamodel');
const { ModelLoader, ModelFile } = require('@accordproject/concerto-core');
const { FileWriter, DefaultFileLoader } = require('@accordproject/concerto-util');
const path = require('path');
const { Parser } = require('@accordproject/concerto-cto');

/**
 * Generate TypeScript files from the metamodel.
 */
async function main() {
    const modelManager = await ModelLoader.loadModelManagerFromModelFiles([metaModelCto]);
    const processFile = (name, data) => {
        const ast = Parser.parse(data);
        return new ModelFile(modelManager, ast, data, name);
    };
    const modelFileLoader = new DefaultFileLoader(processFile);
    const urls = [
        'https://models.accordproject.org/concerto/decorators.cto'
    ];
    for (const url of urls) {
        const modelFile = await modelFileLoader.load(url);
        modelManager.addModelFile(modelFile);
    }
    const visitor = new TypescriptVisitor();
    const fileWriter = new FileWriter(path.resolve(__dirname, '..', 'src', 'generated'));
    const parameters = { fileWriter };
    modelManager.accept(visitor, parameters);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
