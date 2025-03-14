import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import LinearProgress from '@mui/material/LinearProgress';
import { Connection, clusterApiUrl, PublicKey, Transaction } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
// import kp from './keypair.json';
import profilepic from './assets/profilepic.webp';
import './App.css';

const { SystemProgram } = web3;
// const arr = Object.values(kp._keypair.secretKey);
const arr = Object.values(JSON.parse(process.env.REACT_APP_SOLANA_KEYPAIR)._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey("7nZERk2LZF1bJDQzV4H2VaoYxLQ5uivr7xagMVvsuQ8X");
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}

const PERSONAL_LINK = 'https://redgraz.vercel.app/';

const App = () => {
  const [walletAddress, setWalletAddresss] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
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
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error sending GIF: ", error)
    }
  };

  const vote = async (gifId) => {
    try {
      setLoading(true);
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
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error voting: ", error)
    }
  };

  

  const sendSol = async (to) => {

    try {
      setLoading(true);
     const receiver = new PublicKey(to);
     const provider = getProvider();
     const connection = new Connection(network, opts.preflightCommitment);
     let transaction = new Transaction();

      // Add instructions to the tx
     transaction.add(
          SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: receiver,
          lamports: 10000000,
          })
      );
  
      // Get the TX signed by the wallet (signature stored in-situ)
      let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.wallet.publicKey;
      await provider.wallet.signTransaction(transaction);

      // Send the TX to the network
      connection.sendRawTransaction(transaction.serialize())
      .then(id => {
        console.log(`Transfer tx: https://explorer.solana.com/tx/${id}?cluster=devnet`);
        connection.confirmTransaction(id)
        .then((confirmation) => {
            console.log(`Confirmation slot: ${confirmation.context.slot}`);
            setLoading(false);
        });      
      });
    } catch (error) {
      setLoading(false);
      console.log("Error sending SOL: ", error);
    }
  }

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
      setLoading(true);
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
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
                placeholder="Enter Surfing GIF link"
                value={inputValue}
                onChange={onInputChange} 
              />
              <button type="submit" className='cta-button submit-gif-button'>Submit</button>
            </form>
            <Grid key="overarchingGrid" container spacing={ 6 } mdOffset={ 1.5 }>
              {gifList.map((item, index) => (
                <Grid key={"GridItem" + index} xs={5}>
                  <Card sx={{ boxShadow: 20, border: '2px solid', borderRadius: '10px' }}>
                    <CardMedia key="media"
                      component="img"                     
                      height="300"
                      image={item.gifLink}
                      alt="gif"
                    />
                    <CardContent key="content">               
                      <Typography key="votes" align="left" gutterBottom variant="h5" component="div">
                      💌{item.votes.toString()}
                      </Typography>  
                      <Typography key="owner" variant="caption" color="text.secondary">
                        Owner:{" " + item.userAddress.toString()}
                      </Typography>                
                    </CardContent>
                    <CardActions key="buttons" sx={{ bgcolor: "#E8E8E8" }}>                     
                      <button key="vote" className='cta-button submit-gif-button' onClick={() => {vote(item.gifLink)}}>
                        👍
                      </button>
                      <button key="tip" className='cta-button submit-gif-button' onClick={() => {sendSol(item.userAddress)}}>
                        Tip 0.01 SOL
                      </button>
                    </CardActions>
                  </Card>
                  {loading && <LinearProgress />}
                </Grid>
            ))}
          </Grid>
        </div>)
    }
  };

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl, programID, getProvider());
  };

  const getGifList = async () => {
    try {
      setLoading(true);
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account: ", account);
      setGifList(account.gifList);
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
      {loading && <LinearProgress />}
      <div className={walletAddress ? 'authed-container' : "container"}>
        <div className="header-container">
          <p className="header">🖼 🏄‍♂️ Surfing GIF Portal</p>
          <p className="sub-text">
            Enter GIF link or vote or tip your fave ✨
          </p>  
          {!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer()}       
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={profilepic} />
          <a
            className="footer-text"
            href={PERSONAL_LINK}
            target="_blank"
            rel="noreferrer"
          >built by redgraz</a>
        </div>
      </div>
    </div>
  );
};

export default App;
