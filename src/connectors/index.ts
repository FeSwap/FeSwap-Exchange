import { ChainId } from '@feswap/sdk'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL }
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

const RPC = {
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/q1gSNoSMEzJms47Qn93f9-9Xg5clkmEC',
  [ChainId.ROPSTEN]: 'https://eth-ropsten.alchemyapi.io/v2/cidKix2Xr-snU3f6f6Zjq_rYdalKKHmW',
  [ChainId.RINKEBY]: 'https://eth-rinkeby.alchemyapi.io/v2/XVLwDlhGP6ApBXFz_lfv0aZ6VmurWhYD',
  [ChainId.GÖRLI]: 'https://eth-goerli.alchemyapi.io/v2/Dkk5d02QjttYEoGmhZnJG37rKt8Yl3Im',
  [ChainId.KOVAN]: 'https://eth-kovan.alchemyapi.io/v2/6OVAa_B_rypWWl9HqtiYK26IRxXiYqER',
  [ChainId.BSC]: 'https://bsc-dataseed.binance.org/',
  [ChainId.BSC_TESTNET]: 'https://data-seed-prebsc-2-s3.binance.org:8545',
  [ChainId.MATIC]: 'https://polygon-rpc.com',
  [ChainId.MATIC_TESTNET]: ' https://rpc-mumbai.maticvigil.com',
  [ChainId.HARMONY]: 'https://api.harmony.one',
  [ChainId.HARMONY_TESTNET]: 'https://api.s0.b.hmny.io',
  [ChainId.FANTOM]: 'https://rpcapi.fantom.network',
  [ChainId.FANTOM_TESTNET]: 'https://rpc.testnet.fantom.network',
  [ChainId.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  [ChainId.ARBITRUM_TESTNET]: 'https://rinkeby.arbitrum.io/rpc',
//  [ChainId.XDAI]: 'https://rpc.xdaichain.com',
//  [ChainId.MOONBEAM_TESTNET]: 'https://rpc.testnet.moonbeam.network',
//  [ChainId.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
//  [ChainId.AVALANCHE_TESTNET]: 'https://api.avax-test.network/ext/bc/C/rpc',
//  [ChainId.HECO]: 'https://http-mainnet.hecochain.com',
//  [ChainId.HECO_TESTNET]: 'https://http-testnet.hecochain.com',
//  [ChainId.OKEX]: 'https://exchainrpc.okex.org',
//  [ChainId.OKEX_TESTNET]: 'https://exchaintestrpc.okex.org',
//  [ChainId.PALM]: 'https://palm-mainnet.infura.io/v3/da5fbfafcca14b109e2665290681e267',
}

//[ChainId.MATIC]: 'https://rpc-mainnet.maticvigil.com',
//[ChainId.MATIC_TESTNET]: 'https://rpc-mumbai.matic.today',

const supportedChainIds = [
  1,          // mainnet
  3,          // ropsten
  4,          // rinkeby
  5,          // goreli
  42,         // kovan
  56,         // binance smart chain
  97,         // binance smart chain testnet
  137,        // matic
  80001,      // matic testnet,
  1666600000, // harmony
  1666700000, // harmony testnet
  250,        // fantom
  4002,       // fantom testnet
  128,        // heco
  256,        // heco testnet
  42161,      // arbitrum
  421611,      // arbitrum test
  43114,        // avalanche
  43113,        // fuji
//  100, // xdai
//  1287, // moonbase
//  66, // okex testnet
//  65, // okex testnet
//  42220, // celo
//  11297108109, // palm
//  1285, // moonriver
]

export const injected = new InjectedConnector({
  supportedChainIds,
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
//  rpc: { 1: NETWORK_URL },
  rpc: RPC,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  supportedChainIds
//  pollingInterval: 15000
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
