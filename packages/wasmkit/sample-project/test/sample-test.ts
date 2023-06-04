import { use } from "chai";
import { getAccountByName, wasmKitChai } from "@arufa/wasmkit";

import { SampleProjectContract } from "../artifacts/typescript_schema/SampleProjectContract";

use(wasmKitChai);

describe("counter", () => {

  async function setup() {
    const contract_owner = await getAccountByName("account_0");
    const contract = new SampleProjectContract();
    await contract.setupClient();

    return { contract_owner, contract };
  }

  it("deploy and init", async () => {
    const runTs = String(new Date());
    const { contract_owner, contract } = await setup();
    const deploy_response = await contract.deploy(
      contract_owner,
      { // custom fees
        amount: [{ amount: "90000", denom: "untrn" }],
        gas: "35000000",
      }
    );
    console.log(deploy_response);

    // const customFees = { // custom fees
    //   amount: [{ amount: "750000", denom: "untrn" }],
    //   gas: "3000000",
    // };
    const contract_info = await contract.instantiate(
      {
        "count": 102
      },
      `deploy test ${runTs}`,
      contract_owner,
      undefined, // tokens to tranfer
      // customFees,
    );
    console.log(contract_info);
  });
});
