import * as anchor from "@coral-xyz/anchor";
import fs from "fs";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { AiTrempVote } from "../target/types/ai_tremp_vote";

export const TOKEN_ADDRESS = new PublicKey(
  "9sX68oTiAJSrmWtMeJY3CjfDjc22LQ7QveqKJzcHigMX"
); // Convert the TOKEN_ADDRESS string to a PublicKey

const network = clusterApiUrl("devnet");
const connection = new Connection(network);
const privateKey = JSON.parse(
  fs.readFileSync("/Users/codingfu/.config/solana/tremp.json").toString()
);

const keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(privateKey));
const publicKey = keyPair.publicKey.toBase58();

console.log(publicKey);

const wallet = new anchor.Wallet(keyPair);

const provider = new anchor.AnchorProvider(connection, wallet, {});
anchor.setProvider(provider);

export const program = anchor.workspace.AiTrempVote as Program<AiTrempVote>;
console.log("The program ID is", program.programId.toBase58());

const seeds = [];
export const [votesStorageKey, _bump] =
  anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
console.log("the storage account address is", votesStorageKey.toBase58());
