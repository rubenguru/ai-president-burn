// polyfill buffer
import { Buffer } from "buffer";

// imports
import React, { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor";

import "./App.css";
import "./FighterBoost.css";

import idl from "./idl.json"; //copy from target folder inside idl.json
import { set } from "@coral-xyz/anchor/dist/cjs/utils/features";

// NOTE: DO NOT DELETE THIS LINE BELOW
window.Buffer = Buffer;
// NOTE: DO NOT DELETE THE LINE ABOVE

const MINT_PK = new PublicKey("9sX68oTiAJSrmWtMeJY3CjfDjc22LQ7QveqKJzcHigMX");
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");

const opts = {
  preflightCommitment: "processed",
};
const seeds = [];
const [votesStorageKey, _bump] = web3.PublicKey.findProgramAddressSync(
  seeds,
  programID
);
const connection = new Connection(network, opts.preflightCommitment);

const provider = new AnchorProvider(
  connection,
  window.solana,
  opts.preflightCommitment
);

const program = new Program(idl, programID, provider);

const { SystemProgram, Keypair } = web3;

const App = () => {
  const [walletAddress, setWalletAdresss] = useState("");
  const [associatedTokenAccountAddress, setAssociatedTokenAccountAddress] =
    useState("");
  const [associatedTokenAccountBalance, setAssociatedTokenAccountBalance] =
    useState(0n);

  const [aVotesCount, setAVotesCount] = useState(-1);
  const [bVotesCount, setBVotesCount] = useState(-1);

  const [aToBurnCount, setAToBurnCount] = useState(100);
  const [bToBurnCount, setBToBurnCount] = useState(100);

  const [loading, setLoading] = useState(false);
  const [aVoteLoading, setAVoteLoading] = useState(false);
  const [bVoteLoading, setBVoteLoading] = useState(false);

  useEffect(() => {
    const onLoad = () => {
      checkIfWalletConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // loading the program
  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    fetchAssociatedTokenAccountAndBalance();
  }, [walletAddress]);

  useEffect(() => {
    fetchVotes();
  }, []);

  async function fetchAssociatedTokenAccountAndBalance() {
    const associatedToken = await getAssociatedTokenAddress(
      MINT_PK,
      new PublicKey(walletAddress)
    );
    // console.log("associatedToken", associatedToken);

    try {
      const tokenAccount = await getAccount(
        connection,
        associatedToken,
        TOKEN_PROGRAM_ID
      );
      setAssociatedTokenAccountAddress(tokenAccount.address.toString());
      setAssociatedTokenAccountBalance(tokenAccount.amount);
      // console.log("tokenAccount", tokenAccount, tokenAccount.amount);
    } catch (err) {
      // console.error("Error fetching associated token account:", err);
    }
  }

  async function fetchVotes() {
    const votes = await program.account.votesStorageAccount.fetch(
      votesStorageKey
    );
    // console.log("votesData", votes);
    setAVotesCount(votes.totalVotesA.toString());
    setBVotesCount(votes.totalVotesB.toString());
  }

  const checkIfWalletConnected = async () => {
    const { solana } = window;
    try {
      setLoading(true);
      if (solana) {
        if (solana.isPhantom) {
          // console.log("phatom is connected");
          const response = await solana.connect({
            onlyIfTrusted: true, //second time if anyone connected it won't show anypop on screen
          });
          setWalletAdresss(response.publicKey.toString());
          // console.log("public key", response.publicKey);
        }
      }
    } catch (err) {
      // console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    try {
      setLoading(true);
      if (solana) {
        const response = await solana.connect(); //to disconnect use "solana.disconnect()"
        setWalletAdresss(response.publicKey.toString());
      } else {
        alert("Please Install Solana's Phantom Wallet");
      }
    } catch (err) {
      // console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const voteForTremp = async () => {
    try {
      setAVoteLoading(true);

      if (!aToBurnCount) {
        alert("Please enter the amount to vote");
        throw new Error("Amount to vote not provided");
      }

      await sendVoteTransaction("a", solToBnLamports(aToBurnCount)); // TODO: get the amount from input
      // console.log("Vote for Tremp confirmed");
      fetchVotes();
      fetchAssociatedTokenAccountAndBalance();
    } catch (err) {
      console.error("Error voting for Tremp:", err);
    } finally {
      setAVoteLoading(false);
    }
  };

  const voteForBoden = async () => {
    try {
      setBVoteLoading(true);

      if (!bToBurnCount) {
        alert("Please enter the amount to vote");
        throw new Error("Amount to vote not provided");
      }

      await sendVoteTransaction("b", solToBnLamports(bToBurnCount));

      // console.log("Vote for Boden confirmed");
      fetchVotes();
      fetchAssociatedTokenAccountAndBalance();
    } catch (err) {
      console.error("Error voting for Boden:", err);
    } finally {
      setBVoteLoading(false);
    }
  };

  const sendVoteTransaction = async (candidate, amount) => {
    const transaction = new web3.Transaction();

    const method = candidate === "a" ? "voteForA" : "voteForB";

    let txInstruction = await program.methods[method](amount)
      .accountsStrict({
        mint: MINT_PK,
        tokenProgram: TOKEN_PROGRAM_ID,
        from: new PublicKey(associatedTokenAccountAddress),
        authority: new PublicKey(walletAddress),
        votesStorageAccount: votesStorageKey,
      })
      .instruction();
    transaction.add(txInstruction);

    let latestBlockhash = await connection.getLatestBlockhash("finalized");
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = new PublicKey(walletAddress);

    const signed = await provider.wallet.signTransaction(
      transaction,
      connection
    );

    const tx = await connection.sendRawTransaction(signed.serialize());
    // console.log("Vote transaction:", tx);
    await connection.confirmTransaction(tx);
  };

  function formatLamports(lamports) {
    if (lamports < 0) {
      return "Loading...";
    }
    return new Intl.NumberFormat("en-US").format(bnLamportsToSol(lamports));
  }

  function bnLamportsToSol(lamports) {
    const bnLamports = new BN(lamports);
    return bnLamports.div(new BN(web3.LAMPORTS_PER_SOL)).toNumber();
  }

  function solToBnLamports(sol) {
    const bigintSol = new BN(sol);
    return bigintSol.mul(new BN(web3.LAMPORTS_PER_SOL));
  }

  function getPersentsForCandidate(candidate) {
    const trempVotes = parseInt(formatLamports(aVotesCount).replace(',', ''));
    const bodenVotes = parseInt(formatLamports(bVotesCount).replace(',', ''));

    // Sum the votes for all candidates
    const totalVotes = trempVotes + bodenVotes;

    // Check if totalVotes is not 0 to avoid division by zero
    if (totalVotes === 0) {
      return 0; // Or any appropriate value/error handling
    }

    let percentage = 0;
    switch (candidate) {
      case "Boden":
        // Calculate the percentage of votes for Boden
        percentage = (bodenVotes / totalVotes) * 100;
        break;

      case "Tremp":
        // Calculate the percentage of votes for Tremp
        percentage = (trempVotes / totalVotes) * 100;
        break;

      default:
        return 0; // Or any appropriate value/error handling for unknown candidates
    }

    // Round to 2 decimal places and convert back to a number
    return parseFloat(percentage.toFixed(2));
  }

  return (
    <div className="App">
      <div className="header-container">
        <div className="container">
          <div className="header">
            <h1>Burn for your Fighter</h1>
          </div>
          <div className="description">
            <p>
              <span>Burn $AIPRESIDENT tokens</span> - boost your fighter and receive a ticket for every 300 tokens burned.
            </p>
            <p>
              Each ticket will increase your chance of winning the upcoming AirDrop.
            </p>
          </div>
          {!loading ? (
            <div>
              {!walletAddress && (
                <button
                  className="cta-button connect-wallet-button"
                  onClick={!walletAddress ? connectWallet : undefined}
                >
                  <span> Connect Wallet </span>
                </button>
              )}
            </div>
          ) : (
            <button className="cta-button connect-wallet-button">
              Loading...
            </button>
          )}
          {walletAddress && (
            <div className="wallet-adress">
              <pre>
                Your Wallet address:{" "}
                <span className="wallet-address">{walletAddress}</span>
              </pre>
              <pre>
                Your Balance:{" "}
                <span className="wallet-address">
                  {formatLamports(associatedTokenAccountBalance)}
                </span>{" "}
                $AIPRESIDENT
              </pre>
            </div>
          )}
          <main className="main-container">
            <div className="candidate">
              {walletAddress && (
                <>
                  <h2>AI Tremp</h2>
                  <div className="votesFor">
                    {associatedTokenAccountBalance > 0 ? (
                      <>
                        <input
                          class="vote-input"
                          type="number"
                          placeholder="Amount to vote"
                          value={aToBurnCount}
                          onChange={(e) => setAToBurnCount(e.target.value)}
                        />
                        <button
                          className="cta-button mint-button"
                          onClick={voteForTremp}
                          disabled={aVoteLoading}
                        >
                          {aVoteLoading ? "Voting for Tremp..." : "Vote for Tremp!"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="cta-button mint-button">
                          Buy $AIPRESIDENT to vote!
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="candidate">
              {walletAddress && (
                <>
                  <h2>AI Boden</h2>
                  <div className="votesFor">
                    {associatedTokenAccountBalance > 0 ? (
                      <>
                        <input
                          class="vote-input"
                          type="number"
                          placeholder="Amount to vote"
                          value={bToBurnCount}
                          onChange={(e) => setBToBurnCount(e.target.value)}
                        />
                        <button
                          className="cta-button mint-button"
                          onClick={voteForBoden}
                          disabled={bVoteLoading}
                        >
                          {bVoteLoading ? "Voting for Boden..." : "Vote for Boden!"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="cta-button mint-button">
                          Buy $AIPRESIDENT to vote!
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      <div className="utility-container">
        <div className="vote-stats">
          <div className="vote-line">
            <div className="vote-percentage red" style={{ width: `${getPersentsForCandidate("Tremp")}%` }} >🍆 {getPersentsForCandidate("Tremp") || "Loading..."}%</div>
            <div className="vote-percentage blue" style={{ width: `${getPersentsForCandidate("Boden")}%` }} >🍆 {getPersentsForCandidate("Boden") || "Loading..."}%</div>
          </div>
          <div className="columns-text-image">
            <div className="column-text ai-tremp">
              <p>AI TREMP</p>
            </div>
            <div className="column-text ai-boden">
              <p>AI BODEN</p>
            </div>
          </div>
          <div className="stats">
            <div className="stat-item stat-item-tremp">
              <img src="tremp.png" alt="Candidate" />
              <div className="stat-item-text">
                <div className="tokens-burned">Tokens burned:</div>
                <div className="amount coming-soon redText">{formatLamports(aVotesCount)}</div>
              </div>
            </div>
            <div className="stat-item stat-item-boden">
              <div className="stat-item-text">
                <div className="tokens-burned">Tokens burned:</div>
                <div className="amount coming-soon blueText" >{formatLamports(bVotesCount)}</div>
              </div>
              <img src="boden.png" alt="Candidate" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
