'use strict';

const { pathEquals } = require('./utils');

const {
    ClassDeclaration,
    Field,
    ModelUtil,
    RelationshipDeclaration,
    Relationship,
    Resource
} = require('../..');

const crypto = require('crypto');

/**
 * The proof visitor generates a merkle proof for a specified value
 * in a typed object.
 */
class ProofVisitor {

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
     * Visit a class declaration.
     * @param {*} classDeclaration the class declaration to visit.
     * @param {*} parameters the parameters.
     * @returns {object} the proof.
     */
    visitClassDeclaration(classDeclaration, parameters) {
        const { root } = parameters;
        if (root) {
            parameters.root = false;
        }
        const typed = parameters.stack.pop();
        if (!(typed instanceof Resource)) {
            throw new Error('Expected a Resource, but found ' + typed);
        }
        const properties = classDeclaration.getProperties();
        const results = [];
        for (const property of properties) {
            const name = property.getName();
            parameters.currentPath.push(name);
            const value = typed[name];
            const salt = typed.getSalt(name);
            parameters.stack.push(value);
            parameters.stack.push(salt);
            const result = property.accept(this, parameters);
            results.push(result);
            parameters.currentPath.pop();
        }
        return results;
    }

    /**
     * Visit a relationship declaration.
     * @param {*} relationshipDeclaration the relationship declaration to visit.
     * @param {*} parameters the parameters.
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        const relationship = parameters.stack.pop();
        if (!(relationship instanceof Relationship)) {
            throw new Error('Expected a Relationship, but found ' + relationship);
        }
        // TODO:
        throw new Error('Not implemented for Relationships');
    }

    /**
     * Visit a field.
     * @param {*} field the field to visit.
     * @param {*} parameters the parameters.
     * @returns {Buffer} the digest.
     */
    visitField(field, parameters) {
        const salt = parameters.stack.pop();
        const value = parameters.stack.pop();
        if (field.isArray()) {
            throw new Error('Not implemented for Array fields');
        } else if (field.isPrimitive()) {
            if (pathEquals(parameters.path, parameters.currentPath)) {
                return {
                    $value: true,
                    value,
                    salt
                };
            } else {
                const hash = crypto.createHash('sha256');
                const serializedValue = JSON.stringify(value);
                hash.update(serializedValue, 'utf8');
                hash.update(salt);
                return hash.digest();
            }
        } else if (ModelUtil.isEnum(field)) {
            throw new Error('Not implemented for Enum fields');
        } else {
            parameters.stack.push(value);
            const classDeclaration = this.modelManager.getType(value.getFullyQualifiedType());
            return classDeclaration.accept(this, parameters);
        }
    }

}

module.exports = ProofVisitor;