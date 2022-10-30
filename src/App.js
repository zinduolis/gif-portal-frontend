import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// TODO: update with my website details
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
	'https://media1.giphy.com/media/5nh8FKSRtxFEyuajGc/giphy.gif?cid=790b7611e4ebde1cb369aa4f7808a7f6f43ee81fc02de82a&rid=giphy.gif&ct=g',
	'https://media2.giphy.com/media/12VL9VvZ3ErqiQ/giphy.gif?cid=790b7611371a04aa044acd4e7d01e8ff50d8b9138e033d49&rid=giphy.gif&ct=g',
	'https://media2.giphy.com/media/l0HlxgojaVTyM7dNC/giphy.gif?cid=790b7611c831e93ad94356173229a0a7b17c676a48b3ce5a&rid=giphy.gif&ct=g',
	'https://media3.giphy.com/media/xX1dwuf8LN9YI/giphy.gif?cid=790b7611055caf52df1794fe7d308e0d309c64b9d0b11185&rid=giphy.gif&ct=g'
]

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
    if (inputValue.length > 0) {
      console.log('Gif link: ', inputValue);
      setGifList([...gifList, inputValue]);
      setInputValue('');
    } else {
      console.log('Empty input. Try again.');
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
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
        {gifList.map(gif => (
          <div className='gif-item' key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>)
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    const onLoad = async () => {
      console.log('Fetching GIF list...');
      //Call SOL program here
      setGifList(TEST_GIFS);
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
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
