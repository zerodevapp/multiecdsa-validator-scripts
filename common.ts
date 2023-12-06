import {
  getAccountNonce,
  getUserOperationHash,
  type UserOperation,
} from "permissionless";
import {
  PimlicoBundlerClient,
  PimlicoPaymasterClient,
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import { goerli } from "viem/chains";
import {
  http,
  createPublicClient,
  type Hex,
  type Address,
  WalletClient,
  createWalletClient,
  PublicClient,
  type AbiItem,
  type Account,
  encodeFunctionData as viemEncodeFunction,
  PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { kernelABI } from "./abis";
import dotenv from "dotenv";
dotenv.config();

export const {
  ENTRYPOINT_ADDRESS,
  RPC,
  BUNDLER_RPC,
  KERNEL_ADDRESS,
  MULTIECDSAVALIDATOR_ADDRESS,
} = process.env as { [key: string]: string };

export const OLD_OWNER_PK = `0x${process.env.OLD_OWNER_PK}` as `0x${string}`;
export const NEW_OWNER_ADDRESS = `0x${process.env.NEW_OWNER_ADDRESS}` as `0x${string}`;

if (!OLD_OWNER_PK) {
  throw new Error("OLD_OWNER_PK is not defined in the environment variables");
}

export const OLD_OWNER_ACCOUNT: PrivateKeyAccount =
  privateKeyToAccount(OLD_OWNER_PK);
export const OLD_OWNER_ADDRESS: Address = OLD_OWNER_ACCOUNT.address;

export const setupClients = async () => {
  const eoaWalletClient: WalletClient = createWalletClient({
    account: privateKeyToAccount(OLD_OWNER_PK),
    chain: goerli,
    transport: http(RPC),
  });

  const publicClient: PublicClient = createPublicClient({
    transport: http(RPC),
  });

  const pimlicoBundlerClient: PimlicoBundlerClient = createPimlicoBundlerClient(
    {
      chain: goerli,
      transport: http(BUNDLER_RPC),
    }
  );

  const pimlicoPaymasterClient: PimlicoPaymasterClient =
    createPimlicoPaymasterClient({
      chain: goerli,
      transport: http(BUNDLER_RPC),
    });

  return {
    eoaWalletClient,
    publicClient,
    pimlicoBundlerClient,
    pimlicoPaymasterClient,
  };
};

export const getDummySignature = (): `0x${string}` => {
  return "0x00000000fffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
};
export const encodeFunctionData = (
  abi: AbiItem[],
  functionName: string,
  args: any[]
): Hex => {
  const functionAbi = abi.find(
    (item) => item.type === "function" && item.name === functionName
  );

  if (!functionAbi) {
    throw new Error(`Function "${functionName}" not found in ABI definition`);
  }

  const encodedData = viemEncodeFunction({ abi, functionName, args });

  return encodedData;
};

export interface UserOperationData {
  functionName: string;
  args: any[];
  signature: `0x${string}`;
}

export const createUserOperation = async (
  publicClient: PublicClient,
  userOperationData: UserOperationData
): Promise<UserOperation> => {
  const nonce = await getAccountNonce(publicClient, {
    sender: KERNEL_ADDRESS as Address,
    entryPoint: ENTRYPOINT_ADDRESS as Address,
  });

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await publicClient.estimateFeesPerGas();

  const userOperation: UserOperation = {
    sender: KERNEL_ADDRESS as Address,
    nonce: nonce,
    initCode: "0x",
    callData: encodeFunctionData(
      kernelABI,
      userOperationData.functionName,
      userOperationData.args
    ),
    paymasterAndData: "0x" as Hex,
    signature: userOperationData.signature,
    maxFeePerGas: maxFeePerGas !== undefined ? maxFeePerGas : BigInt(0),
    maxPriorityFeePerGas:
      maxPriorityFeePerGas !== undefined ? maxPriorityFeePerGas : BigInt(0),
    callGasLimit: 0n,
    verificationGasLimit: 0n,
    preVerificationGas: 0n,
  };

  return userOperation;
};

export const sponsorUserOperation: (
  pimlicoPaymasterClient: PimlicoPaymasterClient,
  userOperation: UserOperation
) => Promise<UserOperation> = async (pimlicoPaymasterClient, userOperation) => {
  const sponsorUserOperationPaymasterAndData =
    await pimlicoPaymasterClient.sponsorUserOperation({
      userOperation: userOperation,
      entryPoint: ENTRYPOINT_ADDRESS as Address,
    });

  userOperation.paymasterAndData =
    sponsorUserOperationPaymasterAndData.paymasterAndData;
  userOperation.callGasLimit =
    sponsorUserOperationPaymasterAndData.callGasLimit;
  userOperation.verificationGasLimit =
    sponsorUserOperationPaymasterAndData.verificationGasLimit;
  userOperation.preVerificationGas =
    sponsorUserOperationPaymasterAndData.preVerificationGas;

  return userOperation;
};

export const sendUserOperation: (
  pimlicoBundlerClient: PimlicoBundlerClient,
  eoaWalletClient: WalletClient,
  userOperation: UserOperation
) => Promise<Hex> = async (
  pimlicoBundlerClient,
  eoaWalletClient,
  userOperation
) => {
  const userOpHash = await getUserOperationHash({
    userOperation,
    entryPoint: ENTRYPOINT_ADDRESS as Address,
    chainId: goerli.id,
  });

  userOperation.signature = await eoaWalletClient.signMessage({
    account: eoaWalletClient.account as `0x${string}` | Account,
    message: { raw: userOpHash },
  });

  const sentUserOpHash = await pimlicoBundlerClient.sendUserOperation({
    userOperation,
    entryPoint: ENTRYPOINT_ADDRESS as Address,
  });

  return sentUserOpHash;
};
