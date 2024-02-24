import { web3, Program, BN } from "@coral-xyz/anchor";
import { GrandBazaar } from "../gb/types/grand_bazaar";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

import { PublicKey } from "@solana/web3.js";

import { createSignerFromKeypair, generateSigner, keypairIdentity } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, mplBubblegum , MPL_BUBBLEGUM_PROGRAM_ID} from '@metaplex-foundation/mpl-bubblegum'

import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID } from "@solana/spl-account-compression";
import { MintedCollection } from "./types";
import lightDasApi from "../axios/lightdas";
const { serializeUint64, ByteifyEndianess } = require("byteify");

interface MintItemAccountTypes {
    connection: web3.Connection,
    signerBuffer: Uint8Array,
    program: Program<GrandBazaar>,
    gameId: bigint,
    collection: MintedCollection,
    accountData: {
        itemCollection: string,
        amount: string
    }
}

const DEFAULT_BUBBLEGUM_SIGNER = "4ewWZC5gT6TGpm5LZNDs9wVonfUT2q5PP5sc9kVbwMAK";

const mintItemAccountLogic = async (
    { connection, signerBuffer, program, collection, gameId, accountData }: MintItemAccountTypes) => {
    const SIGNER = web3.Keypair.fromSecretKey(signerBuffer);
    const gameIdBuffer = Uint8Array.from(serializeUint64(gameId, { endianess: ByteifyEndianess.LITTLE_ENDIAN }));
    
    const umi = createUmi(connection).use(mplBubblegum());
    const myKeypair = umi.eddsa.createKeypairFromSecretKey(signerBuffer);
    const myKeypairSigner = createSignerFromKeypair(umi, myKeypair);
    umi.use(keypairIdentity(myKeypairSigner));

    //create merkle tree
    const merkleTree = generateSigner(umi);
    const builder = await createTree(umi, {
        merkleTree,
        maxDepth: 14, //this tree would allow us around 10k item accounts to be minted
        maxBufferSize: 64,
    });
    await builder.sendAndConfirm(umi);

    // add merkle tree to lightdas for monitoring
    await lightDasApi.post('/addMerkleTree', {
        tree: new PublicKey(merkleTree.publicKey)
    });

    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
        [new PublicKey(merkleTree.publicKey).toBuffer()],
        new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID.toString()),
    );

    const gamePdaAddress = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), gameIdBuffer],
        program.programId
    )[0];

    // Item data

    const dataStr = JSON.stringify(accountData);
    const init_data = new TextEncoder().encode(dataStr);

    // has to be smaller than 200 bytes
    if (init_data.length > 199) {
        throw new Error("init_data exceeds the maximum allowed length.");
    }

    console.log("tree auth: ", treeAuthority);
    console.log("tree address: ", merkleTree.publicKey);

    const ix = await program.methods.mintItemAccount(new BN(gameId.toString()), Buffer.from(init_data)).accounts({
        signer: SIGNER.publicKey,
        systemProgram: web3.SystemProgram.programId,
        game: gamePdaAddress,
        itemCollectionMint: collection.mintKey,
        itemCollectionMetadata: collection.metadataAccount,
        itemCollectionEdition: collection.masterEditionAccount,
        treeAuthority: treeAuthority,
        newLeafOwner: SIGNER.publicKey,
        merkleTree: new PublicKey(merkleTree.publicKey),
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
        mplProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        bubblegumSigner: DEFAULT_BUBBLEGUM_SIGNER
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
    // console.log("META ACCOUNT: ", collection.metadataAccount.toString());
    // console.log(await connection.simulateTransaction(tx));
    const txSig = await connection.sendTransaction(tx);
    // console.log("TX SIG: ", txSig);
    return true;
};

export default mintItemAccountLogic;