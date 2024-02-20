import { web3 } from "@coral-xyz/anchor";

export type InitializedGameType = {
  gamePdaAddress: web3.PublicKey,
  gameMintKey: web3.PublicKey,
  gameATA: web3.PublicKey,
  gameId: bigint,
}

export type MintedCollection = {
  mintKey: web3.PublicKey,
  metadataAccount: web3.PublicKey,
  masterEditionAccount: web3.PublicKey
}