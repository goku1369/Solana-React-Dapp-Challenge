import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

  const [receiverPublicKey, setReceiverPublicKey] = useState<PublicKey | undefined>(
    undefined
  );

  const [senderKeypair, setSenderKeypair] = useState<Keypair | undefined>(
    undefined
  );

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    const provider = getProvider();
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        break;
    }
  };

  const createSender = async () => {
    try {
      const newPair = Keypair.generate();
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      setSenderKeypair(newPair);

      const fromAirDropSignature = await connection.requestAirdrop(
        newPair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature, "confirmed");

      showToast("Airdrop successful.", 'success');
      console.log('Wallet Balance: ' + (await connection.getBalance(newPair.publicKey)) / LAMPORTS_PER_SOL);
    } catch (err) {
      showToast("Airdrop error: " + (err as Error).message, 'error');
    }
  }

  const connectWallet = async () => {
      // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        const response = await solana.connect();
        setReceiverPublicKey(new PublicKey(response.publicKey));
        showToast("Connected to Phantom wallet.", 'success');
      } catch (err) {
        showToast("Error connecting to Phantom wallet: " + (err as Error).message, 'error');
      }
    }
  };

  const disconnectWallet = async () => {
      // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        solana.disconnect();
        setReceiverPublicKey(undefined);
        showToast("Wallet disconnected.", 'success');
      } catch (err) {
        showToast("Error disconnecting wallet: " + (err as Error).message, 'error');
      }
    }
  };

  const transferSol = async () => {
    if (!receiverPublicKey) {
      showToast("Receiver public key is undefined", 'error');
      return;
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const from = Keypair.fromSecretKey(senderKeypair!.secretKey);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: receiverPublicKey,
          lamports: 1 * LAMPORTS_PER_SOL,
        })
      );

      console.log("Sending transaction...");
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [from],
        { commitment: "confirmed" }
      );

      showToast("Transaction confirmed with signature: " + signature, 'success');
      console.log("Sender Balance:", await connection.getBalance(from.publicKey) / LAMPORTS_PER_SOL);
      console.log("Receiver Balance:", await connection.getBalance(receiverPublicKey) / LAMPORTS_PER_SOL);
    } catch (error) {
      showToast("Error sending transaction: " + error, 'error');
    }
  };
  

  return (
    <div className="App">
      <header className="App-header">
        <h2>Module 2 Assessment</h2>
        <span className="buttons">
          <button
            onClick={createSender}
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
              margin: "5px",
              background: "#4CAF50", /* Green */
              color: "white",
              border: "none",
              textAlign: "center",
              textDecoration: "none",
              display: "inline-block",
              transitionDuration: "0.4s",
              cursor: "pointer",
            }}
          >
            Create a New Solana Account
          </button>
          {provider && !receiverPublicKey && (
            <button
              onClick={connectWallet}
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
                margin: "5px",
                background: "#008CBA", /* Blue */
                color: "white",
                border: "none",
                textAlign: "center",
                textDecoration: "none",
                display: "inline-block",
                transitionDuration: "0.4s",
                cursor: "pointer",
              }}
            >
              Connect to Phantom Wallet
            </button>
          )}
          {provider && receiverPublicKey && (
            <div>
              <button
                onClick={disconnectWallet}
                style={{
                  fontSize: "16px",
                  padding: "15px",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  margin: "5px",
                  background: "#f44336", /* Red */
                  color: "white",
                  border: "none",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "inline-block",
                  transitionDuration: "0.4s",
                  cursor: "pointer",
                }}
              >
                Disconnect from Wallet
              </button>
            </div>
          )}
          {provider && receiverPublicKey && senderKeypair && (
            <button
              onClick={transferSol}
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
                margin: "5px",
                background: "#4CAF50", /* Green */
                color: "white",
                border: "none",
                textAlign: "center",
                textDecoration: "none",
                display: "inline-block",
                transitionDuration: "0.4s",
                cursor: "pointer",
              }}
            >
              Transfer SOL to Phantom Wallet
            </button>
          )}
        </span>
        {!provider && (
          <p>
            No provider found. Install{' '}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
        <ToastContainer />
      </header>
    </div>
  );
}
