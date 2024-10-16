import { ethers } from "ethers";
import envParsed from "./envParsed.js";
import { Provider } from "ethers";

export const getAssetPrice = async (provider: Provider, asset: string) => {
  const oracleContract = new ethers.Contract(
    envParsed().AAVE_ORACLE_ADDRESS,
    ["function getAssetPrice(address asset) view returns (uint256)"],
    provider
  );

  return (await oracleContract.getAssetPrice(asset)) as BigInt;
};
