import { ZeroAddress } from "ethers";

enum eNetwork {
  BOB = "BOB",
  BOBTestnet = "BOBTestnet",
}

const ReserveAssets: {
  [key in eNetwork]: {
    DAI: string;
    USDT: string;
  };
} = {
  [eNetwork.BOB]: {
    DAI: ZeroAddress,
    USDT: ZeroAddress,
  },
  [eNetwork.BOBTestnet]: {
    DAI: ZeroAddress,
    USDT: ZeroAddress,
  },
};

export default ReserveAssets;
