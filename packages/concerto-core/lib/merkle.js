'use strict';

const ProofVisitor = require('./merkle/proofvisitor');
const RootVisitor = require('./merkle/rootvisitor');
const SaltVisitor = require('./merkle/saltvisitor');
const VerifyVisitor = require('./merkle/verifyvisitor');
const { splitProof } = require('./merkle/utils');

const { TypedStack } = require('..');

/**
 * Provides the ability to:
 * - Generate cryptographic salts for typed objects.
 * - Generate merkle roots for typed objects.
 * - Generate merkle proofs for a value in a typed object.
 * - Verify merkle proofs for a value in a typed object.
 */
class Merkle {

    /**
     * Constructor.
     * @param {ModelManager} modelManager the model manager to use.
     */
    constructor(modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Generate cryptographic salts for all properties in a typed object.
     * @param {Typed} typed the typed object.
     */
    salt(typed) {
        const classDeclaration = this.modelManager.getType(typed.getFullyQualifiedType());
        const visitor = new SaltVisitor(this.modelManager);
        const parameters = {
            stack: new TypedStack(typed)
        };
        classDeclaration.accept(visitor, parameters);
    }

    /**
     * Generate a merkle root for a typed object.
     * @param {Typed} typed the typed object.
     * @returns {string} the merkle root, as a hex encoded string.
     */
    root(typed) {
        const classDeclaration = this.modelManager.getType(typed.getFullyQualifiedType());
        const visitor = new RootVisitor(this.modelManager);
        const parameters = {
            stack: new TypedStack(typed)
        };
        const root = classDeclaration.accept(visitor, parameters);
        return root.toString('hex');
    }

    /**
     * Generate a merkle proof for a value in a typed object.
     * @param {Typed} typed the typed object.
     * @param {string[]} path the path to the value.
     * @returns {Proof} the merkle proof.
     */
    proof(typed, path) {
        const classDeclaration = this.modelManager.getType(typed.getFullyQualifiedType());
        const visitor = new ProofVisitor(this.modelManager);
        const parameters = {
            root: true,
            path,
            currentPath: [],
            stack: new TypedStack(typed)
        };
        const proof = classDeclaration.accept(visitor, parameters);
        const hashes = [];
        let p = proof;
        while (p) {
            const { before, after, child } = splitProof(p);
            hashes.unshift([
                before.map(b => b.toString('hex')),
                after.map(b => b.toString('hex')),
            ]);
            if (child.$value) {
                return {
                    hashes,
                    value: child.value,
                    salt: child.salt.toString('hex')
                };
            }
            p = child;
        }
    }

    /**
     * Verify a merkle proof for a value in a typed object.
     * @param {string} ns the namespace of the typed object.
     * @param {string} type the type of the typed object.
     * @param {string[]} path the path to the value.
     * @param {string} root the merkle root of the typed object.
     * @param {Proof} proof the merkle proof of the value in the typed object.
     * @returns {boolean} true if the merkle proof is valid, false otherwise.
     */
    verify(ns, type, path, root, proof) {
        const classDeclaration = this.modelManager.getType(`${ns}.${type}`);
        const visitor = new VerifyVisitor(this.modelManager);
        const { hashes, value, salt } = proof;
        const parsedHashes = hashes.map(([before, after]) => {
            return [
                before.map(b => Buffer.from(b, 'hex')),
                after.map(b => Buffer.from(b, 'hex'))
            ];
        });
        const parameters = {
            hashes: parsedHashes,
            value,
            salt: Buffer.from(salt, 'hex'),
            path,
            currentPath: [],
        };
        const actualRoot = classDeclaration.accept(visitor, parameters);
        return actualRoot.toString('hex') === root;
    }

}

module.exports = Merkle;