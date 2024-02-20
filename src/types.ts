import { web3 } from '@coral-xyz/anchor';
import { Account } from '@solana/spl-token';

export interface ISDKProps {
    gameId: bigint,
    connection: web3.Connection
    signer: Uint8Array
}

export interface MintItemCollectionProps {
    game: {
        gamePdaAddress: web3.PublicKey,
        gameMintKey: web3.PublicKey,
        gameATA: Account
    },
    item: {
        name: string,
        symbol: string,
        uri: string
    }
}

export interface MintItemAccountProps {
    collection: {
        mintKey: web3.PublicKey,
        metadataAccount: web3.PublicKey,
        masterEditionAccount: web3.PublicKey
    },
    accountData: {
        itemCollection: string,
        amount: string
    }
}