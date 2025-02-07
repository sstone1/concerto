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

const ModelUtil = require('@accordproject/concerto-core').ModelUtil;

/**
 * Convert the contents of a ModelManager
 * to an XML Schema.
 * Set a fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 * @class
 * @memberof module:concerto-tools
 */
class XmlSchemaVisitor {
    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @public
     */
    visit(thing, parameters) {
        if (thing.isModelManager?.()) {
            return this.visitModelManager(thing, parameters);
        } else if (thing.isModelFile?.()) {
            return this.visitModelFile(thing, parameters);
        } else if (thing.isEnum?.()) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing.isClassDeclaration?.()) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing.isField?.()) {
            return this.visitField(thing, parameters);
        } else if (thing.isRelationship?.()) {
            return this.visitRelationship(thing, parameters);
        } else if (thing.isEnumValue?.()) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised ' + JSON.stringify(thing) );
        }
    }

    /**
     * Visitor design pattern
     * @param {ModelManager} modelManager - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        modelManager.getModelFiles().forEach((decl) => {
            decl.accept(this, parameters);
        });
        return null;
    }

    /**
     * Visitor design pattern
     * @param {ModelFile} modelFile - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelFile(modelFile, parameters) {
        parameters.fileWriter.openFile(`${modelFile.getNamespace()}.xsd`);
        parameters.fileWriter.writeLine(0, '<?xml version="1.0"?>');
        parameters.fileWriter.writeLine(0, `<xs:schema xmlns:${modelFile.getNamespace()}="${modelFile.getNamespace()}" targetNamespace="${modelFile.getNamespace()}" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema" `);

        const importedNamespaces = [];
        for(let importedType of modelFile.getImports()) {
            const clazz = modelFile.getModelManager().getType(importedType);
            if(importedNamespaces.indexOf(clazz.getNamespace()) === -1){
                importedNamespaces.push(clazz.getNamespace());
                parameters.fileWriter.writeLine(0, `xmlns:${clazz.getNamespace()}="${clazz.getNamespace()}"`);
            }
        }
        parameters.fileWriter.writeLine(0, '>');

        // import the system namespace and then any explicitly required namespaces
        const importedNamespaces2 = [];
        // prevent namespaces being imported multiple times
        for(let importedType of modelFile.getImports()) {
            const clazz = modelFile.getModelManager().getType(importedType);
            if(importedNamespaces2.indexOf(clazz.getNamespace()) === -1){
                importedNamespaces2.push(clazz.getNamespace());
                parameters.fileWriter.writeLine(0, `<xs:import namespace="${clazz.getNamespace()}" schemaLocation="${clazz.getNamespace()}.xsd"/>`);
            }
        }

        modelFile.getAllDeclarations().forEach((decl) => {
            decl.accept(this, parameters);
        });

        parameters.fileWriter.writeLine(0, '</xs:schema>');
        parameters.fileWriter.closeFile();

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(classDeclaration, parameters) {

        // if the enumeration has a super type we have
        // to create a synthetic type with our own properties
        // and then union them with the super type
        // https://www.ibm.com/developerworks/library/x-extenum/index.html
        let typeName = classDeclaration.getName();

        if(classDeclaration.getSuperType()) {
            typeName = typeName + '_Own'; // create a synthetic type for our own properties
        }

        parameters.fileWriter.writeLine(0, `<xs:simpleType name="${typeName}">` );
        parameters.fileWriter.writeLine(1, '<xs:restriction base="xs:string">' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this, parameters);
        });

        parameters.fileWriter.writeLine(1, '</xs:restriction>' );
        parameters.fileWriter.writeLine(0, '</xs:simpleType>' );

        // if we have a super type we now need to create the union type
        if(classDeclaration.getSuperType()) {
            const superClass = classDeclaration.getModelFile().getModelManager().getType(classDeclaration.getSuperType());
            parameters.fileWriter.writeLine(0, `<xs:simpleType name="${classDeclaration.getName()}" type="${classDeclaration.getNamespace()}:${typeName}">` );
            parameters.fileWriter.writeLine(1, `<xs:union memberTypes="${classDeclaration.getNamespace()}:${typeName}  ${superClass.getNamespace()}:${superClass.getName()}">` );
            parameters.fileWriter.writeLine(1, '</xs:union>' );
            parameters.fileWriter.writeLine(0, '</xs:simpleType>' );
        }

        // declare the element
        parameters.fileWriter.writeLine(0, `<xs:element name="${classDeclaration.getName()}" type="${classDeclaration.getNamespace()}:${classDeclaration.getName()}"/>` );

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {

        parameters.fileWriter.writeLine(0, `<xs:complexType name="${classDeclaration.getName()}">` );

        if(classDeclaration.getSuperType()) {
            const superClass = classDeclaration.getModelFile().getModelManager().getType(classDeclaration.getSuperType());
            parameters.fileWriter.writeLine(1, '<xs:complexContent>');
            parameters.fileWriter.writeLine(1, `<xs:extension base="${superClass.getNamespace()}:${superClass.getName()}">` );
        }

        parameters.fileWriter.writeLine(1, '<xs:sequence>');

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this, parameters);
        });

        parameters.fileWriter.writeLine(1, '</xs:sequence>');

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(1, '</xs:extension>');
            parameters.fileWriter.writeLine(1, '</xs:complexContent>');
        }

        parameters.fileWriter.writeLine(0, '</xs:complexType>' );

        // declare the element
        parameters.fileWriter.writeLine(0, `<xs:element name="${classDeclaration.getName()}" type="${classDeclaration.getNamespace()}:${classDeclaration.getName()}"/>` );

        return null;
    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        let array = '';

        if(field.isArray()) {
            array = ' minOccurs="0" maxOccurs="unbounded"';
        }

        parameters.fileWriter.writeLine(2, `<xs:element name="${field.getName()}" type="${this.toXsType(field.getFullyQualifiedTypeName())}"${array}/>`);

        return null;
    }

    /**
     * Visitor design pattern
     * @param {EnumValueDeclaration} enumValueDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumValueDeclaration(enumValueDeclaration, parameters) {
        parameters.fileWriter.writeLine(2, `<xs:enumeration value="${enumValueDeclaration.getName()}"/>`);
        return null;
    }

    /**
     * Visitor design pattern
     * @param {Relationship} relationship - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitRelationship(relationship, parameters) {
        let array = '';

        if(relationship.isArray()) {
            array = ' minOccurs="0" maxOccurs="unbounded"';
        }

        parameters.fileWriter.writeLine(2, `<xs:element name="${relationship.getName()}" type="${this.toXsType(relationship.getFullyQualifiedTypeName())}"${array}/>`);
        return null;
    }

    /**
     * Converts a Concerto type to a XML Schema type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the fully qualified concerto type name
     * @return {string} the corresponding type in XML Schema
     * @private
     */
    toXsType(type) {
        switch(type) {
        case 'DateTime':
            return 'xs:dateTime';
        case 'Boolean':
            return 'xs:boolean';
        case 'String':
            return 'xs:string';
        case 'Double':
            return 'xs:double';
        case 'Long':
            return 'xs:long';
        case 'Integer':
            return 'xs:integer';
        default:
            return `${ModelUtil.getNamespace(type)}:${ModelUtil.getShortName(type)}`;
        }
    }
}

module.exports = XmlSchemaVisitor;
