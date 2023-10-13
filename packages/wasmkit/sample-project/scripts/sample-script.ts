import { getAccountByName } from "@kubiklabs/wasmkit";

import { SampleProjectContract } from "../artifacts/typescript_schema/SampleProjectContract";

export default async function run () {
  const runTs = String(new Date());
  const contract_owner = await getAccountByName("account_0");
  const contract = new SampleProjectContract();
  await contract.setupClient();

 const deploy_response = await contract.deploy(
    contract_owner,
  );
  console.log(deploy_response);

  const contract_info = await contract.instantiate(
    {"count": 102},
    `deploy test ${runTs}`,
    contract_owner,
    undefined,  // transferAmount
    // customFees, You add here
  );
  console.log(contract_info);

  const inc_response = await contract.increment({account: contract_owner});
  console.log(inc_response);

  const response = await contract.getCount();
  console.log(response);

  const ex_response = await contract.increment(
    {
      account: contract_owner,
    }
  );
  console.log(ex_response);
}
