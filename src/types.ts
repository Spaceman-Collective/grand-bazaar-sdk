import { web3 } from '@coral-xyz/anchor';
import { Account } from '@solana/spl-token';

export interface ISDKProps {
    connection: web3.Connection
    signer: Uint8Array
}

export interface InitializeGameProps {
    gameId: bigint
}

export interface MintItemCollectionProps {
    game: {
        gamePdaAddress: web3.PublicKey,
        gameMintKey: web3.PublicKey,
        gameATA: web3.PublicKey
        gameId: bigint,
    },
    item: {
        itemId: bigint,
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
    },
    gameId: bigint,
}