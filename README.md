# multiecdsa-validator-scripts

This project contains TypeScript code for interacting with the MultiECDSAValidator smart contract from the Kernel smart contract through User Operations using ABIs and various utility functions.

## Structure

- `abis.ts`: Contains the ABI definitions for interacting with the Kernel and MultiECDSAValidator smart contracts.
- `enableOwner.ts`: Script to enable a new owner for the sending Kernel through the MultiECDSAValidator contract.
- `disableOwner.ts`: Script to disable an existing owner for the sending Kernel through the MultiECDSAValidator contract.
- `common.ts`: Contains common utilities and functions used across the project.

## Setup Instructions

1. Clone the repository.
2. Install dependencies with `yarn`.
3. Configure the environment variables in a `.env` file based on the `.env.example`.


## Running the Scripts

Use `ts-node` or compile the TypeScript files to JavaScript and then run using Node.js.

```bash
ts-node enableOwner.ts
ts-node disableOwner.ts