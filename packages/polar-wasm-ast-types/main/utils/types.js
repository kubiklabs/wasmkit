"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getType = exports.getPropertyType = exports.createTypedObjectParams = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var t = _interopRequireWildcard(require("@babel/types"));

var _case = require("case");

var _babel = require("./babel");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var getTypeStrFromRef = function getTypeStrFromRef($ref) {
  switch ($ref) {
    case '#/definitions/Binary':
      return 'Binary';

    default:
      if ($ref !== null && $ref !== void 0 && $ref.startsWith('#/definitions/')) {
        return $ref.replace('#/definitions/', '');
      }

      throw new Error('what is $ref: ' + $ref);
  }
};

var getTypeFromRef = function getTypeFromRef($ref) {
  switch ($ref) {
    case '#/definitions/Binary':
      return t.tsTypeReference(t.identifier('Binary'));

    default:
      if ($ref !== null && $ref !== void 0 && $ref.startsWith('#/definitions/')) {
        return t.tsTypeReference(t.identifier($ref.replace('#/definitions/', '')));
      }

      throw new Error('what is $ref: ' + $ref);
  }
};

var getArrayTypeFromRef = function getArrayTypeFromRef($ref) {
  return t.tsArrayType(getTypeFromRef($ref));
};

var getArrayTypeFromType = function getArrayTypeFromType(type) {
  return t.tsArrayType(getType(type));
};

var getType = function getType(type) {
  switch (type) {
    case 'string':
      return t.tsStringKeyword();

    case 'boolean':
      return t.tSBooleanKeyword();

    case 'integer':
      return t.tsNumberKeyword();
    // case 'object':
    // return t.tsObjectKeyword();

    default:
      throw new Error('contact maintainers [unknown type]: ' + type);
  }
};

exports.getType = getType;

var getPropertyType = function getPropertyType(schema, prop) {
  var _schema$properties, _schema$required, _schema$required2;

  var props = (_schema$properties = schema.properties) !== null && _schema$properties !== void 0 ? _schema$properties : {};
  var info = props[prop];
  var type = null;
  var optional = !((_schema$required = schema.required) !== null && _schema$required !== void 0 && _schema$required.includes(prop));

  if (info.allOf && info.allOf.length === 1) {
    info = info.allOf[0];
  }

  if (typeof info.$ref === 'string') {
    type = getTypeFromRef(info.$ref);
  }

  if (Array.isArray(info.anyOf)) {
    // assuming 2nd is null, but let's check to ensure
    if (info.anyOf.length !== 2) {
      throw new Error('case not handled by transpiler. contact maintainers.');
    }

    var _info$anyOf = (0, _slicedToArray2["default"])(info.anyOf, 2),
        nullableType = _info$anyOf[0],
        nullType = _info$anyOf[1];

    if ((nullType === null || nullType === void 0 ? void 0 : nullType.type) !== 'null') {
      throw new Error('[nullableType.type]: case not handled by transpiler. contact maintainers.');
    }

    if (!(nullableType !== null && nullableType !== void 0 && nullableType.$ref)) {
      if (nullableType.title) {
        type = t.tsTypeReference(t.identifier(nullableType.title));
      } else {
        throw new Error('[nullableType.title] case not handled by transpiler. contact maintainers.');
      }
    } else {
      type = getTypeFromRef(nullableType === null || nullableType === void 0 ? void 0 : nullableType.$ref);
    }

    optional = true;
  }

  if (typeof info.type === 'string') {
    if (info.type === 'array') {
      if (info.items.$ref) {
        type = getArrayTypeFromRef(info.items.$ref);
      } else if (info.items.title) {
        type = t.tsArrayType(t.tsTypeReference(t.identifier(info.items.title)));
      } else if (info.items.type) {
        type = getArrayTypeFromType(info.items.type);
      } else {
        throw new Error('[info.items] case not handled by transpiler. contact maintainers.');
      }
    } else {
      type = getType(info.type);
    }
  }

  if (Array.isArray(info.type)) {
    // assuming 2nd is null, but let's check to ensure
    if (info.type.length !== 2) {
      throw new Error('please report this to maintainers (field type): ' + JSON.stringify(info, null, 2));
    }

    var _info$type = (0, _slicedToArray2["default"])(info.type, 2),
        _nullableType = _info$type[0],
        _nullType = _info$type[1];

    if (_nullType !== 'null') {
      throw new Error('please report this to maintainers (field type): ' + JSON.stringify(info, null, 2));
    }

    if (_nullableType === 'array') {
      if (info.items.$ref) {
        type = getArrayTypeFromRef(info.items.$ref);
      } else if (info.items.title) {
        type = t.tsArrayType(t.tsTypeReference(t.identifier(info.items.title)));
      } else if (info.items.type) {
        type = getArrayTypeFromType(info.items.type);
      } else {
        throw new Error('[info.items] case not handled by transpiler. contact maintainers.');
      }
    } else {
      type = getType(_nullableType);
    }

    optional = true;
  }

  if (!type) {
    throw new Error('cannot find type for ' + JSON.stringify(info));
  }

  if ((_schema$required2 = schema.required) !== null && _schema$required2 !== void 0 && _schema$required2.includes(prop)) {
    optional = false;
  }

  return {
    type: type,
    optional: optional
  };
};

exports.getPropertyType = getPropertyType;

var createTypedObjectParams = function createTypedObjectParams(jsonschema) {
  var _jsonschema$propertie;

  var camelize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var keys = Object.keys((_jsonschema$propertie = jsonschema.properties) !== null && _jsonschema$propertie !== void 0 ? _jsonschema$propertie : {});
  if (!keys.length) return;
  var typedParams = keys.map(function (prop) {
    if (jsonschema.properties[prop].type === 'object') {
      if (jsonschema.properties[prop].title) {
        return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(t.tsTypeReference(t.identifier(jsonschema.properties[prop].title))));
      } else {
        throw new Error('createTypedObjectParams() contact maintainer');
      }
    }

    if (Array.isArray(jsonschema.properties[prop].allOf)) {
      var _jsonschema$required;

      var isOptional = !((_jsonschema$required = jsonschema.required) !== null && _jsonschema$required !== void 0 && _jsonschema$required.includes(prop));
      var unionTypes = jsonschema.properties[prop].allOf.map(function (el) {
        if (el.title) return el.title;
        if (el.$ref) return getTypeStrFromRef(el.$ref);
        return el.type;
      });
      var uniqUnionTypes = (0, _toConsumableArray2["default"])(new Set(unionTypes));

      if (uniqUnionTypes.length === 1) {
        return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(t.tsTypeReference(t.identifier(uniqUnionTypes[0]))), isOptional);
      } else {
        return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(t.tsUnionType(uniqUnionTypes.map(function (typ) {
          return t.tsTypeReference(t.identifier(typ));
        }))), isOptional);
      }
    } else if (Array.isArray(jsonschema.properties[prop].oneOf)) {
      var _jsonschema$required2;

      var _isOptional = !((_jsonschema$required2 = jsonschema.required) !== null && _jsonschema$required2 !== void 0 && _jsonschema$required2.includes(prop));

      var _unionTypes = jsonschema.properties[prop].oneOf.map(function (el) {
        if (el.title) return el.title;
        if (el.$ref) return getTypeStrFromRef(el.$ref);
        return el.type;
      });

      var _uniqUnionTypes = (0, _toConsumableArray2["default"])(new Set(_unionTypes));

      if (_uniqUnionTypes.length === 1) {
        return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(t.tsTypeReference(t.identifier(_uniqUnionTypes[0]))), _isOptional);
      } else {
        return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(t.tsUnionType(_uniqUnionTypes.map(function (typ) {
          return t.tsTypeReference(t.identifier(typ));
        }))), _isOptional);
      }
    }

    var _getPropertyType = getPropertyType(jsonschema, prop),
        type = _getPropertyType.type,
        optional = _getPropertyType.optional;

    return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(type), optional);
  });
  var params = keys.map(function (prop) {
    return t.objectProperty(camelize ? t.identifier((0, _case.camel)(prop)) : t.identifier(prop), camelize ? t.identifier((0, _case.camel)(prop)) : t.identifier(prop), false, true);
  });
  var obj = t.objectPattern((0, _toConsumableArray2["default"])(params));
  obj.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral((0, _toConsumableArray2["default"])(typedParams)));
  return obj;
};

exports.createTypedObjectParams = createTypedObjectParams;