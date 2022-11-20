import React, { useEffect, useState } from 'react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

const { SystemProgram } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey("7nZERk2LZF1bJDQzV4H2VaoYxLQ5uivr7xagMVvsuQ8X");
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}

// TODO: update with my website details
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddresss] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    if (window?.solana?.isPhantom) {
      console.log('Phantom wallet found!');
      const response = await window.solana.connect({ onlyIfTrusted: true });
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddresss(response.publicKey.toString());
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻');
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key: ', response.publicKey.toString());
      setWalletAddresss(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return
    }
    setInputValue("");
    console.log("Gif link: ", inputValue);
    try {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program: ", inputValue)
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF: ", error)
    }
  };

  const vote = async (gifId) => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.vote(gifId, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Successful voting on: ", gifId)
      await getGifList();
    } catch (error) {
      console.log("Error voting: ", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString());
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account: ", error);
    }
  };

  const renderNotConnectedContainer = () => {
    return <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  };

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return(
        <div className='connected-container'>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }} >
              <input 
                type="text" 
                placeholder="Enter gif link"
                value={inputValue}
                onChange={onInputChange} 
              />
              <button type="submit" className='cta-button submit-gif-button'>Submit</button>
            </form>
          <div className='gif-grid'>
            {gifList.map((item, index) => (
              <div className='gif-item' key={index}>
                <img src={item.gifLink} alt=""/>
                <p className="white-text">Owner:{" " + item.userAddress.toString()}</p>
                <p className='white-text'>Votes:{" " + item.votes.toString()}</p>
                <button key="vote" className='cta-button submit-gif-button' onClick={() => {vote(item.gifLink)}}>Vote</button>
              </div>
            ))}
          </div>
        </div>)
    }
  };

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl, programID, getProvider());
  };

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account: ", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : "container"}>
        <div className="header-container">
          <p className="header">🖼 Surfing GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
