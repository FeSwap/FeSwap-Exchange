import useENS from '../../hooks/useENS'
import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount, Fraction } from '@feswap/sdk'
import { useSponsorContract, useNftBidContract, useFeswFactoryContract } from '../../hooks/useContract'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress, calculateGasMargin, WEI_DENOM_FRACTION, ONE_OVER_HUNDREAD } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { setNftRecipient, typeNftInput, typeTriggerRate, selectNftCurrency, USER_BUTTON_ID } from './actions'
import { FESW } from '../../constants'
import { useSingleCallResult, useSingleContractMultipleData, NEVER_RELOAD } from '../multicall/hooks'
import { Field, WALLET_BALANCE, USER_UI_INFO } from './actions'
import { tryParseAmount } from '../swap/hooks'
import { useMemo } from 'react'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { useCurrency } from '../../hooks/Tokens'
import { ZERO_ADDRESS } from '../../constants'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { PairBidInfo, FeswaPairInfo, FeswaNftConfig } from './reducer'
import { WEI_DENOM } from '../../utils'
import { BigNumber } from '@ethersproject/bignumber'
import { useNFTPairAdded } from '../user/hooks'

export interface NftBidTrade {
  readonly pairCurrencies: { [field in Field]?: Currency | null }
  readonly parsedAmounts: { [field in USER_UI_INFO]?: CurrencyAmount }
  readonly firtBidder: boolean
  readonly feswaNftConfig: FeswaNftConfig | undefined
}

export interface NftManageTrade {
  readonly pairCurrencies: { [field in Field]?: Currency | null }
  readonly recipientAddress: string | null
  readonly rateTrigger: number
}

export function setBidButtonID(curID: USER_BUTTON_ID, newID: USER_BUTTON_ID, force: boolean = false){
  if(force) {
    return (curID === USER_BUTTON_ID.ERR_NO_WALLET) ? curID : newID
  } else {
    return (newID < curID) ?  newID : curID
  }
}

export function bigNumberToFractionInETH(bigNumber: BigNumber): Fraction {
  return new Fraction (bigNumber.toString(), WEI_DENOM)
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

// get Nft count of the current user
export function useNfftCount(): number | undefined {
  const { account } = useActiveWeb3React()
  const nftContract = useNftBidContract()
  const res = useSingleCallResult(nftContract, 'balanceOf', [account??ZERO_ADDRESS])
  if (account && res.result && !res.loading) {
    return parseInt(res.result[0])
  }
  return undefined
}

// get the users NFT list
export function useGetUserNFTList(): {
  numberOfNftToken: number
  feswaNftPairBidInfo:  PairBidInfo[]
} {
  const { account } = useActiveWeb3React()
  const nftContract = useNftBidContract()
  const nftTokenCount = useNfftCount()
  
  // get all nft Token IDs
  const nftTokenIndexes = []
  for (let i = 0; i < (nftTokenCount ?? 0); i++) {
    nftTokenIndexes.push([account??ZERO_ADDRESS, i])
  }
  const allNftTokensIDs = useSingleContractMultipleData(nftContract, 'tokenOfOwnerByIndex', nftTokenIndexes)

  // get all nft Token Infos
  const allNftTokensIDList = []
  for (let i = 0; i < (nftTokenCount ?? 0); i++) {
    if(allNftTokensIDs[i]?.valid && !allNftTokensIDs[i]?.loading)
      allNftTokensIDList.push([allNftTokensIDs[i].result?.[0].toHexString()?? ZERO_ADDRESS])
  }

  const allNftTokenInfos = useSingleContractMultipleData(nftContract, 'getPoolInfo', allNftTokensIDList)

  const nftTokenInfoList = []
  for (let i = 0; i < (nftTokenCount ?? 0); i++) {
    if(allNftTokenInfos[i]?.valid && !allNftTokenInfos[i]?.loading) {
      if (allNftTokenInfos[i].result?.[0] === account)
        nftTokenInfoList.push(allNftTokenInfos[i].result?.[1])
    }
  }

  return {  numberOfNftToken:     nftTokenCount?? 0, 
            feswaNftPairBidInfo:  nftTokenInfoList}
}

export function useInitTokenHandler(currencyIdA: string, currencyIdB: string,) {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch( selectNftCurrency({ field: Field.TOKEN_A, currencyId: currencyIdA}) )
    dispatch( selectNftCurrency({ field: Field.TOKEN_B, currencyId: currencyIdB}) )
  }, 
  [currencyIdA, currencyIdB, dispatch ])

}

export function useNftActionHandlers(): {
  onNftCurrencySelection: (field: Field, currency: Currency) => void
  onNftUserInput: (typedValue: string) => void
  onNftTriggerRate: (rateTrigger: number) => void
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
      dispatch(typeNftInput({typedValue}))
    },
    [dispatch]
  )

  const onNftTriggerRate = useCallback(
    (rateTrigger: number) => {
      dispatch(typeTriggerRate({rateTrigger}))
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
    onNftTriggerRate,
    onChangeNftRecipient
  }
}


// from the current sponsor inputs, compute the best trade and return it.
export function useDerivedNftManageInfo(): {
  feswaPairBidInfo:   FeswaPairInfo
  feswaPoolPair:      string | undefined
  pairCurrencies:     { [field in Field]?: Currency }
  inputError:         USER_BUTTON_ID
} {
  const { account, chainId } = useActiveWeb3React()
  const nftBidContract = useNftBidContract()
  const feswFactoryContract = useFeswFactoryContract()

  const {
    recipient,
    [Field.TOKEN_A]: tokenAId,
    [Field.TOKEN_B]: tokenBId
  } = useNftState()

  const currencyA = useCurrency(tokenAId.currencyId)
  const currencyB = useCurrency(tokenBId.currencyId)

  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const tokenA = wrappedCurrency(currencyA ?? undefined, chainId)
  const tokenB = wrappedCurrency(currencyB ?? undefined, chainId)          

  const pairTokenAddress= [ (tokenA instanceof Token) ? (tokenA as Token).address : ZERO_ADDRESS ,
                            (tokenB instanceof Token) ? (tokenB as Token).address : ZERO_ADDRESS]

  const feswaPairINfo =  useSingleCallResult(nftBidContract, 'getPoolInfoByTokens', pairTokenAddress)?.result??undefined

  const feswaPoolPair =  useSingleCallResult(feswFactoryContract, 'getPair', pairTokenAddress)?.result?.[0]??undefined

  const feswaPairBidInfo : FeswaPairInfo = {
    tokenIDPairNft: feswaPairINfo?.tokenID,
    ownerPairNft:   feswaPairINfo?.nftOwner,
    pairBidInfo:    feswaPairINfo?.pairInfo,
  }

  const pairCurrencies =  { [Field.TOKEN_A]: currencyA ?? undefined,
                            [Field.TOKEN_B]: currencyB ?? undefined
                          }

  //let inputError: string | undefined
  let inputError: USER_BUTTON_ID = USER_BUTTON_ID.OK_STATUS

  if (!account) {
    inputError = USER_BUTTON_ID.ERR_NO_WALLET
  }

  if (!feswaPairINfo?.pairInfo) {
    inputError = USER_BUTTON_ID.ERR_NO_SERVICE
  }
  
  if (!pairCurrencies[Field.TOKEN_A] || !pairCurrencies[Field.TOKEN_B]) {
    inputError = USER_BUTTON_ID.ERR_NO_TOKENS
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = setBidButtonID(inputError, USER_BUTTON_ID.ERR_NO_RECIPIENT)
  } 

  return {
    feswaPairBidInfo, 
    feswaPoolPair,
    pairCurrencies,
    inputError,
  }
}

// from the current sponsor inputs, compute the best trade and return it.
export function useDerivedNftInfo(): {
  feswaPairBidInfo:  FeswaPairInfo
  pairCurrencies: { [field in Field]?: Currency }
  WalletBalances : { [field in WALLET_BALANCE]?: CurrencyAmount }
  parsedAmounts:   { [field in USER_UI_INFO]?: CurrencyAmount }
  feswGiveRate:   Fraction | undefined 
  feswaNftConfig:  FeswaNftConfig | undefined
  nftPairToSave: boolean
  inputError: USER_BUTTON_ID
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
  const nftPairToSave = useNFTPairAdded(tokenA, tokenB) === false

  const pairTokenAddress= [ (tokenA instanceof Token) ? (tokenA as Token).address : ZERO_ADDRESS ,
                            (tokenB instanceof Token) ? (tokenB as Token).address : ZERO_ADDRESS]

  const feswaPairINfo =  useSingleCallResult(nftBidContract, 'getPoolInfoByTokens', pairTokenAddress)?.result??undefined

  const AirdropFirstBidder : BigNumber | undefined = useSingleCallResult(nftBidContract, 'AIRDROP_FOR_FIRST', undefined, 
                                                      NEVER_RELOAD)?.result?.[0] ?? undefined

  const AirdropRateForWinner : BigNumber | undefined = useSingleCallResult(nftBidContract, 'AIRDROP_RATE_FOR_WINNER', undefined, 
                                                      NEVER_RELOAD)?.result?.[0] ?? undefined
  
  const MinPriceIncrease : BigNumber | undefined = useSingleCallResult(nftBidContract, 'MINIMUM_PRICE_INCREACE', undefined, 
                                                      NEVER_RELOAD)?.result?.[0] ?? undefined

  const SaleStartTime : BigNumber | undefined = useSingleCallResult(nftBidContract, 'SaleStartTime', undefined, 
                                                NEVER_RELOAD)?.result?.[0] ?? undefined

  const parsedAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, ETHER, true) ?? undefined
  const feswGiveRate = AirdropRateForWinner ? new Fraction( AirdropRateForWinner.toString(), '1') : undefined   // 1ETH -> 20000 FESW Giveaway

  const feswaPairBidInfo : FeswaPairInfo = {
    tokenIDPairNft: feswaPairINfo?.tokenID,
    ownerPairNft:   feswaPairINfo?.nftOwner,
    pairBidInfo:    feswaPairINfo?.pairInfo,
  }

  const feswaNftConfig : FeswaNftConfig | undefined = useMemo(()=>{
      if( !MinPriceIncrease || !AirdropRateForWinner || !feswGiveRate || !AirdropFirstBidder || !SaleStartTime) return undefined
      return {  feswGiveRate, 
                AirdropFirstBidder: new Fraction(AirdropFirstBidder.toString(), WEI_DENOM), 
                AirdropRateForWinner: new Fraction( AirdropRateForWinner.toString(), WEI_DENOM), 
                MinPriceIncrease: new Fraction( MinPriceIncrease.toString(), WEI_DENOM),
                SaleStartTime: SaleStartTime
              }
    }, [MinPriceIncrease, AirdropRateForWinner, feswGiveRate, AirdropFirstBidder, SaleStartTime]
  )

  const feswToken = chainId ? FESW[chainId] : undefined
  const parsedAmountInduced : CurrencyAmount | undefined = useMemo(() => {
      if(!parsedAmount || !feswToken || !feswGiveRate) return undefined
      return new TokenAmount(feswToken as Token, parsedAmount.multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).quotient)
    },
    [feswToken, parsedAmount, feswGiveRate] 
  )

  const nftBidPrice: CurrencyAmount | undefined = useMemo(() => {
      if ((!feswaPairINfo) || (feswaPairINfo?.nftOwner === ZERO_ADDRESS)) return undefined
//      if(feswaPairINfo?.pairInfo.poolState === NFT_BID_PHASE.PoolHolding) return undefined
      return CurrencyAmount.ether(feswaPairINfo?.pairInfo.currentPrice.toString())
    },[feswaPairINfo])
  
  const bidGiveAway : CurrencyAmount | undefined = useMemo(() => {
      if(!nftBidPrice || !feswToken || !feswGiveRate) return undefined
      return new TokenAmount(feswToken as Token, nftBidPrice.multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).quotient)
    },[feswToken, nftBidPrice, feswGiveRate])

  const baseGiveAway : CurrencyAmount | undefined = useMemo(() => {
      if(!parsedAmount || !feswToken || !feswGiveRate) return undefined
      if(!nftBidPrice){
        return new TokenAmount(feswToken as Token, parsedAmount.multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).divide('5').quotient)
      }
      if(parsedAmount.lessThan(nftBidPrice)) return undefined 
      return new TokenAmount(feswToken as Token, parsedAmount.subtract(nftBidPrice).multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).divide('5').quotient)
    },[feswToken, parsedAmount, nftBidPrice, feswGiveRate])

  const parsedAmounts = {
            [USER_UI_INFO.USER_PRICE_INPUT]: parsedAmount,
            [USER_UI_INFO.BASE_GIVEAWAY]: baseGiveAway,             
            [USER_UI_INFO.FESW_GIVEAWAY]: parsedAmountInduced, 
            [USER_UI_INFO.LAST_NFT_PRICE]: nftBidPrice,
            [USER_UI_INFO.BID_FESW_GIVEAWAY]: bidGiveAway
          }
  
  //let inputError: string | undefined
  let inputError: USER_BUTTON_ID = USER_BUTTON_ID.OK_STATUS

  if (!account) {
    inputError = USER_BUTTON_ID.ERR_NO_WALLET
  }

  if (!feswaPairINfo?.pairInfo) {
    inputError = USER_BUTTON_ID.ERR_NO_SERVICE
  }

   const now = new Date().getTime()
  if( SaleStartTime && ((now/1000) <= SaleStartTime.toNumber())) {
    inputError = USER_BUTTON_ID.ERR_NO_START
  }
    
  if (!pairCurrencies[Field.TOKEN_A] || !pairCurrencies[Field.TOKEN_B]) {
    inputError = USER_BUTTON_ID.ERR_NO_TOKENS
  }

  if (!parsedAmount) {
    inputError = setBidButtonID(inputError, USER_BUTTON_ID.ERR_INPUT_VALUE)
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = (inputError === USER_BUTTON_ID.ERR_INPUT_VALUE) 
                  ? USER_BUTTON_ID.ERR_NO_RECIPIENT
                  : setBidButtonID(inputError, USER_BUTTON_ID.ERR_NO_RECIPIENT)
  } 

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    WalletBalances[WALLET_BALANCE.ETH],
    parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT],
    nftBidPrice
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(ONE_OVER_HUNDREAD.add(amountIn))) {
    inputError = setBidButtonID(inputError, USER_BUTTON_ID.ERR_LOW_BALANCE)
  }

  return {
    feswaPairBidInfo, 
    pairCurrencies,
    WalletBalances,
    parsedAmounts,
    feswGiveRate,
    feswaNftConfig,
    nftPairToSave,
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
