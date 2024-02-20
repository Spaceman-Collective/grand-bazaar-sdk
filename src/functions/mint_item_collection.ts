import { Program, web3 } from "@coral-xyz/anchor";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { BN } from "bn.js";
import { GrandBazaar } from "../gb/types/grand_bazaar";
import { InitializedGameType } from "./types";

interface MintItemCollection {
  connection: web3.Connection,
  signerBuffer: Uint8Array,
  program: Program<GrandBazaar>,
  MPLProgram: web3.PublicKey,
  game: InitializedGameType,
  item: {
    itemId: bigint,
    name: string,
    symbol: string,
    uri: string
  }
}

const mintItemCollectionLogic = async (
  { connection, signerBuffer, game, MPLProgram, program, item }: MintItemCollection
) => {
  const SIGNER = web3.Keypair.fromSecretKey(signerBuffer);

  const itemMintKey = await createMint(connection, SIGNER, game.gamePdaAddress, game.gamePdaAddress, 0);
  const metadataAccount = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPLProgram.toBuffer(),
      itemMintKey.toBuffer()
    ],
    MPLProgram
  )[0];

  const masterEditionAccountAddress = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPLProgram.toBuffer(),
      itemMintKey.toBuffer(),
      Buffer.from("edition")
    ],
    MPLProgram
  )[0];

  const itemATA = (await getOrCreateAssociatedTokenAccount(connection, SIGNER, itemMintKey, game.gamePdaAddress, true)).address;

  const ix = await program.methods.mintItemCollection(new BN(game.gameId.toString()), {
    name: item.name,
    uri: item.uri,
    symbol: item.symbol,
    itemId: new BN(item.itemId.toString())
  }).accounts({
    signer: SIGNER.publicKey,
    systemProgram: web3.SystemProgram.programId,
    game: game.gamePdaAddress,
    gameCollectionMint: game.gameMintKey,
    itemAta: itemATA,
    mint: itemMintKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    metadataAccount: metadataAccount,
    mplProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
    rentAccount: web3.SYSVAR_RENT_PUBKEY,
    sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
    masterEditionAccount: masterEditionAccountAddress,
    ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID
  }).instruction();

  const { blockhash } = await connection.getLatestBlockhash();
  const msg = new web3.TransactionMessage({
    payerKey: SIGNER.publicKey,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message();

  const tx = new web3.VersionedTransaction(msg);
  tx.sign([SIGNER]);
  // console.log(Buffer.from(tx.serialize()).toString("base64"));
  // console.log(await connection.simulateTransaction(tx));
  const txSig = await connection.sendTransaction(tx);
  // console.log("Item Master Edition: ", masterEditionAccountAddress.toString());
  return { mintKey: itemMintKey, metadataAccount, masterEditionAccount: masterEditionAccountAddress }
}

export default mintItemCollectionLogic;