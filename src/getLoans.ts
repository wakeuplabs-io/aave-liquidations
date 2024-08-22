import poolMetadata from "./abis/Pool-Implementation.json" assert { type: "json" };
import { Contract, Signer, EventLog } from "ethers";
import dataProviderMetadata from "./abis/PoolDataProvider-Polygon.json" assert { type: "json" };
import envParsed from "./envParsed";

async function getUsersFromEvents(lambdaWallet: Signer) {
  const pool = new Contract(
    envParsed().POOL_ADDRESS,
    poolMetadata.abi,
    lambdaWallet
  );

  const depositFilter = pool.filters.Supply();
  const borrowFilter = pool.filters.Borrow();

  const deposits = await pool.queryFilter(depositFilter);
  const borrows = await pool.queryFilter(borrowFilter);

  const userSet = new Set<string>();

  deposits.forEach((event) => {
    if (!(event instanceof EventLog)) return;
    userSet.add(event.args.user.toString());
  });
  borrows.forEach((event) => {
    if (!(event instanceof EventLog)) return;
    userSet.add(event.args.user.toString());
  });

  return Array.from(userSet);
}

async function getUserReservesData(user: string, lambdaWallet: Signer) {
  const poolDataProviderContract = new Contract(
    envParsed().POOL_DATA_PROVIDER_ADDRESS,
    dataProviderMetadata.abi,
    lambdaWallet
  );

  const reservesList = await poolDataProviderContract.getAllReservesTokens(); // Get all reserve tokens
  const userReservesData = [];

  for (const reserve of reservesList) {
    const userReserveData = await poolDataProviderContract.getUserReserveData(
      reserve.tokenAddress,
      user
    );
    const { currentATokenBalance, currentStableDebt, currentVariableDebt } =
      userReserveData;

    if (
      currentATokenBalance > BigInt(0) ||
      currentStableDebt > BigInt(0) ||
      currentVariableDebt > BigInt(0)
    ) {
      userReservesData.push({
        reserveToken: reserve.tokenAddress,
        collateralAsset:
          currentATokenBalance > BigInt(0) ? reserve.tokenAddress : null,
        debtAsset:
          currentStableDebt > BigInt(0) || currentVariableDebt > BigInt(0)
            ? reserve.tokenAddress
            : null,
      });
    }
  }

  return userReservesData;
}

type LoanToLiquidate = {
  currentDebt: bigint;
  collateralAsset: string | null;
  debtAsset: string | null;
  borrowerUser: string;
  receiveAToken: boolean;
};

export default async function getLoansToLiquidate(lambdaWallet: Signer) {
  const pool = new Contract(
    envParsed().POOL_ADDRESS,
    poolMetadata.abi,
    lambdaWallet
  );

  const users = await getUsersFromEvents(lambdaWallet);

  const loansToLiquidate: LoanToLiquidate[] = [];

  for (const user of users) {
    const userData = await pool.getUserAccountData(user);
    const healthFactor = BigInt(userData.healthFactor);

    if (healthFactor < 1000000000000000000n) {
      // healthFactor < 1.0
      const currentDebt = userData.totalDebtETH;

      const userReserves = await getUserReservesData(user, lambdaWallet);

      userReserves.forEach((reserve) => {
        if (reserve.collateralAsset && reserve.debtAsset) {
          loansToLiquidate.push({
            currentDebt,
            collateralAsset: reserve.collateralAsset,
            debtAsset: reserve.debtAsset,
            borrowerUser: user,
            receiveAToken: false, // Based on liquidation logic
          });
        }
      });
    }
  }

  return loansToLiquidate;
}
