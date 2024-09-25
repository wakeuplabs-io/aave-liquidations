import { Contract, Signer } from "ethers";
import erc20Abi from "./abis/ERC20_Abi.json" assert { type: "json" };
import poolMetadata from "./abis/Pool-Implementation.json" assert { type: "json" };
import envParsed from "./envParsed.js";

const TX_SUCCESS = 1;

export const LIQUIDATE_DIVIDER = BigInt(2);

export interface ILiquidationCallParams {
  currentDebt: any;
  collateralAsset: string;
  debtAsset: string;
  borrowerUser: string;
  receiveAToken: boolean;
}

export async function checkAllowance(
  { currentDebt, debtAsset }: ILiquidationCallParams,
  lambdaWallet: Signer
) {
  const amountToLiquidate = BigInt(currentDebt) / LIQUIDATE_DIVIDER;

  const erc20 = new Contract(debtAsset, erc20Abi, lambdaWallet);

  const userWallet = await lambdaWallet.getAddress();

  const currentAllowance = await erc20.allowance(
    userWallet,
    envParsed().POOL_ADDRESS
  );

  const approved = currentAllowance >= amountToLiquidate;

  const currentBalance = await erc20.balanceOf(userWallet);

  return {
    approved,
    currentBalance,
  };
}

export async function approveForLiquidation(
  { currentDebt, debtAsset }: ILiquidationCallParams,
  lambdaWallet: Signer
) {
  const amountToLiquidate = BigInt(currentDebt) / LIQUIDATE_DIVIDER;

  const erc20 = new Contract(debtAsset, erc20Abi, lambdaWallet);

  const txApprove = await erc20.approve(
    envParsed().POOL_ADDRESS,
    amountToLiquidate
  );

  const receipt = await txApprove.wait();

  return receipt.status === TX_SUCCESS;
}

export async function liquidationCall(
  {
    currentDebt,
    collateralAsset,
    debtAsset,
    borrowerUser,
    receiveAToken,
  }: ILiquidationCallParams,
  lambdaWallet: Signer
) {
  const pool = new Contract(
    envParsed().POOL_ADDRESS,
    poolMetadata.abi,
    lambdaWallet
  );

  const amountToLiquidate = BigInt(currentDebt) / LIQUIDATE_DIVIDER;

  const tx = await pool.liquidationCall(
    collateralAsset,
    debtAsset,
    borrowerUser,
    amountToLiquidate,
    receiveAToken
  );

  await tx.wait();

  return tx.hash;
}
