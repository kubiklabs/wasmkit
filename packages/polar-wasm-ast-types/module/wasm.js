import * as t from '@babel/types';
import { camel } from 'case';
import { arrowFunctionExpression, bindMethod, classDeclaration, getMessageProperties, promiseTypeAnnotation, typedIdentifier } from './utils';
import { tsTypeOperator } from './utils/babel';
import { createTypedObjectParams } from './utils/types';
export const createWasmQueryMethod = jsonschema => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const responseType = `any`;
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);
  const args = Object.keys(properties).map(prop => {
    return t.objectProperty(t.identifier(prop), t.identifier(camel(prop)), false, true);
  });
  const actionArg = t.objectProperty(t.identifier(underscoreName), t.objectExpression(args));
  return t.classProperty(t.identifier(methodName), arrowFunctionExpression(obj ? [obj] : [], t.blockStatement([t.returnStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('queryMsg')), [t.objectExpression([actionArg])]))]), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('Promise'), t.tsTypeParameterInstantiation([t.tSTypeReference(t.identifier(responseType))]))), true));
};
export const createQueryClass = (className, implementsClassName, extendsClassName, queryMsg, skipSchemaErrors) => {
  const propertyNames = getMessageProperties(queryMsg).map(method => Object.keys(method.properties)?.[0]).filter(Boolean);
  const bindings = propertyNames.map(camel).map(bindMethod);
  const methods = getMessageProperties(queryMsg).map(schema => {
    try {
      return createWasmQueryMethod(schema);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(method => method !== null);
  return t.exportNamedDeclaration(classDeclaration(className, [// constructor
  t.classMethod('constructor', t.identifier('constructor'), [typedIdentifier('contractName', t.tsTypeAnnotation(t.tsStringKeyword())), typedIdentifier('instantiateTag?', t.tsTypeAnnotation(t.tsStringKeyword()))], t.blockStatement([t.expressionStatement(t.callExpression(t.super(), [t.identifier('contractName'), t.identifier('instantiateTag')])), ...bindings])), ...methods], [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))], extendsClassName ? t.identifier(extendsClassName) : null));
};
export const createWasmExecMethod = jsonschema => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);
  let changeConstParamNames = false;

  for (const prop of Object.keys(properties)) {
    if (prop === 'memo' || prop === 'account' || prop === 'customFees' || prop === 'transferAmount') {
      changeConstParamNames = true;
    }
  }

  const args = Object.keys(properties).map(prop => {
    return t.objectProperty(t.identifier(prop), t.identifier(camel(prop)), false, prop === camel(prop));
  });
  const accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  const customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  const memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  const transferAmountVar = changeConstParamNames ? 'txnTransferAmount' : 'transferAmount';
  const constantParams = t.objectPattern([t.objectProperty(t.identifier(accountVar), t.identifier(accountVar), false, true), t.objectProperty(t.identifier(customFeesVar), t.identifier(customFeesVar), false, true), t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true), t.objectProperty(t.identifier(transferAmountVar), t.identifier(transferAmountVar), false, true)]);
  constantParams.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral([t.tSPropertySignature(t.identifier(accountVar), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.UserAccount')))), t.tSPropertySignature(t.identifier(`${customFeesVar}?`), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.TxnStdFee')))), t.tSPropertySignature(t.identifier(`${memoVar}?`), t.tsTypeAnnotation(t.tsStringKeyword())), t.tSPropertySignature(t.identifier(`${transferAmountVar}?`), t.tsTypeAnnotation(tsTypeOperator(t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))), 'readonly')))]));
  return t.classProperty(t.identifier(methodName), arrowFunctionExpression(obj ? [// props
  constantParams, obj] : [constantParams], t.blockStatement([t.returnStatement(t.awaitExpression(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('executeMsg')), [t.objectExpression([t.objectProperty(t.identifier(underscoreName), t.objectExpression([...args]))]), t.identifier(accountVar), t.identifier(customFeesVar), t.identifier(memoVar), t.identifier(transferAmountVar)])))]), // return type
  t.tsTypeAnnotation(t.tsTypeReference(t.identifier('Promise'), t.tsTypeParameterInstantiation([t.tSTypeReference(t.identifier('any'))]))), true));
};
export const createExecuteClass = (className, implementsClassName, extendsClassName, execMsg, contractName, skipSchemaErrors) => {
  const propertyNames = getMessageProperties(execMsg).map(method => Object.keys(method.properties)?.[0]).filter(Boolean);
  const bindings = propertyNames.map(camel).map(bindMethod);
  const methods = getMessageProperties(execMsg).map(schema => {
    try {
      return createWasmExecMethod(schema);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(method => method !== null);
  const blockStmt = [];

  if (extendsClassName) {
    blockStmt.push(t.expressionStatement(t.callExpression(t.super(), [t.stringLiteral(contractName), t.identifier('instantiateTag')])));
  }

  [].push.apply(blockStmt, [...bindings]);
  return t.exportNamedDeclaration(classDeclaration(className, [// constructor
  t.classMethod('constructor', t.identifier('constructor'), [typedIdentifier('instantiateTag?', t.tsTypeAnnotation(t.tsStringKeyword()))], t.blockStatement(blockStmt)), ...methods], [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))], extendsClassName ? t.identifier(extendsClassName) : null));
};
export const createExecuteInterface = (className, extendsClassName, execMsg, skipSchemaErrors) => {
  const methods = getMessageProperties(execMsg).map(jsonschema => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);

    try {
      return createPropertyFunctionWithObjectParamsForExec(methodName, 'any', jsonschema.properties[underscoreName]);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(method => method !== null);
  const extendsAst = extendsClassName ? [t.tSExpressionWithTypeArguments(t.identifier(extendsClassName))] : [];
  return t.exportNamedDeclaration(t.tsInterfaceDeclaration(t.identifier(className), null, extendsAst, t.tSInterfaceBody([// // contract address
  // t.tSPropertySignature(
  //   t.identifier('account'),
  //   t.tsTypeAnnotation(
  //     t.tsStringKeyword()
  //   )
  // ),
  ...methods])));
};
export const createPropertyFunctionWithObjectParams = (methodName, responseType, jsonschema) => {
  const obj = createTypedObjectParams(jsonschema);
  const func = {
    type: 'TSFunctionType',
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [obj] : []
  };
  return t.tSPropertySignature(t.identifier(methodName), t.tsTypeAnnotation(func));
};
export const createPropertyFunctionWithObjectParamsForExec = (methodName, responseType, jsonschema) => {
  const obj = createTypedObjectParams(jsonschema);
  const properties = jsonschema.properties ?? {};
  let changeConstParamNames = false;

  for (const prop of Object.keys(properties)) {
    if (prop === 'memo' || prop === 'account' || prop === 'customFees' || prop === 'transferAmount') {
      changeConstParamNames = true;
    }
  }

  const accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  const customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  const memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  const transferAmountVar = changeConstParamNames ? 'txnTransferAmount' : 'transferAmount';
  const fixedParams = t.objectPattern([t.objectProperty(t.identifier(accountVar), t.identifier(accountVar), false, true), t.objectProperty(t.identifier(customFeesVar), t.identifier(customFeesVar), false, true), t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true), t.objectProperty(t.identifier(transferAmountVar), t.identifier(transferAmountVar), false, true)]);
  fixedParams.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral([t.tSPropertySignature(t.identifier(accountVar), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.UserAccount')))), t.tSPropertySignature(t.identifier(`${customFeesVar}?`), t.tsTypeAnnotation(t.tsTypeReference(t.identifier('polarTypes.TxnStdFee')))), t.tSPropertySignature(t.identifier(`${memoVar}?`), t.tsTypeAnnotation(t.tsStringKeyword())), t.tSPropertySignature(t.identifier(`${transferAmountVar}?`), t.tsTypeAnnotation(tsTypeOperator(t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))), 'readonly')))]));
  const func = {
    type: 'TSFunctionType',
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [fixedParams, obj] : [fixedParams]
  };
  return t.tSPropertySignature(t.identifier(methodName), t.tsTypeAnnotation(func));
};
export const createQueryInterface = (className, queryMsg, skipSchemaErrors) => {
  const methods = getMessageProperties(queryMsg).map(jsonschema => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    const responseType = `any`;

    try {
      return createPropertyFunctionWithObjectParams(methodName, responseType, jsonschema.properties[underscoreName]);
    } catch (e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter(method => method !== null);
  return t.exportNamedDeclaration(t.tsInterfaceDeclaration(t.identifier(className), null, [], t.tSInterfaceBody([...methods])));
};