import { Program, web3 } from '@coral-xyz/anchor';
import { ISDKProps, InitializeGameProps, MintItemAccountProps, MintItemCollectionProps } from "./types";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { GrandBazaar, IDL } from './gb/types/grand_bazaar';
import initializeGameLogic from './functions/initialize_game';
import mintItemCollectionLogic from './functions/mint_item_collection';
import mintItemAccountLogic from './functions/mint_item_account';


export const PROGRAM_ID = "BXNayNJzpQoWuAmXbj5gVMAAxVR8HqZWCtokuZM3kVAZ";

// initialize a game, return the needed variables
export default class GB {
    
    private connection: web3.Connection;
    private MPLProgram = new web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID.toString());
    private program: Program<GrandBazaar>;
    private SIGNER: Uint8Array;

    constructor(props: ISDKProps) {
        this.connection = props.connection;
        this.SIGNER = props.signer;
        this.program = new Program<GrandBazaar>(IDL, PROGRAM_ID , { connection: props.connection });
    }

    static get programId() {
        return PROGRAM_ID;
    }
    

    async initializeGame ({gameId}: InitializeGameProps) {
        return initializeGameLogic({
            connection: this.connection,
            signerBuffer: this.SIGNER,
            program: this.program,
            MPLProgram: this.MPLProgram,
            gameId: gameId
        });
    }

    async mintItemCollection ({game, item}: MintItemCollectionProps) {
        return mintItemCollectionLogic({
            connection: this.connection,
            signerBuffer: this.SIGNER,
            game,
            MPLProgram: this.MPLProgram,
            program: this.program,
            item
        });
    }

    async mintItemAccount({ collection, accountData, gameId }: MintItemAccountProps) {
        return mintItemAccountLogic({
            connection: this.connection,
            signerBuffer: this.SIGNER,
            gameId: gameId,
            program: this.program,
            collection,
            accountData
        });
    }

    // for a single tree address
    async getTreeData({ mtAddress }: any) {
        // setup through light das, provide this tree to lightDAS
    }
    
}

