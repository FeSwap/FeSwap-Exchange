import useENS from '../../hooks/useENS'
import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount, Fraction } from '@uniswap/sdk'
import { useSponsorContract, useFeswContract, useNftBidContract } from '../../hooks/useContract'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress, calculateGasMargin, WEI_DENOM_FRACTION } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { setNftRecipient, typeNftInput, selectNftCurrency } from './actions'
import { FESW } from '../../constants'
import { useSingleCallResult } from '../multicall/hooks'
import { Field, WALLET_BALANCE } from './actions'
import { tryParseAmount } from '../swap/hooks'
import { useMemo } from 'react'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { useCurrency } from '../../hooks/Tokens'
import { ZERO_ADDRESS } from '../../constants'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { FeswaPairInfo } from './reducer'
//import { FeswaPairInfo, PairBidInfo } from './reducer'
// import { BigNumber } from 'ethers'
// import { BigNumber } from '@ethersproject/bignumber'

export interface NftBidTrade {
  readonly pairCurrencies: { [field in Field]?: Currency | null }
  readonly parsedAmounts: (CurrencyAmount | undefined)[]
}

export interface NftBidPairInfo {
  readonly tokenA: string | undefined
  readonly tokenB: string | undefined
  readonly currentPrice:  JSBI
  readonly timeCreated:   JSBI
  readonly lastBidTime:   JSBI
  readonly poolState:     JSBI
}

export function useNftState(): AppState['nft'] {
  return useSelector<AppState, AppState['nft']>(state => state.nft)
}

// get if sponsor finalized
export function useSponsorFinalized(): JSBI {
  const sponsorContract = useSponsorContract()
  const { result } = useSingleCallResult(sponsorContract, 'SponsorFinalized', [])
  return result?.[0] ?? undefined
}

// get the users delegatee if it exists
export function useTotalETHReceived(): JSBI {
  const sponsorContract = useSponsorContract()
  const { result } = useSingleCallResult(sponsorContract, 'TotalETHReceived', [])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): TokenAmount | undefined {
  const { account, chainId } = useActiveWeb3React()
  const feswContract = useFeswContract()

  // check for available votes
  const fesw = chainId ? FESW[chainId] : undefined
  const votes = useSingleCallResult(feswContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && fesw ? new TokenAmount(fesw, votes) : undefined
}

export function useNftActionHandlers(): {
  onNftCurrencySelection: (field: Field, currency: Currency) => void
  onNftUserInput: (typedValue: string) => void
  onChangeNftRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onNftCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch( selectNftCurrency({ field,
                  currencyId: currency instanceof Token ? currency.address : currency === ETHER ? 'ETH' : '' }))
    },
    [dispatch]
  )

  const onNftUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeNftInput({typedValue }))
    },
    [dispatch]
  )

  const onChangeNftRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setNftRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onNftCurrencySelection,
    onNftUserInput,
    onChangeNftRecipient
  }
}

// from the current sponsor inputs, compute the best trade and return it.
export function useDerivedNftInfo(): {
  feswaPairBidInfo:  FeswaPairInfo
  numberOfToken: number
  pairCurrencies: { [field in Field]?: Currency }
  WalletBalances : { [field in WALLET_BALANCE]?: CurrencyAmount }
  parsedAmounts:   (CurrencyAmount | undefined)[]
  inputError?: string
} {
  const { account, chainId } = useActiveWeb3React()
  const {
    typedValue,
    recipient,
    [Field.TOKEN_A]: tokenAId,
    [Field.TOKEN_B]: tokenBId
  } = useNftState()

  const currencyA = useCurrency(tokenAId.currencyId)
  const currencyB = useCurrency(tokenBId.currencyId)

  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const walletBalances = useCurrencyBalances(account ?? undefined, [
    ETHER,
    chainId ? FESW[chainId] : undefined
  ])

  const pairCurrencies =  { [Field.TOKEN_A]: currencyA ?? undefined,
                            [Field.TOKEN_B]: currencyB ?? undefined
                          }

  const WalletBalances =  { [WALLET_BALANCE.ETH]:   walletBalances[0],
                            [WALLET_BALANCE.FESW]:  walletBalances[1],
                          }     
                          
  const tokenA = wrappedCurrency(currencyA ?? undefined, chainId)
  const tokenB = wrappedCurrency(currencyB ?? undefined, chainId)          

  const nftBidContract = useNftBidContract()
  const pairTokenAddress= [ (tokenA instanceof Token) ? (tokenA as Token).address : ZERO_ADDRESS ,
                            (tokenB instanceof Token) ? (tokenB as Token).address : ZERO_ADDRESS]

  const feswaPairINfo =  useSingleCallResult(nftBidContract, 'getPoolInfoByTokens', pairTokenAddress)?.result??undefined
  const numberOfToken = useSingleCallResult(nftBidContract, 'balanceOf', [account ?? ZERO_ADDRESS])?.result?.[0].toNumber()
                        ?? 0

  const feswaPairBidInfo : FeswaPairInfo = {
    tokenIDPairNft: feswaPairINfo?.tokenID,
    ownerPairNft:   feswaPairINfo?.nftOwner,
    pairBidInfo:    feswaPairINfo?.pairInfo,
  }

//  console.log("feswaPairBidInfo", feswaPairBidInfo)

  const parsedAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, ETHER) ?? undefined
  const feswGiveRate = new Fraction( '1', '20000')   // 1ETH -> 20000 FESW Giveaway
  const feswToken = chainId ? FESW[chainId] : undefined

  const parsedAmountInduced : CurrencyAmount | undefined = useMemo(() => {
      if(!parsedAmount || !feswToken) return undefined
      return new TokenAmount(feswToken as Token, parsedAmount.multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).quotient)
    },
    [feswToken, parsedAmount, feswGiveRate] 
  )

  const parsedAmounts = [parsedAmount, parsedAmountInduced]

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? 'Enter a recipient'
  } 

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    WalletBalances[WALLET_BALANCE.ETH],
    parsedAmounts[WALLET_BALANCE.ETH]
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = 'Insufficient ' + amountIn.currency.symbol + ' balance'
  }

  return {
    feswaPairBidInfo, 
    numberOfToken,
    pairCurrencies,
    WalletBalances,
    parsedAmounts,
    inputError,
  }
}

export function useSponsorCallback(
  sponsorAmount: CurrencyAmount | undefined
): {
  sponsorCallback: () => Promise<string>
} {
  // get claim data for this account
  const { library, chainId, account } = useActiveWeb3React()
  const sponsorContract = useSponsorContract()

  // used for popup summary
  const addTransaction = useTransactionAdder()

  const sponsorCallback = async function() {
    if (!sponsorAmount || !account || !library || !chainId|| !sponsorContract ) return

   return sponsorContract.estimateGas['Sponsor'](account, {}).then(estimatedGasLimit => {
      return sponsorContract
        .Sponsor(account, { value: sponsorAmount.raw, gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Sponsored ${sponsorAmount?.toSignificant(6)} ETH`,
          })
          return response.hash
        })
    })
  }

  return { sponsorCallback }
}
