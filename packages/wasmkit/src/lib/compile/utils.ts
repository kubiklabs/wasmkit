import { existsSync, readFileSync } from 'fs';
import { sync as glob } from 'glob';
import { compile } from 'polar-json-to-ts';

import { parser } from "./schemaParser";

export const readSchemas = (
  schemaDir: string,
  rawSchemaDir: string
): any[] => { // eslint-disable-line  @typescript-eslint/no-explicit-any
  // raw files is for CosmWasm 1.1 schema files
  if (existsSync(rawSchemaDir)) {
    const files = glob(rawSchemaDir + '/**/*.json');
    return (files).map(file => JSON.parse(readFileSync(file, 'utf-8')));
  } else {
    const files = glob(schemaDir + '/**/*.json');
    return (files).map(file => JSON.parse(readFileSync(file, 'utf-8')));
  }
};

export const findQueryMsg = (schemas: any[]): Record<string, unknown> => { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return schemas.find((schema: { title: string }) => schema.title === 'QueryMsg');
};

export const findExecuteMsg = (schemas: any[]): Record<string, unknown> => { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return schemas.find((schema: { title: string }) =>
    schema.title === 'ExecuteMsg' ||
      schema.title === 'ExecuteMsg_for_Empty' || // if cleanse is used, this is never
      schema.title === 'ExecuteMsgForEmpty' ||
      schema.title === 'Cw20ExecuteMsg' ||
      schema.title === 'Snip20ExecuteMsg'
  );
};

export const findAndParseTypes = async (
  schemas: any // eslint-disable-line  @typescript-eslint/no-explicit-any
): Promise<any> => { // eslint-disable-line  @typescript-eslint/no-explicit-any
  const Types = schemas;
  const allTypes = [];
  for (const typ in Types) {
    if (Types[typ].definitions) {
      for (const key of Object.keys(Types[typ].definitions)) {
        // set title
        Types[typ].definitions[key].title = key;
      }
    }
    const result = await compile(Types[typ], Types[typ].title);
    allTypes.push(result);
  }
  return parser(allTypes);
};
