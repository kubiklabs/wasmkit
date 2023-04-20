"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createWasmQueryMethod = exports.createWasmExecMethod = exports.createQueryInterface = exports.createQueryClass = exports.createPropertyFunctionWithObjectParamsForExec = exports.createPropertyFunctionWithObjectParams = exports.createExecuteInterface = exports.createExecuteClass = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var t = _interopRequireWildcard(require("@babel/types"));

var _case = require("case");

var _utils = require("./utils");

var _babel = require("./utils/babel");

var _types2 = require("./utils/types");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var createWasmQueryMethod = function createWasmQueryMethod(jsonschema) {
  var _jsonschema$propertie;

  var underscoreName = Object.keys(jsonschema.properties)[0];
  var methodName = (0, _case.camel)(underscoreName);
  var responseType = "any";
  var properties = (_jsonschema$propertie = jsonschema.properties[underscoreName].properties) !== null && _jsonschema$propertie !== void 0 ? _jsonschema$propertie : {};
  var obj = (0, _types2.createTypedObjectParams)(jsonschema.properties[underscoreName]);
  var args = Object.keys(properties).map(function (prop) {
    return t.objectProperty(t.identifier(prop), t.identifier((0, _case.camel)(prop)), false, true);
  });
  var actionArg = t.objectProperty(t.identifier(underscoreName), t.objectExpression(args));
  return t.classProperty(t.identifier(methodName), (0, _utils.arrowFunctionExpression)(obj ? [obj] : [], t.blockStatement([t.returnStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('queryMsg')), [t.objectExpression([actionArg])]))]), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('Promise'), t.tsTypeParameterInstantiation([t.tSTypeReference(t.identifier(responseType))]))), true));
};

exports.createWasmQueryMethod = createWasmQueryMethod;

var createQueryClass = function createQueryClass(className, implementsClassName, extendsClassName, queryMsg, skipSchemaErrors) {
  var propertyNames = (0, _utils.getMessageProperties)(queryMsg).map(function (method) {
    var _Object$keys;

    return (_Object$keys = Object.keys(method.properties)) === null || _Object$keys === void 0 ? void 0 : _Object$keys[0];
  }).filter(Boolean);
  var bindings = propertyNames.map(_case.camel).map(_utils.bindMethod);
  var methods = (0, _utils.getMessageProperties)(queryMsg).map(function (schema) {
    try {
      return createWasmQueryMethod(schema);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(function (method) {
    return method !== null;
  });
  return t.exportNamedDeclaration((0, _utils.classDeclaration)(className, [// constructor
  t.classMethod('constructor', t.identifier('constructor'), [(0, _utils.typedIdentifier)('contractName', t.tsTypeAnnotation(t.tsStringKeyword())), (0, _utils.typedIdentifier)('instantiateTag?', t.tsTypeAnnotation(t.tsStringKeyword()))], t.blockStatement([t.expressionStatement(t.callExpression(t["super"](), [t.identifier('contractName'), t.identifier('instantiateTag')]))].concat((0, _toConsumableArray2["default"])(bindings))))].concat((0, _toConsumableArray2["default"])(methods)), [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))], extendsClassName ? t.identifier(extendsClassName) : null));
};

exports.createQueryClass = createQueryClass;

var createWasmExecMethod = function createWasmExecMethod(jsonschema) {
  var _jsonschema$propertie2;

  var underscoreName = Object.keys(jsonschema.properties)[0];
  var methodName = (0, _case.camel)(underscoreName);
  var properties = (_jsonschema$propertie2 = jsonschema.properties[underscoreName].properties) !== null && _jsonschema$propertie2 !== void 0 ? _jsonschema$propertie2 : {};
  var obj = (0, _types2.createTypedObjectParams)(jsonschema.properties[underscoreName]);
  var changeConstParamNames = false;

  for (var _i = 0, _Object$keys2 = Object.keys(properties); _i < _Object$keys2.length; _i++) {
    var prop = _Object$keys2[_i];

    if (prop === 'memo' || prop === 'account' || prop === 'customFees' || prop === 'transferAmount') {
      changeConstParamNames = true;
    }
  }

  var args = Object.keys(properties).map(function (prop) {
    return t.objectProperty(t.identifier(prop), t.identifier((0, _case.camel)(prop)), false, prop === (0, _case.camel)(prop));
  });
  var accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  var customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  var memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  var transferAmountVar = changeConstParamNames ? 'txnTransferAmount' : 'transferAmount';
  var constantParams = t.objectPattern([t.objectProperty(t.identifier(accountVar), t.identifier(accountVar), false, true), t.objectProperty(t.identifier(customFeesVar), t.identifier(customFeesVar), false, true), t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true), t.objectProperty(t.identifier(transferAmountVar), t.identifier(transferAmountVar), false, true)]);
  constantParams.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral([t.tSPropertySignature(t.identifier(accountVar), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.UserAccount')))), t.tSPropertySignature(t.identifier("".concat(customFeesVar, "?")), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.TxnStdFee')))), t.tSPropertySignature(t.identifier("".concat(memoVar, "?")), t.tsTypeAnnotation(t.tsStringKeyword())), t.tSPropertySignature(t.identifier("".concat(transferAmountVar, "?")), t.tsTypeAnnotation((0, _babel.tsTypeOperator)(t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))), 'readonly')))]));
  return t.classProperty(t.identifier(methodName), (0, _utils.arrowFunctionExpression)(obj ? [// props
  constantParams, obj] : [constantParams], t.blockStatement([t.returnStatement(t.awaitExpression(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('executeMsg')), [t.objectExpression([t.objectProperty(t.identifier(underscoreName), t.objectExpression((0, _toConsumableArray2["default"])(args)))]), t.identifier(accountVar), t.identifier(customFeesVar), t.identifier(memoVar), t.identifier(transferAmountVar)])))]), // return type
  t.tsTypeAnnotation(t.tsTypeReference(t.identifier('Promise'), t.tsTypeParameterInstantiation([t.tSTypeReference(t.identifier('any'))]))), true));
};

exports.createWasmExecMethod = createWasmExecMethod;

var createExecuteClass = function createExecuteClass(className, implementsClassName, extendsClassName, execMsg, contractName, skipSchemaErrors) {
  var propertyNames = (0, _utils.getMessageProperties)(execMsg).map(function (method) {
    var _Object$keys3;

    return (_Object$keys3 = Object.keys(method.properties)) === null || _Object$keys3 === void 0 ? void 0 : _Object$keys3[0];
  }).filter(Boolean);
  var bindings = propertyNames.map(_case.camel).map(_utils.bindMethod);
  var methods = (0, _utils.getMessageProperties)(execMsg).map(function (schema) {
    try {
      return createWasmExecMethod(schema);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(function (method) {
    return method !== null;
  });
  var blockStmt = [];

  if (extendsClassName) {
    blockStmt.push(t.expressionStatement(t.callExpression(t["super"](), [t.stringLiteral(contractName), t.identifier('instantiateTag')])));
  }

  [].push.apply(blockStmt, (0, _toConsumableArray2["default"])(bindings));
  return t.exportNamedDeclaration((0, _utils.classDeclaration)(className, [// constructor
  t.classMethod('constructor', t.identifier('constructor'), [(0, _utils.typedIdentifier)('instantiateTag?', t.tsTypeAnnotation(t.tsStringKeyword()))], t.blockStatement(blockStmt))].concat((0, _toConsumableArray2["default"])(methods)), [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))], extendsClassName ? t.identifier(extendsClassName) : null));
};

exports.createExecuteClass = createExecuteClass;

var createExecuteInterface = function createExecuteInterface(className, extendsClassName, execMsg, skipSchemaErrors) {
  var methods = (0, _utils.getMessageProperties)(execMsg).map(function (jsonschema) {
    var underscoreName = Object.keys(jsonschema.properties)[0];
    var methodName = (0, _case.camel)(underscoreName);

    try {
      return createPropertyFunctionWithObjectParamsForExec(methodName, 'any', jsonschema.properties[underscoreName]);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(function (method) {
    return method !== null;
  });
  var extendsAst = extendsClassName ? [t.tSExpressionWithTypeArguments(t.identifier(extendsClassName))] : [];
  return t.exportNamedDeclaration(t.tsInterfaceDeclaration(t.identifier(className), null, extendsAst, t.tSInterfaceBody((0, _toConsumableArray2["default"])(methods))));
};

exports.createExecuteInterface = createExecuteInterface;

var createPropertyFunctionWithObjectParams = function createPropertyFunctionWithObjectParams(methodName, responseType, jsonschema) {
  var obj = (0, _types2.createTypedObjectParams)(jsonschema);
  var func = {
    type: 'TSFunctionType',
    typeAnnotation: (0, _utils.promiseTypeAnnotation)(responseType),
    parameters: obj ? [obj] : []
  };
  return t.tSPropertySignature(t.identifier(methodName), t.tsTypeAnnotation(func));
};

exports.createPropertyFunctionWithObjectParams = createPropertyFunctionWithObjectParams;

var createPropertyFunctionWithObjectParamsForExec = function createPropertyFunctionWithObjectParamsForExec(methodName, responseType, jsonschema) {
  var _jsonschema$propertie3;

  var obj = (0, _types2.createTypedObjectParams)(jsonschema);
  var properties = (_jsonschema$propertie3 = jsonschema.properties) !== null && _jsonschema$propertie3 !== void 0 ? _jsonschema$propertie3 : {};
  var changeConstParamNames = false;

  for (var _i2 = 0, _Object$keys4 = Object.keys(properties); _i2 < _Object$keys4.length; _i2++) {
    var prop = _Object$keys4[_i2];

    if (prop === 'memo' || prop === 'account' || prop === 'customFees' || prop === 'transferAmount') {
      changeConstParamNames = true;
    }
  }

  var accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  var customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  var memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  var transferAmountVar = changeConstParamNames ? 'txnTransferAmount' : 'transferAmount';
  var fixedParams = t.objectPattern([t.objectProperty(t.identifier(accountVar), t.identifier(accountVar), false, true), t.objectProperty(t.identifier(customFeesVar), t.identifier(customFeesVar), false, true), t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true), t.objectProperty(t.identifier(transferAmountVar), t.identifier(transferAmountVar), false, true)]);
  fixedParams.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral([t.tSPropertySignature(t.identifier(accountVar), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.UserAccount')))), t.tSPropertySignature(t.identifier("".concat(customFeesVar, "?")), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.TxnStdFee')))), t.tSPropertySignature(t.identifier("".concat(memoVar, "?")), t.tsTypeAnnotation(t.tsStringKeyword())), t.tSPropertySignature(t.identifier("".concat(transferAmountVar, "?")), t.tsTypeAnnotation((0, _babel.tsTypeOperator)(t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))), 'readonly')))]));
  var func = {
    type: 'TSFunctionType',
    typeAnnotation: (0, _utils.promiseTypeAnnotation)(responseType),
    parameters: obj ? [fixedParams, obj] : [fixedParams]
  };
  return t.tSPropertySignature(t.identifier(methodName), t.tsTypeAnnotation(func));
};

exports.createPropertyFunctionWithObjectParamsForExec = createPropertyFunctionWithObjectParamsForExec;

var createQueryInterface = function createQueryInterface(className, queryMsg, skipSchemaErrors) {
  var methods = (0, _utils.getMessageProperties)(queryMsg).map(function (jsonschema) {
    var underscoreName = Object.keys(jsonschema.properties)[0];
    var methodName = (0, _case.camel)(underscoreName);
    var responseType = "any";

    try {
      return createPropertyFunctionWithObjectParams(methodName, responseType, jsonschema.properties[underscoreName]);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(function (method) {
    return method !== null;
  });
  return t.exportNamedDeclaration(t.tsInterfaceDeclaration(t.identifier(className), null, [], t.tSInterfaceBody((0, _toConsumableArray2["default"])(methods))));
};

exports.createQueryInterface = createQueryInterface;