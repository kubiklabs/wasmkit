"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createReactQueryHooks = exports.createReactQueryHookInterface = exports.createReactQueryHook = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var t = _interopRequireWildcard(require("@babel/types"));

var _case = require("case");

var _utils = require("./utils");

var _babel = require("./utils/babel");

var _types2 = require("./utils/types");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var createReactQueryHooks = function createReactQueryHooks(queryMsg, contractName, QueryClient) {
  return (0, _utils.getMessageProperties)(queryMsg).reduce(function (m, schema) {
    var underscoreName = Object.keys(schema.properties)[0];
    var methodName = (0, _case.camel)(underscoreName);
    var hookName = "use".concat((0, _case.pascal)(contractName)).concat((0, _case.pascal)(methodName), "Query");
    var hookParamsTypeName = "".concat((0, _case.pascal)(contractName)).concat((0, _case.pascal)(methodName), "Query");
    var responseType = (0, _case.pascal)("".concat(methodName, "Response"));
    var getterKey = (0, _case.camel)("".concat(contractName).concat((0, _case.pascal)(methodName)));
    var jsonschema = schema.properties[underscoreName];
    return [createReactQueryHookInterface({
      hookParamsTypeName: hookParamsTypeName,
      responseType: responseType,
      QueryClient: QueryClient,
      jsonschema: jsonschema
    }), createReactQueryHook({
      methodName: methodName,
      hookName: hookName,
      hookParamsTypeName: hookParamsTypeName,
      responseType: responseType,
      hookKeyName: getterKey,
      jsonschema: jsonschema
    })].concat((0, _toConsumableArray2["default"])(m));
  }, []);
};

exports.createReactQueryHooks = createReactQueryHooks;

var createReactQueryHook = function createReactQueryHook(_ref) {
  var _jsonschema$propertie;

  var hookName = _ref.hookName,
      hookParamsTypeName = _ref.hookParamsTypeName,
      responseType = _ref.responseType,
      hookKeyName = _ref.hookKeyName,
      methodName = _ref.methodName,
      jsonschema = _ref.jsonschema;
  var keys = Object.keys((_jsonschema$propertie = jsonschema.properties) !== null && _jsonschema$propertie !== void 0 ? _jsonschema$propertie : {});
  var args = [];

  if (keys.length) {
    args = [t.objectExpression((0, _toConsumableArray2["default"])(keys.map(function (prop) {
      return t.objectProperty(t.identifier((0, _case.camel)(prop)), t.memberExpression(t.identifier('args'), t.identifier((0, _case.camel)(prop))));
    })))];
  }

  var props = ['client', 'options'];

  if (keys.length) {
    props = ['client', 'args', 'options'];
  }

  return t.exportNamedDeclaration(t.functionDeclaration(t.identifier(hookName), [(0, _utils.tsObjectPattern)((0, _toConsumableArray2["default"])(props.map(function (prop) {
    return t.objectProperty(t.identifier(prop), t.identifier(prop), false, true);
  })), t.tsTypeAnnotation(t.tsTypeReference(t.identifier(hookParamsTypeName))))], t.blockStatement([t.returnStatement((0, _utils.callExpression)(t.identifier('useQuery'), [t.arrayExpression([t.stringLiteral(hookKeyName), t.memberExpression(t.identifier('client'), t.identifier('contractAddress'))]), t.arrowFunctionExpression([], t.callExpression(t.memberExpression(t.identifier('client'), t.identifier(methodName)), args), false), t.identifier('options')], t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier(responseType)), t.tsTypeReference(t.identifier('Error')), t.tsTypeReference(t.identifier(responseType)), t.tsArrayType(t.tsParenthesizedType(t.tsUnionType([t.tsStringKeyword(), t.tsUndefinedKeyword()])))])))])));
};

exports.createReactQueryHook = createReactQueryHook;

var createReactQueryHookInterface = function createReactQueryHookInterface(_ref2) {
  var QueryClient = _ref2.QueryClient,
      hookParamsTypeName = _ref2.hookParamsTypeName,
      responseType = _ref2.responseType,
      jsonschema = _ref2.jsonschema;
  var body = [t.tsPropertySignature(t.identifier('client'), t.tsTypeAnnotation(t.tsTypeReference(t.identifier(QueryClient)))), (0, _utils.tsPropertySignature)(t.identifier('options'), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('UseQueryOptions'), t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier(responseType)), t.tsTypeReference(t.identifier('Error')), t.tsTypeReference(t.identifier(responseType)), t.tsArrayType(t.tsParenthesizedType(t.tsUnionType([t.tsStringKeyword(), t.tsUndefinedKeyword()])))]))), true)];
  var props = getProps(jsonschema, true);

  if (props.length) {
    body.push(t.tsPropertySignature(t.identifier('args'), t.tsTypeAnnotation(t.tsTypeLiteral(props))));
  }

  return t.exportNamedDeclaration(t.tsInterfaceDeclaration(t.identifier(hookParamsTypeName), null, [], t.tsInterfaceBody(body)));
};

exports.createReactQueryHookInterface = createReactQueryHookInterface;

var getProps = function getProps(jsonschema, camelize) {
  var _jsonschema$propertie2;

  var keys = Object.keys((_jsonschema$propertie2 = jsonschema.properties) !== null && _jsonschema$propertie2 !== void 0 ? _jsonschema$propertie2 : {});
  if (!keys.length) return [];
  return keys.map(function (prop) {
    var _getPropertyType = (0, _types2.getPropertyType)(jsonschema, prop),
        type = _getPropertyType.type,
        optional = _getPropertyType.optional;

    return (0, _babel.propertySignature)(camelize ? (0, _case.camel)(prop) : prop, t.tsTypeAnnotation(type), optional);
  });
};