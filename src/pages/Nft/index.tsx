import { Currency, NATIVE, ETHER, Fraction, Rounding, CurrencyAmount, ChainId } from '@feswap/sdk'
import React, { useCallback, useContext, useState, useMemo, useRef } from 'react'
import { PlusCircle } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { darken } from 'polished'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, RateButton, ButtonEmpty  } from '../../components/Button'
import Card  from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmNftModal from '../../components/Nft/ConfirmNftModal'
import CurrencyInputPanel, { Container } from '../../components/CurrencyInputPanel'
import TokenPairSelectPanel from '../../components/TokenPairSelectPanel'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import PageHeader from '../../components/PageHeader'
import { useActiveWeb3React } from '../../hooks'
// import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import {StyledPageCard} from '../../components/earn/styled'
import { Field, USER_UI_INFO, NFT_BID_PHASE, BidButtonPrompt, USER_BUTTON_ID, userInputTitle } from '../../state/nft/actions'
import { HIGH_VALUE } from '../../constants'
import { ArrowDown, ChevronUp, ChevronDown } from 'react-feather'
import Slider from '../../components/Slider'
import { isAddress } from '../../utils'
//import { FESW } from '../../constants'

import {
  NftBidTrade,
  useDerivedNftInfo,
  useInitTokenHandler,
  useNftActionHandlers,
  useNftState,
  setBidButtonID
} from '../../state/nft/hooks'
import { useTrackedNFTTokenPairs } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { BigNumber } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useNftBidContract, feswType } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, WEI_DENOM, ZERO_FRACTION, ONE_FRACTION, TWO_TENTH_FRACTION, HUNDREAD_TWO_FRACTION,
  ONE_TENTH_FRACTION, TEN_PERCENT_MORE } from '../../utils'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { DateTime } from 'luxon'
import NftList, { StyledNFTButton, getBidDuration, getReOpenDuration, NFTBidHelpInfo } from '../../components/Nft'
import { FixedSizeList } from 'react-window'
import { useNFTPairAdder } from '../../state/user/hooks'
import { ZERO_ADDRESS } from '../../constants'
import QuestionHelper from '../../components/QuestionHelper'
import { ArrowWrapper } from '../../components/swap/styleds'


const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 7fr;
  gap: 20px;
  width: 100%;
`

export default function Nft({
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const nftBidContract = useNftBidContract()
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  useInitTokenHandler(currencyIdA??'', currencyIdB??'')

  // NFT Bidding state
  const {
    rateTrigger,
    typedValue,
    recipient,
  } = useNftState()

  const {
    feswaPairBidInfo,
    pairCurrencies,
    parsedAmounts,
    feswaNftConfig,
    nftPairToSave,
    inputError
  } = useDerivedNftInfo()

//  const { address: recipientAddress } = useENSAddress(recipient)
  const [savedButtonID, setSavedButtonID] = useState(USER_BUTTON_ID.OK_STATUS)
    // modal and loading
  const [{ showConfirm, nftBidToConfirm, nftBidErrorMessage, attemptingTxn, txHash }, setNftBidState] = useState<{
    showConfirm: boolean
    nftBidToConfirm: NftBidTrade | undefined
    attemptingTxn: boolean
    nftBidErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    nftBidToConfirm: undefined,
    attemptingTxn: false,
    nftBidErrorMessage: undefined,
    txHash: undefined
  })

  const nftBidPrice:  Fraction | undefined = useMemo(() => {
      if (!feswaPairBidInfo.pairBidInfo) return undefined
      if (feswaPairBidInfo.ownerPairNft === ZERO_ADDRESS) return undefined
      return new Fraction(feswaPairBidInfo.pairBidInfo.currentPrice.toString(), WEI_DENOM)
    }, [feswaPairBidInfo]
  )

  const newNftBidPrice: Fraction = useMemo(() => {
      if(!nftBidPrice || !feswaNftConfig){
        if(feswType(chainId) === "FESW-V2")  return ZERO_FRACTION
        else return TWO_TENTH_FRACTION
      }
      if(feswType(chainId) === "FESW-V2"){  
        let newNftBidPrice1 = nftBidPrice.add(feswaNftConfig.MinPriceIncrease)
        let newNftBidPrice2 = nftBidPrice.multiply(HUNDREAD_TWO_FRACTION)
        return newNftBidPrice1.lessThan(newNftBidPrice2) ? newNftBidPrice2 : newNftBidPrice1
      }
      else {
        return nftBidPrice.lessThan(ONE_FRACTION) 
                ? nftBidPrice.add(ONE_TENTH_FRACTION) 
                : nftBidPrice.multiply(TEN_PERCENT_MORE)
      }
    }, [chainId, feswaNftConfig, nftBidPrice]
  )

  const [buttonID, nftStatusPrompt, inputTitleID] = useMemo(()=>{
    if (!feswaPairBidInfo.pairBidInfo) return [inputError, 'Waiting...', USER_BUTTON_ID.OK_INIT_BID]

    let buttonID: USER_BUTTON_ID | undefined
    let nftStatusString: string | undefined
    let inputTitleID: USER_BUTTON_ID | undefined

    if (feswaPairBidInfo.ownerPairNft === account) {
      nftStatusString = "Your are the owner"
    }

    const timeNftCreation: number = feswaPairBidInfo.pairBidInfo.timeCreated.toNumber()
    const timeNftLastBid: number = feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()

    const now = DateTime.now().toSeconds()
    const timeNormalEnd = timeNftCreation + getBidDuration(chainId)             // Normal: 3600 * 24 * 3
    
    function setButtonAndInputTitleID(buttonID: USER_BUTTON_ID, titleID?: USER_BUTTON_ID, force?: boolean): USER_BUTTON_ID {
      inputTitleID = titleID??buttonID
      return setBidButtonID(inputError, buttonID, force)
    }
     
    switch (feswaPairBidInfo.pairBidInfo.poolState) {
      case NFT_BID_PHASE.BidToStart: 
        buttonID =  parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(newNftBidPrice)
                        ? setButtonAndInputTitleID(USER_BUTTON_ID.ERR_LOW_PRICE, USER_BUTTON_ID.OK_INIT_BID)
                        : setButtonAndInputTitleID(USER_BUTTON_ID.OK_INIT_BID)
        nftStatusString = nftStatusString??'Waiting for a bid'
        break
      case NFT_BID_PHASE.BidPhase: 
        if(now >= timeNormalEnd){
          if(now < (timeNftCreation + getBidDuration(chainId) + getReOpenDuration(chainId)) ){
            if (feswaPairBidInfo.ownerPairNft === account) {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_CLAIM, USER_BUTTON_ID.OK_TO_CLAIM, true)
            } else {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.ERR_BID_ENDED, USER_BUTTON_ID.OK_TO_BID)
            }
            nftStatusString = nftStatusString??'Bid Completed'
          }
          else{
            buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_REBID)
            nftStatusString = nftStatusString??'Open for re-bidding'
          }
        }else {
          buttonID =  parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(newNftBidPrice)
                          ? setButtonAndInputTitleID(USER_BUTTON_ID.ERR_LOW_PRICE, USER_BUTTON_ID.OK_TO_BID)
                          : setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_BID)
          nftStatusString = nftStatusString??'Bid Ongoing'
        }
        break
      case NFT_BID_PHASE.BidDelaying: 
        if(now >= (timeNftLastBid + 3600 * 2)) {
          if(now < (timeNftLastBid + getReOpenDuration(chainId))){
            if (feswaPairBidInfo.ownerPairNft === account) {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_CLAIM, USER_BUTTON_ID.OK_TO_CLAIM, true)
            } else {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.ERR_BID_ENDED, USER_BUTTON_ID.OK_TO_BID)
            }
            nftStatusString = nftStatusString??'Bid Completed'
          }
          else{
            buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_REBID)
            nftStatusString = nftStatusString??'Open for re-bidding'            
          }
        } else {
          buttonID =  parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(newNftBidPrice)
                          ? setButtonAndInputTitleID(USER_BUTTON_ID.ERR_LOW_PRICE, USER_BUTTON_ID.OK_TO_BID)
                          : setButtonAndInputTitleID(USER_BUTTON_ID.OK_TO_BID)
          nftStatusString = nftStatusString??'Bid in Overtime'
        }
        break
      case NFT_BID_PHASE.BidSettled:
        buttonID =  (feswaPairBidInfo.ownerPairNft === account)
                        ? setButtonAndInputTitleID(USER_BUTTON_ID.OK_FOR_SALE, USER_BUTTON_ID.OK_FOR_SALE, true)
                        : setButtonAndInputTitleID(USER_BUTTON_ID.ERR_BID_ENDED, USER_BUTTON_ID.OK_TO_BID)   
        nftStatusString = nftStatusString??'Bid completed'
        break
      case NFT_BID_PHASE.PoolHolding: 
          buttonID =  (feswaPairBidInfo.ownerPairNft === account)
                          ? setButtonAndInputTitleID(USER_BUTTON_ID.OK_FOR_SALE, USER_BUTTON_ID.OK_FOR_SALE, true)
                          : setButtonAndInputTitleID(USER_BUTTON_ID.ERR_BID_ENDED, USER_BUTTON_ID.OK_TO_BID)     
        nftStatusString = nftStatusString??'NFT in Holding'
        break
      case NFT_BID_PHASE.PoolForSale: 
          if(feswaPairBidInfo.ownerPairNft === account){
            if(!parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]) {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_CLOSE_SALE, USER_BUTTON_ID.OK_CLOSE_SALE, true) 
            }else{
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_CHANGE_PRICE)
            }
          } else {
            if(!parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]) {
              buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_BUY_NFT, USER_BUTTON_ID.OK_BUY_NFT, true)
            } else {
              buttonID =  parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(nftBidPrice??ZERO_FRACTION)
                            ? setButtonAndInputTitleID(USER_BUTTON_ID.ERR_LOW_BUY_PRICE, USER_BUTTON_ID.OK_BUY_NFT)
                            : setButtonAndInputTitleID(USER_BUTTON_ID.OK_BUY_NFT)
            }
          }
          nftStatusString = nftStatusString??'Token Pair NFT for Sale'
          break
        default:
          buttonID = inputError
          inputTitleID = USER_BUTTON_ID.OK_INIT_BID
          nftStatusString = nftStatusString??'Unknown Status'
      }

      if (buttonID !== savedButtonID){
        setSavedButtonID(buttonID)
        // clear previous error message while user change the action
        // and clear "Submitted" windows automatically
        if(txHash || nftBidErrorMessage){
          setNftBidState({  attemptingTxn: true, nftBidToConfirm: undefined, showConfirm: false, 
            nftBidErrorMessage: undefined, txHash: undefined })
        }
      }  
      inputTitleID = inputTitleID?? USER_BUTTON_ID.OK_INIT_BID      // to solve code warning
      return [buttonID, nftStatusString, inputTitleID]

    },[chainId, feswaPairBidInfo, nftBidPrice, newNftBidPrice, account, inputError, parsedAmounts, savedButtonID, 
        setSavedButtonID, txHash, nftBidErrorMessage])

  const nftStatus: number = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return -1
      return feswaPairBidInfo.pairBidInfo.poolState
      },[feswaPairBidInfo])

  const [ nftBidPriceString, newNftBidPriceString ] = useMemo(()=>{
      if(!nftBidPrice){
        if(feswType(chainId) === "FESW")  return ['','0.2']
        else return ['','0']
      }
      return [ nftBidPrice.toSignificant(6, undefined, Rounding.ROUND_UP), 
               newNftBidPrice.toSignificant(6, undefined, Rounding.ROUND_UP) ]
    },[chainId, nftBidPrice, newNftBidPrice])

  const nftLastBidTime = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return ''
      return DateTime.fromSeconds(feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()).toFormat("yyyy-LLL-dd HH:mm:ss"); 
    },[feswaPairBidInfo])

  const nftBidEndingTime = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return ''
      const timeNftCreation: number = feswaPairBidInfo.pairBidInfo.timeCreated.toNumber()
      const timeNftLastBid: number = feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()

      if (timeNftCreation === 0) return ''
      const now = DateTime.now().toSeconds()
      const timeNormalEnd = timeNftCreation + getBidDuration(chainId)        // Normal: 3600 * 24 * 14

      if(timeNftLastBid < (timeNormalEnd - 3600 * 2)){
        if(now > timeNormalEnd){
          return 'Ended'.concat(DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:mm:ss"))      
        }
        return DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:mm:ss")
      } 
      if(now < (timeNftLastBid + 3600 * 2)) {
        return DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:mm:ss")   
      }
      return 'Extra'.concat(DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:mm:ss"))     
    },[chainId, feswaPairBidInfo])

  const nftTrackedList = useTrackedNFTTokenPairs()

  const nftBid: NftBidTrade = { pairCurrencies, parsedAmounts, 
                                firtBidder: (feswaPairBidInfo?.ownerPairNft === ZERO_ADDRESS), 
                                feswaNftConfig}
  
  const { onNftUserInput, onNftCurrencySelection, onChangeNftRecipient, onNftTriggerRate } = useNftActionHandlers()

  const handleTypeInput = useCallback(
    (value: string) => { onNftUserInput(value) },
    [onNftUserInput]
  )

  const ethBalance = useETHBalances( account ? [account] : [] )
  const NATIVE_SYMBOL = chainId ? NATIVE[chainId].symbol : ''
  const {maxAmountInput, atMaxAmountInput} = useMemo(()=>{
      if( !account || !ethBalance ) return {undefined, boolean: false}
      const maxAmountInput = maxAmountSpend(ethBalance[account])
      const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.equalTo(maxAmountInput))
      return { maxAmountInput, atMaxAmountInput}
    }, [account, ethBalance, parsedAmounts] )

  async function handleNftBidding(){
    const nftBidderAmount = parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]

    const pairTokens =  { [Field.TOKEN_A]: wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId),
                          [Field.TOKEN_B]: wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId) 
                        }
 
    if (!nftBidderAmount || !account || !library || !chainId || !nftBidContract || !pairTokens ) return
    if (!pairTokens[Field.TOKEN_A] || !pairTokens[Field.TOKEN_B] ) return

    const tokenAddressA = pairTokens[Field.TOKEN_A]?.address
    const tokenAddressB = pairTokens[Field.TOKEN_B]?.address
      
    setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
    await nftBidContract.estimateGas['BidFeswaPair']( tokenAddressA, tokenAddressB, account, 
                                      { value: BigNumber.from(nftBidderAmount.raw.toString()) })
      .then(async(estimatedGasLimit) => {
        await nftBidContract.BidFeswaPair(tokenAddressA, tokenAddressB, account, 
                                          { value: BigNumber.from(nftBidderAmount.raw.toString()), 
                                            gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Bidding NFT: ${(pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId))}🔗${(pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId))}.
                      Bidding price: ${nftBidderAmount?.toSignificant(6)} ${NATIVE_SYMBOL}`
          })
          setNftBidState({ attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: response.hash })
        })
        .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
                throw new Error(`NFT Bidding failed: You denied transaction signature.`)
            } else {
              // otherwise, the error was unexpected and we need to convey that
              throw new Error(`NFT Bidding failed: ${error.message}`)
            }
        })
      })
      .catch((error: any) => {
        setNftBidState({attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: error.message, txHash: undefined })
      })
  }

  async function handleClaimNft(){
     if(!feswaPairBidInfo || !account || !nftBidContract || !chainId) return
    if(feswaPairBidInfo.ownerPairNft !== account) return
    if((recipient !== null) && (!isAddress(recipient))) return
    const nftID = feswaPairBidInfo.tokenIDPairNft.toHexString()
    const toAddess = recipient === null ? account : recipient
    
    if( feswType(chainId) === "FESW"){
      setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
      await nftBidContract.estimateGas['FeswaPairSettle'](nftID)
        .then(async(estimatedGasLimit) => {
          await nftBidContract.FeswaPairSettle(nftID, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `NFT Claiming: ${(pairCurrencies[Field.TOKEN_A]?.symbol)}🔗${(pairCurrencies[Field.TOKEN_B]?.symbol)}`
            })
            setNftBidState({ attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: response.hash })
          })
          .catch((error: any) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                  throw new Error(`NFT Claiming failed: You denied transaction signature.`)
              } else {
                // otherwise, the error was unexpected and we need to convey that
                throw new Error(`NFT Claiming failed: ${error.message}`)
              }
          })
        })
        .catch((error: any) => {
          setNftBidState({attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: error.message, txHash: undefined })
        })
    }
    else{
      setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
      const localRateTrigger = (rateTrigger === 0) ? 10 : rateTrigger

      await nftBidContract.estimateGas['ManageFeswaPair'](nftID, toAddess, localRateTrigger, 0)
        .then(async(estimatedGasLimit) => {
          await nftBidContract.ManageFeswaPair(nftID, toAddess, localRateTrigger, 0, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `NFT Claiming: ${(pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId))}🔗${(pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId))}.
                        ${(recipient !==null)? `Profit receiver: ${recipient}` : ''} 
                        arbitrage trigger price gap: ${(localRateTrigger/10).toFixed(1)}%`

            })
            setNftBidState({ attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: response.hash })
          })
          .catch((error: any) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                  throw new Error(`NFT Claiming failed: You denied transaction signature.`)
              } else {
                // otherwise, the error was unexpected and we need to convey that
                throw new Error(`NFT Claiming failed: ${error.message}`)
              }
          })
        })
        .catch((error: any) => {
          setNftBidState({attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: error.message, txHash: undefined })
        })
    }
  }

  async function handleSellNft(closeSale: boolean = false){
    const nftID = feswaPairBidInfo.tokenIDPairNft.toHexString()
    const nftBidderAmount = closeSale 
                            ? CurrencyAmount.ether('0')
                            : parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]
 
   if (!nftBidderAmount || !account || !nftBidContract) return
   if(feswaPairBidInfo.ownerPairNft !== account) return

   setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
   await nftBidContract.estimateGas['FeswaPairForSale'](nftID, nftBidderAmount.raw.toString())
     .then(async(estimatedGasLimit) => {
       await nftBidContract.FeswaPairForSale( nftID, nftBidderAmount.raw.toString(),
                                              { gasLimit: calculateGasMargin(estimatedGasLimit) })
       .then((response: TransactionResponse) => {
         addTransaction(response, {
           summary: `Selling NFT: ${(pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId))}🔗${(pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId))}.
                     Selling price: ${nftBidderAmount?.toSignificant(6)} ${NATIVE_SYMBOL}`
         })
         setNftBidState({ attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: response.hash })
       })
       .catch((error: any) => {
           // if the user rejected the tx, pass this along
           if (error?.code === 4001) {
               throw new Error(`NFT Selling failed: You denied transaction signature.`)
           } else {
             // otherwise, the error was unexpected and we need to convey that
             throw new Error(`NFT Selling failed: ${error.message}`)
           }
       })
     })
     .catch((error: any) => {
       setNftBidState({attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: error.message, txHash: undefined })
     })
 }

  async function handleBuyNft(){
    const nftID = feswaPairBidInfo.tokenIDPairNft.toHexString()

    // if user does not input the new price, set the price to zero to close the sale
    const nftBidderAmount = parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT] ?? CurrencyAmount.ether('0')
    const nftSalePrice = parsedAmounts[USER_UI_INFO.LAST_NFT_PRICE]

    if (!nftBidderAmount || !account || !nftBidContract || !nftSalePrice) return

    setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
    await nftBidContract.estimateGas['FeswaPairBuyIn'](  nftID, nftBidderAmount.raw.toString(), account,
                                                        { value: BigNumber.from(nftSalePrice.raw.toString())})
      .then(async(estimatedGasLimit) => {
        await nftBidContract.FeswaPairBuyIn( nftID, nftBidderAmount.raw.toString(), account,
                                              { value: BigNumber.from(nftSalePrice.raw.toString()), 
                                                gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Buying NFT: ${(pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId))}🔗${(pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId))}`
          })
          setNftBidState({ attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: response.hash })
        })
        .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error(`NFT buying failed: You denied transaction signature.`)
            } else {
              // otherwise, the error was unexpected and we need to convey that
              throw new Error(`NFT buying failed: ${error.message}`)
            }
        })
      })
      .catch((error: any) => {
        setNftBidState({attemptingTxn: false, nftBidToConfirm, showConfirm, nftBidErrorMessage: error.message, txHash: undefined })
      })
 }

  const isHighValueNftBidder: boolean = parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT] ? (!parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(HIGH_VALUE[chainId??ChainId.MAINNET])) : false

  const handleConfirmDismiss = useCallback(() => {
    setNftBidState({ showConfirm: false, nftBidToConfirm, attemptingTxn, nftBidErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onNftUserInput('')
    }
  }, [attemptingTxn, onNftUserInput, nftBidErrorMessage, nftBidToConfirm, txHash])

  const handleInputSelect = useCallback(
    inputCurrency => { onNftCurrencySelection(Field.TOKEN_A, inputCurrency)},
    [onNftCurrencySelection]
  )

  const handleOutputSelect = useCallback(
    outputCurrency => onNftCurrencySelection(Field.TOKEN_B, outputCurrency), 
    [onNftCurrencySelection] 
  )

  const handleNftSelect = useCallback(
    ([CurrencyA, CurrencyB]: [Currency|undefined, Currency|undefined]) => {
      if(!CurrencyA || !CurrencyB) return
      onNftCurrencySelection(Field.TOKEN_A, CurrencyA)
      onNftCurrencySelection(Field.TOKEN_B, CurrencyB)
    },       
    [onNftCurrencySelection] 
  )

  const handleAcceptChanges = useCallback(() => {
    setNftBidState({ nftBidToConfirm: nftBid, nftBidErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, nftBidErrorMessage, nftBid, txHash])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onNftUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onNftUserInput])

  const [showMore, setShowMore] = useState(false)
  const fixedList = useRef<FixedSizeList>()

  const adderNftList = useNFTPairAdder()
  const handleAddNftToTrackList = useCallback(() => {
        const tokenA = wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId)
        const tokenB = wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId)

        if (!tokenA || !tokenB) return       
        adderNftList( tokenA, tokenB,  false)
    }, [adderNftList, pairCurrencies, chainId])

  const changeRateTriggerCallback = useCallback(
    (triggerRate: number) => {
      onNftTriggerRate( triggerRate)
    },
    [onNftTriggerRate]
  )

  return (
    <>
      <AppBody>
        <StyledPageCard bgColor={'red'}>
        <PageHeader header="Bid NFTs"> 
          { chainId && nftBid.feswaNftConfig && ( <QuestionHelper text={'NFT Bid Rules:'} info={<NFTBidHelpInfo nftBid={nftBid}/>} /> ) }
        </PageHeader>
        <Wrapper id="nft-bid-page">
          <ConfirmNftModal
            isOpen={showConfirm}
            nftBid={nftBid}
            originalNftBid={nftBidToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            onConfirm={() =>  {
                                if (buttonID === USER_BUTTON_ID.OK_INIT_BID) handleNftBidding()
                                if (buttonID === USER_BUTTON_ID.OK_TO_BID) handleNftBidding()
                                if (buttonID === USER_BUTTON_ID.OK_TO_REBID) handleNftBidding()
                                if (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) handleClaimNft()
                                if (buttonID === USER_BUTTON_ID.OK_FOR_SALE) handleSellNft()
                                if (buttonID === USER_BUTTON_ID.OK_CHANGE_PRICE) handleSellNft()
                                if (buttonID === USER_BUTTON_ID.OK_CLOSE_SALE) handleSellNft(true)
                                if (buttonID === USER_BUTTON_ID.OK_BUY_NFT) handleBuyNft()
                              }}
            swapErrorMessage={nftBidErrorMessage}
            onDismiss={handleConfirmDismiss}
            highNftPrice = {isHighValueNftBidder}
            buttonID = {buttonID}
          />
          <AutoColumn gap={'md'}>
            <TokenPairSelectPanel
              currencyA={pairCurrencies[Field.TOKEN_A]}
              currencyB={pairCurrencies[Field.TOKEN_B]}              
              onCurrencySelectA={handleInputSelect}
              onCurrencySelectB={handleOutputSelect}
              id="NFT-bid-currency-input"
            />
            <CurrencyInputPanel
              label={userInputTitle[buttonID]??userInputTitle[inputTitleID]??'Bid Price'}
              value={typedValue}
              showMaxButton={!atMaxAmountInput}
              currency={ETHER}
              onUserInput={handleTypeInput}
              disableInput = { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) ? true: 
                               (buttonID === USER_BUTTON_ID.ERR_BID_ENDED) ? true: false}
              onMax={handleMaxInput}
              disableCurrencySelect = {true}
              id="NFT-bid-currency-input"
              customBalanceText = 'Balance: '
            />

            { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) && (recipient === null) && (
              <AutoRow justify={'space-between'} style={{ padding: '0 1rem', alignItems: 'center' }}>
                <div />
                <LinkStyledButton id="add-recipient-button" onClick={() => onChangeNftRecipient('')}>
                  <Text fontWeight={500} fontSize={16}>
                    + Specify Profit Receiver
                    <QuestionHelper text="By default your NFT owner address will be used to receive the gain, 
                                          60% of the liquidity pool protocol profit.
                                          Anyhow you could specify a different receiver address." />
                  </Text>
                </LinkStyledButton>
              </AutoRow>
            )}
            { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) && (recipient !== null) && (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeNftRecipient(null)}>
                    <Text fontWeight={500} fontSize={16}>
                      - Send to NFT owner
                      <QuestionHelper text="Your NFT owner address will be used to receive the liquidity pool exchange profit by default.
                                          Anyhow you could specify a different receiver address." />
                    </Text>
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" placeholder="Profit Receiver Address" value={recipient} onChange={onChangeNftRecipient} />
              </>
            )}
            { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) && (
              <Container hideInput={false} style={{ padding: '0px 0px 6px 0px'}}>
                  <AutoColumn gap="6px">
                    <RowBetween>
                      <Row style={{ margin: '6px 0px 0px 8px', alignItems: 'center' }}>
                        <Text fontWeight={500}>Price gap to trigger arbitrage</Text>
                        <QuestionHelper text="While the token prices in two sub liquidity pools deviate more than the specified rate, 
                                      internal token swap is triggerd to balance the prices. The rate set by the Nft owner weights 60%." />
                      </Row>

                      <RowFixed>
                        <ButtonEmpty
                          padding="6px 0px"
                          onClick={() => {  showMore ? onNftTriggerRate(0) : onNftTriggerRate(10)
                                            setShowMore(!showMore) }}
                        >
                          {showMore ? (
                            <>
                              <Text> Default </Text>
                              <ChevronUp style={{ margin: '0px 8px 0px 20px'}} />
                            </>
                          ) : (
                            <>
                              <Text> Config </Text>
                              <ChevronDown style={{ margin: '0px 8px 0px 20px'}} />
                            </>
                          )}
                        </ButtonEmpty>
                      </RowFixed>
                    </RowBetween>

                    {showMore && 
                      <CardWrapper >
                        <Row style={{ margin: '0px 6px 0px 8px', alignItems: 'center'}}>
                          <Text fontSize={40} fontWeight={500} color={theme.primary1}>
                            {(rateTrigger/10).toFixed(1)}%
                          </Text>
                        </Row>
                        <Row style={{ margin: '0 0.5 0 1em', alignItems: 'center' }}>
                          <AutoColumn gap="2px" style={{ margin: '0 1 0 1em', width: '100%' }} >
                            <Slider value={rateTrigger} onChange={changeRateTriggerCallback} 
                                          min= {10} step={1} max={50} size={12}/>
                            <RowBetween style={{ width: '90%', marginLeft: 15, marginRight: 15, paddingBottom: '10px' }}>
                              <RateButton onClick={() => onNftTriggerRate(10)} width="16%">
                                1%
                              </RateButton>
                              <RateButton onClick={() => onNftTriggerRate(20)} width="16%">
                                2%
                              </RateButton>
                              <RateButton onClick={() => onNftTriggerRate(30)} width="16%">
                                3%
                              </RateButton>
                              <RateButton onClick={() => onNftTriggerRate(40)} width="16%">
                                4%
                              </RateButton>
                              <RateButton onClick={() => onNftTriggerRate(50)} width="16%">
                                5%
                              </RateButton>
                            </RowBetween>
                          </AutoColumn>
                        </Row>
                      </CardWrapper>
                    }
                  </AutoColumn>
                </Container> 
              )
            }
            { (pairCurrencies[Field.TOKEN_A] && pairCurrencies[Field.TOKEN_B]) && chainId && (
              <Container hideInput={false}>
                <LabelRow>
                  <RowBetween style={{ margin: '0 6px 0 6px', alignItems: 'center' }}>
                      <RowFixed>
                        <DoubleCurrencyLogo currency0={pairCurrencies[Field.TOKEN_A]} currency1={pairCurrencies[Field.TOKEN_B]} size={20} />
                        <Text fontWeight={500} fontSize={18} style={{ margin: '0 0 0 6px' }} >
                          {pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId)}/{pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId)}
                        </Text>
                      </RowFixed>
                      <RowFixed gap={'6px'} style={{  margin: '0 0 0 6px', alignItems: 'left' }}>
                        <TYPE.body color={theme.primary1} fontWeight={500} fontSize={15}>
                          <strong>{nftStatusPrompt}</strong>
                        </TYPE.body>
                        { nftPairToSave && (!!feswaPairBidInfo.pairBidInfo) && (
                          <StyledNFTButton  onClick={handleAddNftToTrackList} >
                            <RowFixed color={theme.primary1}> 
                              <PlusCircle size={14} />
                            </RowFixed>        
                          </StyledNFTButton>
                        )}       
                      </RowFixed>
                  </RowBetween>
                </LabelRow>
                <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 6px 12px 6px' }}>
                  { (nftStatus === NFT_BID_PHASE.BidToStart) && (
                    <TYPE.italic textAlign="center" fontSize={15} style={{ width: '100%' }}>
                      You will be the first bidder <br />
                      Minimum Bid Price: <strong> {newNftBidPriceString} {NATIVE[chainId].symbol} </strong>
                      { (buttonID === USER_BUTTON_ID.ERR_NO_START) && feswaNftConfig &&
                          <span> <br/>Bid will start at: 
                             <Text color={theme.primary1}><strong> {DateTime.fromSeconds(feswaNftConfig.SaleStartTime.toNumber())
                                  .toFormat("yyyy-LLL-dd HH:mm:ss")}</strong></Text>
                          </span>    
                      }                    
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidPhase) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Current Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong>  <br />
                      Last Bid Time: <strong> {nftLastBidTime} </strong>  <br />
                      { nftBidEndingTime.startsWith('Ended')
                        ? <span>  Bid Completed at: <strong> {nftBidEndingTime.substr(5)} </strong> </span>
                        : <span>  Bid Ending Time: <strong> {nftBidEndingTime} </strong>  <br /> 
                                  Minimum Bid Price: <strong> {newNftBidPriceString} {NATIVE[chainId].symbol} </strong> </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidDelaying) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Current Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong> <br />
                      Last Bid Time: <strong>{nftLastBidTime}</strong>  <br />
                      { nftBidEndingTime.startsWith('Extra')
                        ? <span>  Bid Completed at: <strong> {nftBidEndingTime.substr(5)} </strong> <br /> </span>
                        : <span>  Bid Extra Ending Time: <strong> {nftBidEndingTime} </strong> <br /> 
                                  Minimum Bid Price: <strong> {newNftBidPriceString} {NATIVE[chainId].symbol} </strong> </span>
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidSettled) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  Your NFT Bid Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong> <br />
                                  Cherish this NFT which brings <strong> WEALTH </strong><br />
                                  You also could list it <strong> FOR SALE </strong> </span> 
                        : <span>  Final Bid Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong> <br />
                                  Bid Time Window is <strong>CLOSED</strong> </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolHolding) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Final Bid Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong> <br />
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  You could hold it , or sell it at specified price </span> 
                        : <span>  The owner is holding </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolForSale) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      This token-pair NFT is for sale <br/> 
                      Current NFT Sale Price: <strong> {nftBidPriceString} {NATIVE[chainId].symbol} </strong> <br/>
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  You could set new sale price or just close the sale </span> 
                        : <span>  You could buy it for holding and profit yielding </span> 
                      }
                    </TYPE.italic>
                  )}
                </AutoColumn>
              </Container>
            )}

            {isHighValueNftBidder && (
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="10px">
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.red2}>
                      High-Value NFT Bid:
                    </Text>
                    { (buttonID === USER_BUTTON_ID.ERR_LOW_BALANCE)
                      ? (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                          Insufficient {NATIVE_SYMBOL}
                        </Text>)
                      : (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                          {parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6)} {NATIVE_SYMBOL}
                        </Text>)
                    }
                    </RowBetween>
                </AutoColumn>
              </Card>)
            }
          </AutoColumn>

          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap="8px">
              <ButtonError
                onClick={() => {
                  if(nftPairToSave){ 
                    handleAddNftToTrackList()
                  }
                  setNftBidState({
                    nftBidToConfirm: nftBid,
                    attemptingTxn: false,
                    nftBidErrorMessage: undefined,
                    showConfirm: true,
                    txHash: undefined
                  })
                }}
                id="NFT-bid-button"
                disabled={ (buttonID < USER_BUTTON_ID.OK_INIT_BID) || ((buttonID===USER_BUTTON_ID.OK_TO_CLAIM) && (inputError === USER_BUTTON_ID.ERR_NO_RECIPIENT)) }
                error={ isHighValueNftBidder && (buttonID >= USER_BUTTON_ID.OK_INIT_BID) && (buttonID <= USER_BUTTON_ID.OK_CHANGE_PRICE)}
              >
                <Text fontSize={20} fontWeight={500}>
                  { `${ (buttonID === USER_BUTTON_ID.ERR_LOW_BALANCE) ? `Insufficient ${Currency.getNativeCurrencySymbol(chainId)} Balance` : BidButtonPrompt[buttonID]} 
                     ${ (isHighValueNftBidder && (buttonID >= USER_BUTTON_ID.OK_INIT_BID) && (buttonID <= USER_BUTTON_ID.OK_CHANGE_PRICE)) 
                      ? ' Anyway' : ''}`}
                </Text>

              </ButtonError>
              </AutoColumn>              
            )}
            {nftBidErrorMessage && !showConfirm ? <SwapCallbackError error={nftBidErrorMessage} /> : null}
           </BottomGrouping>
        </Wrapper>
        </StyledPageCard>
      </AppBody>
      { (nftTrackedList.length > 0) ?
        <NftList nftList={nftTrackedList} pairCurrencies = {pairCurrencies} onNftTokenSelect={handleNftSelect} fixedListRef={fixedList} /> : null
      }
    </>
  )
}