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
 * The salt visitor generates salts for all properties in a given
 * typed object, and stores the salts in that typed object.
 */
class SaltVisitor {

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
     * @param {ClassDeclaration} classDeclaration the class declaration to visit.
     * @param {*} parameters the parameters.
     */
    visitClassDeclaration(classDeclaration, parameters) {
        const typed = parameters.stack.pop();
        if (!(typed instanceof Resource)) {
            throw new Error('Expected a Resource, but found ' + typed);
        }
        const properties = classDeclaration.getProperties();
        for (const property of properties) {
            const name = property.getName();
            const value = typed[name];
            parameters.stack.push(value);
            const salt = property.accept(this, parameters);
            if (salt) {
                typed.setSalt(name, salt);
            }
        }
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
     * @returns {Buffer} the salt.
     */
    visitField(field, parameters) {
        const value = parameters.stack.pop();
        if (field.isArray()) {
            throw new Error('Not implemented for Array fields');
        } else if (field.isPrimitive()) {
            const salt = crypto.randomBytes(32);
            return salt;
        } else if (ModelUtil.isEnum(field)) {
            throw new Error('Not implemented for Enum fields');
        } else {
            parameters.stack.push(value);
            const classDeclaration = this.modelManager.getType(value.getFullyQualifiedType());
            classDeclaration.accept(this, parameters);
        }
        return null;
    }

}

module.exports = SaltVisitor;