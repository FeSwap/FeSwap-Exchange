import { Currency, Fraction, Rounding } from '@uniswap/sdk'
import React, { useCallback, useContext, useState, useMemo, useRef } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { darken } from 'polished'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import { ConfirmNftManageModal } from '../../components/Nft/ConfirmNftModal'
import TokenPairSelectPanel from '../../components/TokenPairSelectPanel'
import { Container } from '../../components/CurrencyInputPanel'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import PageHeader from '../../components/PageHeader'
import { useActiveWeb3React } from '../../hooks'
import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle, useBlockNumber } from '../../state/application/hooks'
import { Field, NFT_BID_PHASE, BidButtonPrompt, USER_BUTTON_ID } from '../../state/nft/actions'
import { Link } from 'react-router-dom'
import Slider from '../../components/Slider'
import QuestionHelper from '../../components/QuestionHelper'

import {
  NftManageTrade,
  useDerivedNftManageInfo,
  useNftActionHandlers,
  useNftState,
  setBidButtonID,
  useGetUserNFTList
} from '../../state/nft/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import AppBody from '../AppBody'
//import { BigNumber } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useNftBidContract } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin,  WEI_DENOM } from '../../utils'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
//import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { DateTime } from 'luxon'
import { NftInfoList } from '../../components/Nft'
import { FixedSizeList } from 'react-window'
//import { useNFTPairAdder } from '../../state/user/hooks'
import { ZERO_ADDRESS } from '../../constants'


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

const RateButton = styled.button<{ width: string }>`
  padding: 2px 8px;
  background-color: ${({ theme }) => theme.bg4};
  border: 1px solid ${({ theme }) => theme.bg4};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  :hover {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    outline: none;
  }
`

export default function CreatePairByNft() {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const nftBidContract = useNftBidContract()
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [isExpertMode] = useExpertModeManager()
  const currentBlock = useBlockNumber()

  const {feswaNftPairBidInfo} = useGetUserNFTList()

  // NFT Bidding state
  const {
    rateTrigger,
    recipient,
  } = useNftState()

  const {
    feswaPairBidInfo,
    feswaPoolPair,
    pairCurrencies,
    inputError
  } = useDerivedNftManageInfo()

  const { address: recipientAddress } = useENSAddress(recipient)

    // modal and loading
  const [{ showConfirm, nftBidToConfirm, nftBidErrorMessage, attemptingTxn, txHash }, setNftBidState] = useState<{
    showConfirm: boolean
    nftBidToConfirm: NftManageTrade | undefined
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

  console.log(attemptingTxn)

  const [buttonID, nftStatusPrompt] = useMemo(()=>{
    if (!feswaPairBidInfo.pairBidInfo) return [inputError, 'Waiting...']

    let buttonID: USER_BUTTON_ID | undefined
    let nftStatusString: string | undefined

    const timeNftCreation: number = feswaPairBidInfo.pairBidInfo.timeCreated.toNumber()
    const timeNftLastBid: number = feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()
    const now = DateTime.now().toSeconds()
    const timeNormalEnd = timeNftCreation + 3600 * 10                 // Normal: 3600 * 24 * 14
    
    function setButtonAndInputTitleID(buttonID: USER_BUTTON_ID, force?: boolean): USER_BUTTON_ID {
      return setBidButtonID(inputError, buttonID, force)
    }
  
    switch (feswaPairBidInfo.pairBidInfo.poolState) {
      case NFT_BID_PHASE.BidToStart: 
        buttonID =  setButtonAndInputTitleID(USER_BUTTON_ID.OK_JUMP_BID)
        nftStatusString = 'Waiting for a bid'
        break
      case NFT_BID_PHASE.BidPhase: 
        [buttonID, nftStatusString] = (now >= timeNormalEnd) 
                                      ? (feswaPairBidInfo.ownerPairNft === account)
                                        ? [ USER_BUTTON_ID.OK_JUMP_BID, 'Bid Completed'] 
                                        : [ USER_BUTTON_ID.ERR_BID_ENDED, 'Bid Completed'] 
                                      : [ USER_BUTTON_ID.OK_JUMP_BID, 'Bid Ongoing']
        break

      case NFT_BID_PHASE.BidDelaying: 
        [buttonID, nftStatusString] =  (now >= (timeNftLastBid + 3600 * 2))
                                      ? (feswaPairBidInfo.ownerPairNft === account)
                                        ? [ USER_BUTTON_ID.OK_JUMP_BID, 'Bid Completed'] 
                                        : [ USER_BUTTON_ID.ERR_BID_ENDED, 'Bid Completed'] 
                                      : [ USER_BUTTON_ID.OK_JUMP_BID, 'Bid Overtime']
        break
      case NFT_BID_PHASE.BidSettled:
      case NFT_BID_PHASE.PoolHolding: 
        buttonID =  (feswaPairBidInfo.ownerPairNft === account)
                      ? feswaPoolPair && feswaPoolPair === ZERO_ADDRESS
                        ? setButtonAndInputTitleID(USER_BUTTON_ID.OK_CREATE_PAIR)
                        : setButtonAndInputTitleID(USER_BUTTON_ID.OK_CHNAGE_CONFIG)
                      : setButtonAndInputTitleID(USER_BUTTON_ID.ERR_BID_ENDED )   
        nftStatusString = feswaPairBidInfo.pairBidInfo.poolState === NFT_BID_PHASE.BidSettled ? 'Bid Settled' : 'NFT in Holding'
        break
      case NFT_BID_PHASE.PoolForSale: 
          buttonID = setButtonAndInputTitleID(USER_BUTTON_ID.OK_JUMP_BID)
          nftStatusString = nftStatusString??'Token Pair NFT for Sale'
          break
      default:
          buttonID = inputError
          nftStatusString = nftStatusString??'Unknown Status'
      }
      return [buttonID, nftStatusString]
    },[feswaPairBidInfo, account, inputError, currentBlock, txHash, nftBidErrorMessage])

  const nftStatus: number = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return -1
      return feswaPairBidInfo.pairBidInfo.poolState
      },[feswaPairBidInfo])
  
  const nftBidPriceString  = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return '_'
      const nftBidPrice = new Fraction(feswaPairBidInfo.pairBidInfo.currentPrice.toString(), WEI_DENOM)
      return nftBidPrice.toSignificant(6, {rounding: Rounding.ROUND_UP}) 
    },[feswaPairBidInfo])

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
      const timeNormalEnd = timeNftCreation + 3600 * 10       // Normal: 3600 * 24 * 14

      if(timeNftLastBid < (timeNormalEnd - 3600 * 2)){
        if(now > timeNormalEnd){
          return 'Ended'.concat(DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:mm:ss"))      
        }
        return DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:mm:ss")
      } 
      if(now < (timeNftLastBid + 3600 * 2)) {
        return DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:mm:ss")   
      }
      return 'Ended'.concat(DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:mm:ss"))     
    },[feswaPairBidInfo])

  const nftManageTrade: NftManageTrade = { pairCurrencies, recipientAddress }
  const { onNftCurrencySelection, onNftTriggerRate, onChangeNftRecipient } = useNftActionHandlers()

  async function handleNftManaging(){

    if ( !account || !library || !chainId || !nftBidContract ) return
 
    const toAddess = recipientAddress === null ? account : recipientAddress
    const nftTokenID = feswaPairBidInfo.tokenIDPairNft
      
    setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
    await nftBidContract.estimateGas['ManageFeswaPair']( nftTokenID.toString(), toAddess )
      .then(async(estimatedGasLimit) => {
        await nftBidContract.ManageFeswaPair(nftTokenID.toString(), toAddess, 
                                            { gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Managing NFT: ${(pairCurrencies[Field.TOKEN_A]?.symbol)}🔗${(pairCurrencies[Field.TOKEN_B]?.symbol)}.`
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


  const handleConfirmDismiss = useCallback(() => {
    setNftBidState({ showConfirm: false, nftBidToConfirm, attemptingTxn, nftBidErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onNftTriggerRate(10)
    }
  }, [attemptingTxn, onNftTriggerRate, nftBidErrorMessage, nftBidToConfirm, txHash])


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

  const fixedList = useRef<FixedSizeList>()

   const changeRateTriggerCallback = useCallback(
    (triggerRate: number) => {
      onNftTriggerRate( triggerRate)
    },
    [onNftTriggerRate]
  )


/*
  <ConfirmNftModal
  isOpen={showConfirm}
  nftBid={nftManageTrade}
  originalNftBid={nftBidToConfirm}
  onAcceptChanges={handleAcceptChanges}
  attemptingTxn={attemptingTxn}
  txHash={txHash}
  recipient={recipient}
  onConfirm={() =>  {
                      if (buttonID === USER_BUTTON_ID.OK_INIT_BID) handleNftManaging()
                      if (buttonID === USER_BUTTON_ID.OK_TO_BID) handleNftManaging()
                    }}
  swapErrorMessage={nftBidErrorMessage}
  onDismiss={handleConfirmDismiss}
  highNftPrice = {isHighValueNftBidder}
  buttonID = {buttonID}
/>
*/

  return (
    <>
      <AppBody>
        <PageHeader header="Create/Config NFT Pool" />
        <Wrapper id="nft-bid-page">
            <ConfirmNftManageModal
              isOpen={showConfirm}
              nftBid={undefined}
              originalNftBid={undefined}
              onAcceptChanges={()=>{}}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              onConfirm={() =>  {
                                  if (buttonID === USER_BUTTON_ID.OK_INIT_BID) handleNftManaging()
                                  if (buttonID === USER_BUTTON_ID.OK_TO_BID) handleNftManaging()
                                }}
              swapErrorMessage={nftBidErrorMessage}
              onDismiss={handleConfirmDismiss}
              highNftPrice = {false}
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

            { (recipient === null && isExpertMode) && (
              <AutoRow justify={'space-between'} style={{ padding: '0 1rem', alignItems: 'center' }}>
                <div />
                <LinkStyledButton id="add-recipient-button" onClick={() => onChangeNftRecipient('')}>
                  <Text fontWeight={500} fontSize={16}>
                    + Specify Profit Receiver
                    <QuestionHelper text="Your NFT owner address will be used to receive the liquidity pool exchange profit by default.
                                          Anyhow you could specify a different receiver address." />
                  </Text>
                </LinkStyledButton>
              </AutoRow>
            )}

            {recipient !== null && (
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
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeNftRecipient} />
              </>
            )}
              <Container hideInput={false}>
                  <AutoColumn gap="6px">
                    <Row style={{ margin: '6px 0px 0px 8px', alignItems: 'center' }}>
                      <Text fontWeight={500}>Price gap to trigger arbitrage</Text>
                      <QuestionHelper text="While the token prices in two sub liquidity pools deviate more than the specified rate, 
                                    internal token swap is triggerd to balance the prices. The rate set by the Nft owner weights 60%." />
                    </Row>
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
                  </AutoColumn>
            </Container>

            { (pairCurrencies[Field.TOKEN_A] && pairCurrencies[Field.TOKEN_B]) && (
              <Container hideInput={false}>
                <LabelRow>
                  <RowBetween style={{ margin: '0 6px 0 6px', alignItems: 'center' }}>
                      <RowFixed>
                        <DoubleCurrencyLogo currency0={pairCurrencies[Field.TOKEN_A]} currency1={pairCurrencies[Field.TOKEN_B]} size={20} />
                        <Text fontWeight={500} fontSize={18} style={{ margin: '0 0 0 6px' }} >
                          {pairCurrencies[Field.TOKEN_A]?.symbol}/{pairCurrencies[Field.TOKEN_B]?.symbol}
                        </Text>
                      </RowFixed>
                      <RowFixed gap={'6px'} style={{  margin: '0 0 0 6px', alignItems: 'left' }}>
                        <TYPE.body color={theme.primary1} fontWeight={500} fontSize={15}>
                          <strong>{nftStatusPrompt}</strong>
                        </TYPE.body>
                      </RowFixed>
                  </RowBetween>
                </LabelRow>
                <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 6px 12px 6px' }}>
                  { (nftStatus === NFT_BID_PHASE.BidToStart) && (
                    <TYPE.italic textAlign="center" fontSize={15} style={{ width: '100%' }}>
                      You will be the first bidder <br />
                      Minimum Bid price: <strong> 0.2 ETH </strong>
                    </TYPE.italic>
                  )}
                  { ((nftStatus === NFT_BID_PHASE.BidPhase) || (nftStatus === NFT_BID_PHASE.BidDelaying)) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Current price: <strong> {nftBidPriceString} ETH </strong>  <br />
                      Last Bid Time: <strong> {nftLastBidTime} </strong>  <br />
                      { nftBidEndingTime.startsWith('Ended')
                        ? (feswaPairBidInfo.ownerPairNft === account)
                          ? <span>  Bid Completed at: <strong> {nftBidEndingTime.substr(5)} </strong> <br />
                                    Your need to <strong> Settle </strong> the bid </span>
                          : <span>  Bid Completed at: <strong> {nftBidEndingTime.substr(5)} </strong> <br />
                                    Your are <strong> NOT </strong> the Owner </span>
                        : <span>  Bid Ending Time: <strong> {nftBidEndingTime} </strong>  </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidSettled) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  Your NFT bid price: <strong> {nftBidPriceString} ETH </strong> <br />
                                  Cherish this NFT which brings <strong> WEALTH </strong></span> 
                        : <span>  Final bid price: <strong> {nftBidPriceString} ETH </strong> <br />
                                  Bid Time Window is <strong>CLOSED</strong> </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolHolding) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Final bid price: <strong> {nftBidPriceString} ETH </strong> <br />
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  Cherish this NFT which brings <strong> WEALTH </strong> </span> 
                        : <span>  The owner is holding </span> 
                      }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolForSale) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      This token-pair NFT is for sale <br/> 
                      Current NFT sale price: <strong> {nftBidPriceString} ETH </strong> <br/>
                      { (feswaPairBidInfo.ownerPairNft === account) 
                        ? <span>  You could keep it for sale </span> 
                        : <span>  You could buy it for holding </span> 
                      }
                    </TYPE.italic>
                  )}
                </AutoColumn>
              </Container>
            )}
          </AutoColumn>

          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap="8px">
                { (buttonID === USER_BUTTON_ID.OK_JUMP_BID) 
                  ? <ButtonPrimary as={Link} to={"/nft"}>
                    <Text fontWeight={500} fontSize={20}>
                      Join in NFT Bidding ↗
                    </Text>
                    </ButtonPrimary>
                  :
                  <ButtonError
                    onClick={() => {
                      if (isExpertMode) {
                        handleNftManaging()
                      } else {
                        setNftBidState({
                          nftBidToConfirm: nftManageTrade,
                          attemptingTxn: false,
                          nftBidErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined
                        })
                      }
                    }}
                    id="NFT-bid-button"
                    disabled={ buttonID < USER_BUTTON_ID.OK_INIT_BID}
                    error={ (buttonID >= USER_BUTTON_ID.OK_INIT_BID) && (buttonID <= USER_BUTTON_ID.OK_CHANGE_PRICE)}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      { `${buttonID === USER_BUTTON_ID.ERR_BID_ENDED ? 'Not Owner': BidButtonPrompt[buttonID]}`}
                    </Text>
                  </ButtonError>  
                }
              </AutoColumn>              
            )}
            {nftBidErrorMessage && !showConfirm ? <SwapCallbackError error={nftBidErrorMessage} /> : null}
           </BottomGrouping>
        </Wrapper>
      </AppBody>
      { (feswaNftPairBidInfo.length > 0) ?
        <NftInfoList nftPairList={feswaNftPairBidInfo} pairCurrencies = {pairCurrencies} onNftTokenSelect={handleNftSelect} fixedListRef={fixedList} /> : null
      }
    </>
  )
}