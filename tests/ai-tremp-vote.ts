import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AiTrempVote } from "../target/types/ai_tremp_vote";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const DEBUG = false;
const log = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

describe("ai-tremp-vote", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.local();
  const LAMPORTS_PER_SOL = 1000000000;
  const person1 = anchor.web3.Keypair.generate();
  const PaYeR = anchor.web3.Keypair.generate();
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintKeypairSC = anchor.web3.Keypair.generate();
  let mintSC: anchor.web3.PublicKey;
  let person1ATA;

  // initializing the program
  const program = anchor.workspace.AiTrempVote as Program<AiTrempVote>;
  log("The program ID is", program.programId.toBase58());
  const seeds = [];
  const [votesStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
    seeds,
    program.programId
  );
  log("the storage account address is", votesStorage.toBase58());

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
    log("The mint address is", mintSC.toBase58());
    log("Person1 public key is", person1.publicKey.toBase58());

    // Initialise ATA
    person1ATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      PaYeR,
      mintSC,
      person1.publicKey
    );
    log("The ATA address is", person1ATA.address.toBase58());

    // Top up test account with SPL
    const tx = await mintTo(
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

    // Wait for the transaction to finalize
    const finalized = await provider.connection.confirmTransaction(
      tx,
      "finalized"
    );

    if (finalized.value.err) {
      console.error(`Error finalizing transaction: ${finalized.value.err}`);
    } else {
      log("Transaction finalized successfully");
    }
  });

  describe("Initialize the program", () => {
    it("works", async () => {
      // Add your test here.
      const tx = await program.methods
        .initialize(mintSC)
        .accounts({
          votesStorageAccount: votesStorage,
        })
        .rpc();
      log("Your transaction signature", tx);
    });
  });

  describe("Voting logic", () => {
    it("vote_for_a with 10 tokens increases vote for A and burns tokens", async () => {
      const TOKEN_AMOUNT = new anchor.BN(10);

      const initialVotesStorage =
        await program.account.votesStorageAccount.fetch(votesStorage);

      console.log(
        "Initial votes for A",
        initialVotesStorage.totalVotesA.toString()
      );

      const initialTokenBalance =
        await program.provider.connection.getTokenAccountBalance(
          person1ATA.address
        );
      console.log("Initial token balance", initialTokenBalance.value.amount);

      await program.rpc.voteForA(TOKEN_AMOUNT, {
        accounts: {
          mint: mintSC,
          tokenProgram: TOKEN_PROGRAM_ID,
          from: person1ATA.address,
          authority: person1.publicKey,
          votesStorageAccount: votesStorage,
        },
        signers: [person1],
      });

      const finalVotesStorage = await program.account.votesStorageAccount.fetch(
        votesStorage
      );

      console.log(
        "Final votes for A",
        finalVotesStorage.totalVotesA.toString()
      );

      expect(Number(finalVotesStorage.totalVotesA.toNumber())).to.equal(
        TOKEN_AMOUNT.toNumber()
      );

      const finalTokenBalance =
        await program.provider.connection.getTokenAccountBalance(
          person1ATA.address
        );
      console.log("Final token balance", finalTokenBalance.value.amount);

      expect(Number(finalTokenBalance.value.amount)).to.equal(
        Number(initialTokenBalance.value.amount) - TOKEN_AMOUNT.toNumber()
      );
    });

    it("vote_for_b increases vote for B and burns tokens", async () => {
      const TOKEN_AMOUNT = new anchor.BN(10);

      const initialVotesStorage =
        await program.account.votesStorageAccount.fetch(votesStorage);

      console.log(
        "Initial votes for B",
        initialVotesStorage.totalVotesB.toString()
      );

      const initialTokenBalance =
        await program.provider.connection.getTokenAccountBalance(
          person1ATA.address
        );
      console.log("Initial token balance", initialTokenBalance.value.amount);

      await program.rpc.voteForB(TOKEN_AMOUNT, {
        accounts: {
          mint: mintSC,
          tokenProgram: TOKEN_PROGRAM_ID,
          from: person1ATA.address,
          authority: person1.publicKey,
          votesStorageAccount: votesStorage,
        },
        signers: [person1],
      });

      const finalVotesStorage = await program.account.votesStorageAccount.fetch(
        votesStorage
      );

      console.log(
        "Final votes for B",
        finalVotesStorage.totalVotesB.toString()
      );

      const finalTokenBalance =
        await program.provider.connection.getTokenAccountBalance(
          person1ATA.address
        );
      console.log("Final token balance", finalTokenBalance.value.amount);

      expect(Number(finalTokenBalance.value.amount)).to.equal(
        Number(initialTokenBalance.value.amount) - TOKEN_AMOUNT.toNumber()
      );
    });
  });
});
