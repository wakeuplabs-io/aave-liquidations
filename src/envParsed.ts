import { z } from "zod";
import dotenv from "dotenv";
import { isAddress } from "ethers";

dotenv.config();

// NOTE: DO NOT destructure process.env

const env = {
  ACCOUNT_PRIVATE_KEY: process.env.ACCOUNT_PRIVATE_KEY,
  AWS_ACCOUNT_REGION: process.env.AWS_ACCOUNT_REGION,
  AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID:
    process.env.AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID,
  POOL_ADDRESS: process.env.POOL_ADDRESS,
  POOL_DATA_PROVIDER_ADDRESS: process.env.POOL_DATA_PROVIDER_ADDRESS,
  RPC_URL: process.env.RPC_URL,
};

const envSchema = z
  .object({
    ACCOUNT_PRIVATE_KEY: z.string().min(1),
    AWS_ACCOUNT_REGION: z.string().optional(),
    AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID: z.string().optional(),
    POOL_ADDRESS: z
      .string()
      .min(1)
      .refine((arg) => isAddress(arg)),
    POOL_DATA_PROVIDER_ADDRESS: z
      .string()
      .min(1)
      .refine((arg) => isAddress(arg)),
    RPC_URL: z.string().min(1).url(),
  })
  .required();

const envParsed = () => envSchema.parse(env);

export default envParsed;
