import { getAccountByName } from "@kubiklabs/wasmkit";

import { CounterContract } from "../artifacts/typescript_schema/CounterContract";

export default async function run () {
  const runTs = String(new Date());
  const contract_owner = await getAccountByName("account_0");
  const counter_contract = new CounterContract();
  await counter_contract.setupClient();

  const deploy_response = await counter_contract.deploy(
    contract_owner,
  );
  console.log(deploy_response);

  const contract_info = await counter_contract.instantiate(
    {
      "count": 102,
    },
    `deploy test ${runTs}`,
    contract_owner,
    undefined,  // transferAmount
    // customFees, // custom fees here
  );
  console.log(contract_info);

  const inc_response = await counter_contract.increment({account: contract_owner});
  console.log(inc_response);

  const response = await counter_contract.getCount();
  console.log(response);

  const ex_response = await counter_contract.increment(
    {
      account: contract_owner,
    }
  );
  console.log(ex_response);
}
