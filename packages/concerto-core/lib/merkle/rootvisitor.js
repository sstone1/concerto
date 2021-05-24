'use strict';

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
 * The root visitor generates a merkle root for a typed object.
 */
class RootVisitor {

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
        const typed = parameters.stack.pop();
        if (!(typed instanceof Resource)) {
            throw new Error('Expected a Resource, but found ' + typed);
        }
        const properties = classDeclaration.getProperties();
        const hashes = [];
        for (const property of properties) {
            const name = property.getName();
            const value = typed[name];
            const salt = typed.getSalt(name);
            parameters.stack.push(value);
            parameters.stack.push(salt);
            const hash = property.accept(this, parameters);
            hashes.push(hash);
        }
        const root = crypto.createHash('sha256');
        for (const hash of hashes) {
            root.update(hash);
        }
        const digest = root.digest();
        return digest;
    }

    /**
     * Called to visit a relationship declaration.
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
     * Called to visit a field.
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
            const hash = crypto.createHash('sha256');
            const serializedValue = JSON.stringify(value);
            hash.update(serializedValue, 'utf8');
            hash.update(salt);
            return hash.digest();
        } else if (ModelUtil.isEnum(field)) {
            throw new Error('Not implemented for Enum fields');
        } else {
            parameters.stack.push(value);
            const classDeclaration = this.modelManager.getType(value.getFullyQualifiedType());
            return classDeclaration.accept(this, parameters);
        }
    }

}

module.exports = RootVisitor;