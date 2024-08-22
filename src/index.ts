import * as dotenv from "dotenv";
import { getAccountPrivateKey } from "./getAccountPrivateKey.js";
import { JsonRpcProvider, Wallet } from "ethers";
import {
  liquidationCall,
  approveForLiquidation,
  checkAllowance,
} from "./liquidationCall.js";
import getLoansToLiquidate from "./getLoans.js";

dotenv.config();

const RPC_URL = process.env.RPC_URL!;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function execute() {
  const accountPrivateKey = await getAccountPrivateKey();

  const provider = new JsonRpcProvider(RPC_URL);

  const lambdaWallet = new Wallet(accountPrivateKey, provider);

  console.log("Lambda wallet: ", lambdaWallet.address);

  while (1 === 1) {
    try {
      const loansToLiquidate = await getLoansToLiquidate(lambdaWallet);

      for (let index = 0; index < loansToLiquidate.length; index++) {
        const loan = loansToLiquidate[index];

        console.log("Loan: ", loan);

        try {
          const { approved } = await checkAllowance(
            {
              currentDebt: loan.currentDebt,
              collateralAsset: loan.collateralAsset,
              debtAsset: loan.debtAsset,
              borrowerUser: loan.borrowerUser,
              receiveAToken: loan.receiveAToken,
            },
            lambdaWallet
          );

          console.log("is already approved", approved);

          if (!approved) {
            await approveForLiquidation(
              {
                currentDebt: loan.currentDebt,
                collateralAsset: loan.collateralAsset,
                debtAsset: loan.debtAsset,
                borrowerUser: loan.borrowerUser,
                receiveAToken: loan.receiveAToken,
              },
              lambdaWallet
            );

            console.log("approved!");
          }

          const txHash = await liquidationCall(
            {
              currentDebt: loan.currentDebt,
              collateralAsset: loan.collateralAsset,
              debtAsset: loan.debtAsset,
              borrowerUser: loan.borrowerUser,
              receiveAToken: loan.receiveAToken,
            },
            lambdaWallet
          );

          console.log("Liquidated!", txHash);
        } catch (error) {
          console.error("Couldn't liquidate, error: ", error);
        }
      }

      console.log("waiting...");

      await sleep(60000);
    } catch (error) {
      console.error("Failed with error: ", error);
    }
  }

  console.log("done!");
}

execute();
