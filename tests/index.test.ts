import GB from '../src/index';
import { randomU64 } from "./util";
import { web3 } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { InitializedGameType, MintedCollection } from "../src/functions/types";
import {describe, expect, test} from '@jest/globals';

const connection = new web3.Connection("http://localhost:8899", "confirmed");
const SIGNER = Uint8Array.from(JSON.parse(readFileSync('./keypairs/testing_pair.json').toString()));
connection.requestAirdrop(web3.Keypair.fromSecretKey(SIGNER).publicKey, 100 * web3.LAMPORTS_PER_SOL);
const gameId = randomU64();

const marketplace = new GB({
    connection,
    signer: SIGNER
});

describe("grand_bazaar", () => {

    let game: InitializedGameType;
    let collection: MintedCollection;

    test("initializes a game", async () => {
        game = await marketplace.initializeGame({ gameId });        
        expect(game).toBeTruthy();
        // could add more rigorous tests, but not necessary
        return game;
    }, 10000);

    test("mint item collection", async () => {
        collection = await marketplace.mintItemCollection({game, item: {
            name: "sword",
            itemId: randomU64(),
            uri:"https://123",
            symbol: "swd"
        }});
    }, 10000);

    test("mint item account", async () => {
        const itemAccount  = await marketplace.mintItemAccount({
            gameId,
            collection,
            accountData: {
                itemCollection: "sword",
                amount: "123"
            }
        });
        expect(itemAccount).toBeTruthy();
        return itemAccount;
    }, 10000);


    
});