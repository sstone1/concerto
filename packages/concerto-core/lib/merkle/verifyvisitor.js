'use strict';

const { pathEquals } = require('./utils');

const {
    ClassDeclaration,
    Field,
    ModelUtil,
    RelationshipDeclaration
} = require('../..');

const crypto = require('crypto');

/**
 * The verify visitor verifies a merkle proof for a specified value
 * in a typed object.
 */
class VerifyVisitor {

    /**
     * Constructor.
     * @param {ModelManager} modelManager the model manager to use.
     */
    constructor(modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Called to visit a thing.
     * @param {*} thing the thing to visit.
     * @param {*} parameters the parameters.
     * @returns {*} the result.
     */
    visit(thing, parameters) {
        if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else {
            throw new Error('Unrecognised ' + JSON.stringify(thing));
        }
    }

    /**
     * Called to visit a class declaration.
     * @param {*} classDeclaration the class declaration to visit.
     * @param {*} parameters the parameters.
     * @returns {Buffer} the digest.
     */
    visitClassDeclaration(classDeclaration, parameters) {
        const { root } = parameters;
        if (root) {
            parameters.root = false;
        }
        const properties = classDeclaration.getProperties();
        for (const property of properties) {
            const name = property.getName();
            parameters.currentPath.push(name);
            const result = property.accept(this, parameters);
            parameters.currentPath.pop();
            if (result) {
                const { hashes } = parameters;
                const [ before, after ] = hashes.shift();
                const hash = crypto.createHash('sha256');
                before.forEach(e => hash.update(e));
                hash.update(result);
                after.forEach(e => hash.update(e));
                return hash.digest();
            }
        }
        return null;
    }

    /**
     * Called to visit a relationship declaration.
     * @param {*} relationshipDeclaration the relationship declaration to visit.
     * @param {*} parameters the parameters.
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        // TODO:
        throw new Error('Not implemented for Relationships');
    }

    /**
     * Called to visit a field.
     * @param {*} field the field to visit.
     * @param {*} parameters the parameters.
     * @returns {Buffer} the digest.
     */
    visitField(field, parameters) {
        if (field.isArray()) {
            throw new Error('Not implemented for Array fields');
        } else if (field.isPrimitive()) {
            if (pathEquals(parameters.path, parameters.currentPath)) {
                const { value, salt } = parameters;
                const hash = crypto.createHash('sha256');
                const serializedValue = JSON.stringify(value);
                hash.update(serializedValue, 'utf8');
                hash.update(salt);
                return hash.digest();
            } else {
                return null;
            }
        } else if (ModelUtil.isEnum(field)) {
            throw new Error('Not implemented for Enum fields');
        } else {
            const classDeclaration = this.modelManager.getType(field.getFullyQualifiedTypeName());
            return classDeclaration.accept(this, parameters);
        }
    }

}

module.exports = VerifyVisitor;