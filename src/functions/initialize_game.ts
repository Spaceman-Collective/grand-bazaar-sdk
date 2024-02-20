import { BN, Program, web3 } from "@coral-xyz/anchor";
import { GrandBazaar } from "../gb/types/grand_bazaar";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { InitializedGameType } from "./types";

interface InitializeGameTypes {
    connection: web3.Connection,
    signerBuffer: Uint8Array,
    program: Program<GrandBazaar>,
    MPLProgram: web3.PublicKey,
    gameIdBuffer: Uint8Array,
    gameId: bigint
}

const initializeGameLogic = async (
    { connection, signerBuffer, program, MPLProgram, gameIdBuffer, gameId }: InitializeGameTypes) => {
    await new Promise((resolve) => setTimeout(resolve, 5000)); //wait for airdrop to go through
    const gamePdaAddress = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), gameIdBuffer],
        program.programId
    )[0];

    const SIGNER = web3.Keypair.fromSecretKey(signerBuffer);
    const gameMintKey = await createMint(connection, SIGNER, gamePdaAddress, gamePdaAddress, 0);
    const gameATA = (await getOrCreateAssociatedTokenAccount(connection, SIGNER, gameMintKey, gamePdaAddress, true)).address;

    const masterEditionAccountAddress = web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            MPLProgram.toBuffer(),
            gameMintKey.toBuffer(),
            Buffer.from("edition")
        ],
        MPLProgram
    )[0];

    const nftMetadataAccountAddress = web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            MPLProgram.toBuffer(),
            gameMintKey.toBuffer()
        ],
        MPLProgram
    )[0];

    const metadata = {
        gameId: new BN(gameId.toString()),
        name: "Legends of the Sun",
        symbol: "LOTS",
        uri: "https://example.com/game_metadata.json"
    };


    const ix = await program.methods.initGame(metadata).accounts({
        signer: SIGNER.publicKey,
        systemProgram: web3.SystemProgram.programId,
        game: gamePdaAddress,
        mint: gameMintKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataAccount: nftMetadataAccountAddress,
        mplProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        masterEditionAccount: masterEditionAccountAddress,
        ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        rentAccount: web3.SYSVAR_RENT_PUBKEY,
        gameAta: gameATA
    })
        .instruction();

    const { blockhash } =
        await connection.getLatestBlockhash();

    const msg = new web3.TransactionMessage({
        payerKey: SIGNER.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
    }).compileToV0Message();

    const tx = new web3.VersionedTransaction(msg);
    tx.sign([SIGNER])
    // console.log(Buffer.from(tx.serialize()).toString("base64"));
    // console.log(await connection.simulateTransaction(tx));
    const txSig = await connection.sendTransaction(tx)
    // console.log("TX SIG: ", txSig);
    // console.log("Game Master Edition: ", masterEditionAccountAddress.toString());
    return { gameMintKey, gameATA, gamePdaAddress } as InitializedGameType;
}

export default initializeGameLogic;  