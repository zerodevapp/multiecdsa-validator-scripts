import { UserOperation } from "permissionless";
import {
  setupClients,
  getDummySignature,
  encodeFunctionData,
  UserOperationData,
  createUserOperation,
  sponsorUserOperation,
  sendUserOperation,
  MULTIECDSAVALIDATOR_ADDRESS,
} from "./common";
import {
  type Address,
} from "viem";
import { multiECDSAValidatorABI } from "./abis";

export async function executeOwnerChange(
  method: "enable" | "disable",
  ownerAddress: Address
): Promise<string> {
  const {
    eoaWalletClient,
    publicClient,
    pimlicoBundlerClient,
    pimlicoPaymasterClient,
  } = await setupClients();

  const calldata = encodeFunctionData(multiECDSAValidatorABI, method, [
    ownerAddress,
  ]);
  const userOperationData: UserOperationData = {
    functionName: "execute",
    args: [MULTIECDSAVALIDATOR_ADDRESS, 0n, calldata],
    signature: getDummySignature(),
  };

  const userOperation: UserOperation = await createUserOperation(
    publicClient,
    userOperationData
  );
  const sponsoredUserOperation: UserOperation = await sponsorUserOperation(
    pimlicoPaymasterClient,
    userOperation
  );
  const sentUserOpHash = await sendUserOperation(
    pimlicoBundlerClient,
    eoaWalletClient,
    sponsoredUserOperation
  );

  return sentUserOpHash;
}
