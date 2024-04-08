import { expect } from "chai";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  transfer,
  mintTo,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");

describe("Token Deployment", function () {
  this.timeout(10000); // Increase timeout for this test

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.local();
  const LAMPORTS_PER_SOL = 1000000000;
  const person1 = anchor.web3.Keypair.generate();
  const PaYeR = anchor.web3.Keypair.generate();
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintKeypairSC = anchor.web3.Keypair.generate();
  let mintSC: anchor.web3.PublicKey;
  let person1ATA;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        PaYeR.publicKey,
        2 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        mintAuthSC.publicKey,
        2 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        person1.publicKey,
        2 * LAMPORTS_PER_SOL
      )
    );

    // Stablecoin mint
    mintSC = await createMint(
      provider.connection,
      PaYeR,
      mintAuthSC.publicKey,
      mintAuthSC.publicKey,
      10,
      mintKeypairSC,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Initialise ATA
    person1ATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      PaYeR,
      mintSC,
      person1.publicKey
    );

    // Top up test account with SPL
    await mintTo(
      provider.connection,
      PaYeR,
      mintSC,
      person1ATA.address,
      mintAuthSC,
      100,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
  });

  it("is able to get associated token account", async function () {
    const person1ATA = await getAssociatedTokenAddress(
      mintSC,
      person1.publicKey
    );

    const account = await getAccount(
      provider.connection,
      person1ATA,
      "processed",
      TOKEN_PROGRAM_ID
    );

    console.log("fetched person ata", person1ATA, account);
  });
});
