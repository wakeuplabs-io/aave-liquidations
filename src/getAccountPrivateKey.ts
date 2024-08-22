/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as dotenv from 'dotenv';

dotenv.config();

const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY;
const AWS_ACCOUNT_REGION = process.env.AWS_ACCOUNT_REGION!;
const AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID = process.env.AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID!;

export const getAccountPrivateKey = async () => {
    console.log('AWS_ACCOUNT_REGION', AWS_ACCOUNT_REGION);

    if (ACCOUNT_PRIVATE_KEY) {
        return ACCOUNT_PRIVATE_KEY;
    }

    const client = new SecretsManagerClient({
        region: AWS_ACCOUNT_REGION,
    });

    let response;

    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID,
                VersionStage: 'AWSCURRENT',
            }),
        );
    } catch (error) {
        throw error;
    }

    return JSON.parse(response.SecretString!)[AWS_ACCOUNT_PRIVATE_KEY_SECRET_ID];
};
