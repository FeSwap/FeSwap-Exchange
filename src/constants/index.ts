import { ChainId, JSBI, Percent, Token, WETH, FESW_ADDRESS, GOVERNANCE_ADDRESS, TIMELOCK_ADDRESS, Fraction } from '@feswap/sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { FIVE_FRACTION, TEN_FRACTION, THOUSAND_FRACTION, TEN_THOUSAND_FRACTION, TWO_FRACTION, HUNDREAD_FRACTION } from '../utils'

import { fortmatic, injected, portis, walletconnect, walletlink } from '../connectors'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const FAKE_ADDRESS = '0xAffE3b84ed74870935B7dE70f057ac583c76CD88'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
// export const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin USDC')

/*
export const USDC:  { [chainId: number]: Token }  = {
  [ChainId.MAINNET]:  new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin USDC'),
  [ChainId.GÖRLI]:    new Token(ChainId.GÖRLI, '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C', 6, 'USDC', 'USD Coin USDC')
}
*/

export const NETWORK_NAME: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]:            'Ethereum',
  [ChainId.RINKEBY]:            'Ethereum Rinkeby Testnet',
  [ChainId.ROPSTEN]:            'Ethereum Ropsten Testnet',
  [ChainId.GÖRLI]:              'Ethereum Görli Testnet',
  [ChainId.KOVAN]:              'Ethereum Kovan Testnet',
  [ChainId.BSC]:                'Binance Smart Chain',
  [ChainId.BSC_TESTNET]:        'Binance Smart Chain Testnet',
  [ChainId.MATIC]:              'Ploygon mainnet',
  [ChainId.MATIC_TESTNET]:      'Ploygon Testnet',
  [ChainId.HARMONY]:            'Harmony mainnet',
  [ChainId.HARMONY_TESTNET]:    'Harmony Testnet',
  [ChainId.FANTOM]:             'Fantom mainnet',
  [ChainId.FANTOM_TESTNET]:     'Fantom Testnet',
  [ChainId.HECO]:               'Huobi ECO Chain',
  [ChainId.HECO_TESTNET]:       'Huobi ECO Chain Testnet',
  [ChainId.ARBITRUM]:           'Arbitrum mainnet',
  [ChainId.ARBITRUM_TESTNET]:   'Arbitrum Testnet',
  [ChainId.AVALANCHE]:          'Avalanche mainnet',
  [ChainId.AVALANCHE_TESTNET]:  'Avalanche Testnet',
  [ChainId.OKEX]:               'To Support Chain',
  [ChainId.OKEX_TESTNET]:       'To Support Test Chain',
  [ChainId.PALM]:               'To Support Chain',
  [ChainId.PALM_TESTNET]:       'To Support Test Chain',
  [ChainId.MOONBEAM]:           'To Support Test Chain',
  [ChainId.MOONRIVER]:          'To Support Chain',
  [ChainId.XDAI]:               'To Support Chain',
  [ChainId.CELO]:               'To Support Chain'
}

export const USDT:  { [chainId: number]: Token }  = {
      [ChainId.MAINNET]:  new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.ROPSTEN]:  new Token(ChainId.ROPSTEN, '0x110a13FC3efE6A245B50102D2d79B3E76125Ae83', 6, 'USDT', 'Tether USD'),
      [ChainId.RINKEBY]:  new Token(ChainId.RINKEBY, '0xD9BA894E0097f8cC2BBc9D24D308b98e36dc6D02', 6, 'USDT', 'Tether USD'),
      [ChainId.GÖRLI]:    new Token(ChainId.GÖRLI, '0xC73253A937F829aF45f86abC0a5C540373645f88', 6, 'USDT', 'Tether USD'),
      [ChainId.KOVAN]:    new Token(ChainId.KOVAN, '0x07de306FF27a2B630B1141956844eB1552B956B5', 6, 'USDT', 'Tether USD'),
      [ChainId.BSC]:      new Token(ChainId.BSC, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'Tether USD'),
      [ChainId.BSC_TESTNET]:      new Token(ChainId.BSC_TESTNET, '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', 18, 'USDT', 'Tether USD'),
      [ChainId.MATIC]:            new Token(ChainId.MATIC, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, 'USDT', 'Tether USD'),
      [ChainId.MATIC_TESTNET]:    new Token(ChainId.MATIC_TESTNET, '0x3813e82e6f7098b9583FC0F33a962D02018B6803', 6, 'USDT', 'Tether USD'),
      [ChainId.HARMONY]:          new Token(ChainId.HARMONY, '0x3C2B8Be99c50593081EAA2A724F0B8285F5aba8f', 6, 'USDT', 'Tether USD'),
      [ChainId.HARMONY_TESTNET]:  new Token(ChainId.HARMONY_TESTNET, '0xeabc1f3d0d8b6c8788f080d66b353b6124aa9aa5', 6, 'USDT', 'Tether USD'),
      [ChainId.FANTOM]:           new Token(ChainId.FANTOM, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.FANTOM_TESTNET]:   new Token(ChainId.FANTOM_TESTNET, '0xEAbC1f3d0D8b6C8788f080d66B353b6124Aa9AA5', 6, 'USDT', 'Tether USD'),
      [ChainId.HECO]:             new Token(ChainId.HECO, '0xa71edc38d189767582c38a3145b5873052c3e47a', 18, 'USDT', 'Tether USD'),
      [ChainId.HECO_TESTNET]:     new Token(ChainId.HECO_TESTNET, '0x04f535663110a392a6504839beed34e019fdb4e0', 6, 'USDT', 'Tether USD'),
      [ChainId.ARBITRUM]:         new Token(ChainId.ARBITRUM, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6, 'USDT', 'Tether USD'),
      [ChainId.ARBITRUM_TESTNET]: new Token(ChainId.ARBITRUM_TESTNET, '0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b', 6, 'USDT', 'Tether USD'),
      [ChainId.HARMONY_TESTNET]:  new Token(ChainId.HARMONY_TESTNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.AVALANCHE]:        new Token(ChainId.AVALANCHE, '0xde3A24028580884448a5397872046a019649b084', 6, 'USDT', 'Tether USD'),
      [ChainId.AVALANCHE_TESTNET]:new Token(ChainId.AVALANCHE_TESTNET, '0xFe143522938e253e5Feef14DB0732e9d96221D72', 6, 'USDT', 'Tether USD'),
      [ChainId.OKEX]:             new Token(ChainId.OKEX, '0x382bB369d343125BfB2117af9c149795C6C65C50', 6, 'USDT', 'Tether USD'),
      [ChainId.OKEX_TESTNET]:     new Token(ChainId.OKEX_TESTNET, '0xe579156f9dEcc4134B5E3A30a24Ac46BB8B01281', 6, 'USDT', 'Tether USD'),
      [ChainId.PALM]:             new Token(ChainId.PALM, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.PALM_TESTNET]:     new Token(ChainId.PALM_TESTNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.MOONBEAM]:         new Token(ChainId.MOONBEAM, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.MOONRIVER]:        new Token(ChainId.MOONRIVER, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.XDAI]:             new Token(ChainId.XDAI, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      [ChainId.CELO]:             new Token(ChainId.CELO, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
    }

  export const USDC: { [chainId in ChainId]: Token } = {
      [ChainId.MAINNET]:            new Token(ChainId.MAINNET,  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.ROPSTEN]:            new Token(ChainId.ROPSTEN,  '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', 6, 'USDC', 'USD Coin'),
      [ChainId.RINKEBY]:            new Token(ChainId.RINKEBY,  '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b', 6, 'USDC', 'USD Coin'),
      [ChainId.GÖRLI]:              new Token(ChainId.GÖRLI,    '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C', 6, 'USDC', 'USD Coin'),
      [ChainId.KOVAN]:              new Token(ChainId.KOVAN,    '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede', 6, 'USDC', 'USD Coin'),
      [ChainId.BSC]:                new Token(ChainId.BSC,      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USD Coin'),
      [ChainId.BSC_TESTNET]:        new Token(ChainId.BSC_TESTNET,      '0x64544969ed7EBf5f083679233325356EbE738930', 18, 'USDC', 'USD Coin'), 
      [ChainId.MATIC]:              new Token(ChainId.MATIC,            '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 6, 'USDC', 'USD Coin'),
      [ChainId.MATIC_TESTNET]:      new Token(ChainId.MATIC_TESTNET,    '0x4501A3bD995dadA98477a76E472CA186C6914B8B', 6, 'USDC', 'USD Coin'),
      [ChainId.HARMONY]:            new Token(ChainId.HARMONY,          '0x985458E523dB3d53125813eD68c274899e9DfAb4', 6, 'USDC', 'USD Coin'),
      [ChainId.HARMONY_TESTNET]:    new Token(ChainId.HARMONY_TESTNET,  '0x4501a3bd995dada98477a76e472ca186c6914b8b', 6, 'USDC', 'USD Coin'),
      [ChainId.FANTOM]:             new Token(ChainId.FANTOM,           '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', 6, 'USDC', 'USD Coin'),
      [ChainId.FANTOM_TESTNET]:     new Token(ChainId.FANTOM_TESTNET,   '0x4501a3bd995dada98477a76e472ca186c6914b8b', 6, 'USDC', 'USD Coin'),
      [ChainId.HECO]:               new Token(ChainId.HECO,             '0xa71edc38d189767582c38a3145b5873052c3e47a', 18, 'USDC', 'USD Coin'),
      [ChainId.HECO_TESTNET]:       new Token(ChainId.HECO_TESTNET,     '0xd459Dad367788893c17c09e17cFBF0bf25c62833', 18, 'USDC', 'USD Coin'),
      [ChainId.ARBITRUM]:           new Token(ChainId.ARBITRUM,         '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 6, 'USDC', 'USD Coin'),
      [ChainId.ARBITRUM_TESTNET]:   new Token(ChainId.ARBITRUM_TESTNET, '0xeb0a8d25cc479825e6Ca942D516a1534C32dFBe4', 6, 'USDC', 'USD Coin'),
      [ChainId.AVALANCHE]:          new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.AVALANCHE_TESTNET]:  new Token(ChainId.MAINNET, '0x4501A3bD995dadA98477a76E472CA186C6914B8B', 6, 'USDC', 'USD Coin'),
      [ChainId.OKEX]:               new Token(ChainId.MAINNET, '0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85', 6, 'USDC', 'USD Coin'),
      [ChainId.OKEX_TESTNET]:       new Token(ChainId.MAINNET, '0xd459Dad367788893c17c09e17cFBF0bf25c62833', 6, 'USDC', 'USD Coin'),
      [ChainId.PALM]:               new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.PALM_TESTNET]:       new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.MOONBEAM]:           new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.MOONRIVER]:          new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
      [ChainId.XDAI]:               new Token(ChainId.MAINNET, '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', 6, 'USDC', 'USD Coin'),
      [ChainId.CELO]:               new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin')
    }

export const COMP = new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound')
export const MKR = new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker')
export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')
export const WBTC :{ [chainId: number]: Token }  = {
      [ChainId.MAINNET]:  new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC'),
      [ChainId.RINKEBY]:  new Token(ChainId.RINKEBY, '0x577D296678535e4903D59A4C929B718e1D575e0A', 8, 'WBTC', 'Wrapped BTC')      
  }

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS = 13
export const PROPOSAL_LENGTH_IN_BLOCKS = 40_320
export const PROPOSAL_LENGTH_IN_SECS = AVERAGE_BLOCK_TIME_IN_SECS * PROPOSAL_LENGTH_IN_BLOCKS

//export const GOVERNANCE_ADDRESS = '0x433adCE1695eBb2554232d32493C7498E1605DaD'
//export const TIMELOCK_ADDRESS   = '0x0F0C989960299460C461c9fC907e1D6195769B2d'
//export const SPONSOR_ADDRESS  = '0x9b185eCEbff41B991FdA0A268fEc31454779d276'             // Test for dev on Goerli
//export const SPONSOR_ADDRESS    = '0xB7196A981De991cdCAEe06Eb7c39c84B5277d234'           // On test Chain

//export const SPONSOR_ADDRESS: { [chainId in ChainId]: string } = {
//  [ChainId.MAINNET]:  '0x74B6F6884FE98259aF4127ca9A5D580Da934E52b',
//  [ChainId.ROPSTEN]:  '0xB7196A981De991cdCAEe06Eb7c39c84B5277d234',
//  [ChainId.RINKEBY]:  '0xB7196A981De991cdCAEe06Eb7c39c84B5277d234',
//  [ChainId.GÖRLI]:    '0xB7196A981De991cdCAEe06Eb7c39c84B5277d234',
//  [ChainId.KOVAN]:    '0xB7196A981De991cdCAEe06Eb7c39c84B5277d234'
//}

//export const NFT_BID_ADDRESS  = '0xbc288BF91880bb849F004A1Dc4d783a435040d08'
//export const NFT_BID_ADDRESS  = '0xef7cf61dad6a2cf7b402482ef574b5dd20ef2b5b'
//export const NFT_BID_ADDRESS  = '0xC72B4Da86643CcFF189AA7255DF320EdB0E187B0'
//export const NFT_BID_ADDRESS  = '0xa1fbe179e8791ab4fc0060b2b881577e68dcd6dd'            // Goerli
//export const NFT_BID_ADDRESS  = '0x9bb53A4d89768fb9277eE83016F08Eff21DDd576'            // Rinkeby
//export const NFT_BID_ADDRESS    = '0x06C2De45973Df34DaB22AD0b767d2bE3eca5D178'            // on test Chain

//export const FESW_FACTORY_ADDRESS   = '0xC72B4Da86643CcFF189AA7255DF320EdB0E187B0'       // Rinkeby
export const FESW_FACTORY_ADDRESS_MAINNET     = '0xEDc22C273ea25EeDA49F049e528150dBA367Da9A'         // on test Chain
export const FESW_FACTORY_ADDRESS_ROPSTEN     = '0x75f7b730c51610aba6f3d89deb4864f156c8e747'         // on test Chain
export const FESW_FACTORY_ADDRESS_RINKEBY     = '0x75f7b730c51610aba6f3d89deb4864f156c8e747'         // on test Chain
export const FESW_FACTORY_ADDRESS_KOVAN       = '0x75f7b730c51610aba6f3d89deb4864f156c8e747'         // on test Chain
//export const FESW_FACTORY_ADDRESS_GÖRLI     = '0x615835Cc22064a17df5A3E8AE22F58e67bCcB778'         // on test Chain 1st
export const FESW_FACTORY_ADDRESS_GÖRLI       = '0x1BdB1555bDc425183ad56FcB31c06205726FEFB0'         // on test Chain 2nd

/*
export const FESW_FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]:            FESW_FACTORY_ADDRESS_MAINNET,
  [ChainId.ROPSTEN]:            FESW_FACTORY_ADDRESS_ROPSTEN,
  [ChainId.RINKEBY]:            FESW_FACTORY_ADDRESS_RINKEBY,
  [ChainId.GÖRLI]:              FESW_FACTORY_ADDRESS_GÖRLI,
  [ChainId.KOVAN]:              FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.BSC]:                FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.BSC_TESTNET]:        FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.MATIC]:              FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.MATIC_TESTNET]:      FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.HARMONY]:            FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.HARMONY_TESTNET]:    FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.FANTOM]:             FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.FANTOM_TESTNET]:     FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.HECO]:               FESW_FACTORY_ADDRESS_KOVAN,
  [ChainId.HECO_TESTNET]:       FESW_FACTORY_ADDRESS_KOVAN
}
*/

//export const FESW_ROUTER_ADDRESS  = '0x09179ceebad6b676F6E6B0474907335be3E30D89'       // Rinkeby (2021/06/14)
//export const FESW_ROUTER_ADDRESS  = '0x6E923637948657BB1b5610C81b9C6a44bBa63297'       // Rinkeby (2021/06/26)
//export const FESW_ROUTER_ADDRESS  = '0x34D3fB8402c2c666bEcC16363520dC28F810e4FF'                // Rinkeby (2021/06/27)
export const FESW_ROUTER_ADDRESS_MAINNET    = '0xc41FaBb87b6D35CC539bF9dA6c974ed2434A6DbC'       // on test Chain
export const FESW_ROUTER_ADDRESS_ROPSTEN    = '0x657db4e8c4258570cc7dd61031777901439e8079'       // on test Chain
export const FESW_ROUTER_ADDRESS_RINKEBY    = '0x657db4e8c4258570cc7dd61031777901439e8079'       // on test Chain
export const FESW_ROUTER_ADDRESS_KOVAN      = '0x657db4e8c4258570cc7dd61031777901439e8079'       // on test Chain
//export const FESW_ROUTER_ADDRESS_GÖRLI      = '0x4db0ba23261Fd5905d0Ba15b3eb35F334BeEbEA5'       // on test Chain 1st
export const FESW_ROUTER_ADDRESS_GÖRLI      = '0xD5e8666620eaf809D32c5F2D739C49953FBd6e12'       // on test Chain 2nd

/*
export const FESW_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]:        FESW_ROUTER_ADDRESS_MAINNET,
  [ChainId.ROPSTEN]:        FESW_ROUTER_ADDRESS_ROPSTEN,
  [ChainId.RINKEBY]:        FESW_ROUTER_ADDRESS_RINKEBY,
  [ChainId.GÖRLI]:          FESW_ROUTER_ADDRESS_GÖRLI,
  [ChainId.KOVAN]:          FESW_ROUTER_ADDRESS_KOVAN,
  [ChainId.BSC]:            FESW_ROUTER_ADDRESS_KOVAN,
  [ChainId.BSC_TESTNET]:    FESW_ROUTER_ADDRESS_KOVAN
}
*/

//const FESW_ADDRESS = '0xCdd5905389a765C66605CA705414f672a2055b19'                     // Test for dev
//const FESW_TEST_ADDRESS = '0xCdd5905389a765C66605CA705414f672a2055b19'                // Test for dev
//const FESW_ADDRESS      = '0xcfcC81C508a8025879a27257cC0f699F9f2016AB'
//const FESW_TEST_ADDRESS = '0xcfcC81C508a8025879a27257cC0f699F9f2016AB'

export const FESW: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]:  new Token(ChainId.MAINNET,  FESW_ADDRESS[ChainId.MAINNET],  18, 'FESW', 'FeSwap DAO'),
  [ChainId.RINKEBY]:  new Token(ChainId.RINKEBY,  FESW_ADDRESS[ChainId.RINKEBY],  18, 'FESW', 'FeSwap DAO'),
  [ChainId.ROPSTEN]:  new Token(ChainId.ROPSTEN,  FESW_ADDRESS[ChainId.ROPSTEN],  18, 'FESW', 'FeSwap DAO'),
  [ChainId.GÖRLI]:    new Token(ChainId.GÖRLI,    FESW_ADDRESS[ChainId.GÖRLI],    18, 'FESW', 'FeSwap DAO'),
  [ChainId.KOVAN]:    new Token(ChainId.KOVAN,    FESW_ADDRESS[ChainId.KOVAN],    18, 'FESW', 'FeSwap DAO'),
  [ChainId.BSC]:                new Token(ChainId.BSC,              FESW_ADDRESS[ChainId.BSC],              18, 'FESW@B', 'FeSwap DAO'),
  [ChainId.BSC_TESTNET]:        new Token(ChainId.BSC_TESTNET,      FESW_ADDRESS[ChainId.BSC_TESTNET],      18, 'FESW@B', 'FeSwap DAO'),
  [ChainId.MATIC]:              new Token(ChainId.MATIC,            FESW_ADDRESS[ChainId.MATIC],            18, 'FESW@M', 'FeSwap DAO'),
  [ChainId.MATIC_TESTNET]:      new Token(ChainId.MATIC_TESTNET,    FESW_ADDRESS[ChainId.MATIC_TESTNET],    18, 'FESW@M', 'FeSwap DAO'),
  [ChainId.HARMONY]:            new Token(ChainId.HARMONY,          FESW_ADDRESS[ChainId.HARMONY],          18, 'FESW@O', 'FeSwap DAO'),
  [ChainId.HARMONY_TESTNET]:    new Token(ChainId.HARMONY_TESTNET,  FESW_ADDRESS[ChainId.HARMONY_TESTNET],  18, 'FESW@O', 'FeSwap DAO'),
  [ChainId.FANTOM]:             new Token(ChainId.FANTOM,           FESW_ADDRESS[ChainId.FANTOM],           18, 'FESW@F', 'FeSwap DAO'),
  [ChainId.FANTOM_TESTNET]:     new Token(ChainId.FANTOM_TESTNET,   FESW_ADDRESS[ChainId.FANTOM_TESTNET],   18, 'FESW@F', 'FeSwap DAO'),
  [ChainId.HECO]:               new Token(ChainId.HECO,             FESW_ADDRESS[ChainId.HECO],             18, 'FESW@H', 'FeSwap DAO'),
  [ChainId.HECO_TESTNET]:       new Token(ChainId.HECO_TESTNET,     FESW_ADDRESS[ChainId.HECO_TESTNET],     18, 'FESW@H', 'FeSwap DAO'),
  [ChainId.ARBITRUM]:           new Token(ChainId.ARBITRUM,         FESW_ADDRESS[ChainId.ARBITRUM],         18, 'FESW@A', 'FeSwap DAO'),
  [ChainId.ARBITRUM_TESTNET]:   new Token(ChainId.ARBITRUM_TESTNET, FESW_ADDRESS[ChainId.ARBITRUM_TESTNET], 18, 'FESW@A', 'FeSwap DAO'),
  [ChainId.AVALANCHE]:          new Token(ChainId.AVALANCHE,        FESW_ADDRESS[ChainId.AVALANCHE],        18, 'FESW@V', 'FeSwap DAO'),
  [ChainId.AVALANCHE_TESTNET]:  new Token(ChainId.AVALANCHE_TESTNET,FESW_ADDRESS[ChainId.AVALANCHE_TESTNET],18, 'FESW@V', 'FeSwap DAO'),
  [ChainId.OKEX]:           new Token(ChainId.OKEX,                 FESW_ADDRESS[ChainId.OKEX],             18, 'FESW@K', 'FeSwap DAO'),
  [ChainId.OKEX_TESTNET]:   new Token(ChainId.OKEX_TESTNET,         FESW_ADDRESS[ChainId.OKEX_TESTNET],     18, 'FESW@K', 'FeSwap DAO'),
  [ChainId.PALM]:           new Token(ChainId.PALM,                 FESW_ADDRESS[ChainId.PALM],         18, 'FESW', 'FeSwap DAO'),
  [ChainId.PALM_TESTNET]:   new Token(ChainId.PALM_TESTNET,         FESW_ADDRESS[ChainId.PALM_TESTNET], 18, 'FESW', 'FeSwap DAO'),
  [ChainId.MOONBEAM]:       new Token(ChainId.MOONBEAM,             FESW_ADDRESS[ChainId.MOONBEAM],     18, 'FESW', 'FeSwap DAO'),
  [ChainId.MOONRIVER]:      new Token(ChainId.MOONRIVER,            FESW_ADDRESS[ChainId.MOONRIVER],    18, 'FESW', 'FeSwap DAO'),
  [ChainId.XDAI]:           new Token(ChainId.XDAI,                 FESW_ADDRESS[ChainId.XDAI],         18, 'FESW', 'FeSwap DAO'),
  [ChainId.CELO]:           new Token(ChainId.CELO,                 FESW_ADDRESS[ChainId.CELO],         18, 'FESW', 'FeSwap DAO')
}

export const HIGH_VALUE: { [chainId in ChainId]: Fraction } = {
  [ChainId.MAINNET]:            FIVE_FRACTION,
  [ChainId.RINKEBY]:            FIVE_FRACTION,
  [ChainId.ROPSTEN]:            FIVE_FRACTION,
  [ChainId.GÖRLI]:              FIVE_FRACTION,
  [ChainId.KOVAN]:              FIVE_FRACTION,
  [ChainId.BSC]:                TEN_FRACTION,
  [ChainId.BSC_TESTNET]:        TEN_FRACTION,
  [ChainId.MATIC]:              THOUSAND_FRACTION,
  [ChainId.MATIC_TESTNET]:      THOUSAND_FRACTION,
  [ChainId.HARMONY]:            TEN_THOUSAND_FRACTION,
  [ChainId.HARMONY_TESTNET]:    TEN_THOUSAND_FRACTION,
  [ChainId.FANTOM]:             THOUSAND_FRACTION,
  [ChainId.FANTOM_TESTNET]:     THOUSAND_FRACTION,
  [ChainId.HECO]:               THOUSAND_FRACTION,
  [ChainId.HECO_TESTNET]:       THOUSAND_FRACTION,
  [ChainId.ARBITRUM]:           TWO_FRACTION,
  [ChainId.ARBITRUM_TESTNET]:   TWO_FRACTION,
  [ChainId.AVALANCHE]:          HUNDREAD_FRACTION,
  [ChainId.AVALANCHE_TESTNET]:  HUNDREAD_FRACTION,
  [ChainId.OKEX]:               HUNDREAD_FRACTION,
  [ChainId.OKEX_TESTNET]:       HUNDREAD_FRACTION,
  [ChainId.PALM]:               THOUSAND_FRACTION,
  [ChainId.PALM_TESTNET]:       THOUSAND_FRACTION,
  [ChainId.MOONBEAM]:           THOUSAND_FRACTION,
  [ChainId.MOONRIVER]:          THOUSAND_FRACTION,
  [ChainId.XDAI]:               TEN_THOUSAND_FRACTION,
  [ChainId.CELO]:               THOUSAND_FRACTION
}

export const COMMON_CONTRACT_NAMES: { [address: string]: string } = {
//  [FESW_ADDRESS]: 'FESW',
  [GOVERNANCE_ADDRESS[ChainId.MAINNET]]: 'Governance',
  [TIMELOCK_ADDRESS[ChainId.MAINNET]]: 'Timelock'
}

// TODO: specify merkle distributor for mainnet
export const MERKLE_DISTRIBUTOR_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x090D4613473dEE047c3f2706764f49E0821D256e'
}

export const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.ROPSTEN]: [WETH[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.KOVAN]: [WETH[ChainId.KOVAN]],
  [ChainId.BSC]:  [WETH[ChainId.BSC]],
  [ChainId.BSC_TESTNET]: [WETH[ChainId.BSC_TESTNET]],
  [ChainId.MATIC]:  [WETH[ChainId.MATIC]],
  [ChainId.MATIC_TESTNET]: [WETH[ChainId.MATIC_TESTNET]],
  [ChainId.HARMONY]:  [WETH[ChainId.HARMONY]],
  [ChainId.HARMONY_TESTNET]: [WETH[ChainId.HARMONY_TESTNET]],
  [ChainId.FANTOM]:  [WETH[ChainId.FANTOM]],
  [ChainId.FANTOM_TESTNET]: [WETH[ChainId.FANTOM_TESTNET]],
  [ChainId.HECO]:  [WETH[ChainId.HECO]],
  [ChainId.HECO_TESTNET]: [WETH[ChainId.HECO_TESTNET]],
  [ChainId.ARBITRUM]:  [WETH[ChainId.ARBITRUM]],
  [ChainId.ARBITRUM_TESTNET]: [WETH[ChainId.ARBITRUM_TESTNET]],
  [ChainId.AVALANCHE]:  [WETH[ChainId.AVALANCHE]],
  [ChainId.AVALANCHE_TESTNET]: [WETH[ChainId.AVALANCHE_TESTNET]],
  [ChainId.OKEX]:  [WETH[ChainId.OKEX]],
  [ChainId.OKEX_TESTNET]: [WETH[ChainId.OKEX_TESTNET]],
  [ChainId.PALM]:  [WETH[ChainId.PALM]],
  [ChainId.PALM_TESTNET]: [WETH[ChainId.PALM_TESTNET]],
  [ChainId.MOONBEAM]:  [WETH[ChainId.MOONBEAM]],
  [ChainId.MOONRIVER]: [WETH[ChainId.MOONRIVER]],
  [ChainId.XDAI]:  [WETH[ChainId.XDAI]],
  [ChainId.CELO]: [WETH[ChainId.CELO]]

}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC[ChainId.MAINNET], USDT[ChainId.MAINNET], COMP, MKR]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI, WETH[ChainId.MAINNET]]
  }
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin')
    ],
    [USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]],
    [DAI, USDT[ChainId.MAINNET]]
  ]
}

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5'
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true
  },
  FORTMATIC: {
    connector: fortmatic,
    name: 'Fortmatic',
    iconName: 'fortmaticIcon.png',
    description: 'Login using Fortmatic hosted wallet',
    href: null,
    color: '#6748FF',
    mobile: true
  },
  Portis: {
    connector: portis,
    name: 'Portis',
    iconName: 'portisIcon.png',
    description: 'Login using Portis hosted wallet',
    href: null,
    color: '#4A6C9B',
    mobile: true
  }
}

// href: 'https://go.cb-w.com/mtUDhEZPy1',

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// used for rewards deadlines
export const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)
export const BIG_INT_SECONDS_IN_DAY = JSBI.BigInt(60 * 60 * 24)

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ZERO_PERCENT = new Percent(JSBI.BigInt(0), JSBI.BigInt(100))
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
export const BETTER_TRADE_LINK_THRESHOLD = new Percent(JSBI.BigInt(75), JSBI.BigInt(10000))
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

// SDN OFAC addresses
export const BLOCKED_ADDRESSES: string[] = [
  '0x7F367cC41522cE07553e823bf3be79A889DEbe1B',
  '0xd882cFc20F52f2599D84b8e8D58C7FB62cfE344b',
  '0x901bb9583b24D97e995513C6778dc6888AB6870e',
  '0xA7e5d5A720f06526557c513402f2e6B5fA20b008'
]
