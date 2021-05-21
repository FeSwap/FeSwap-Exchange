import { Currency, ETHER, Fraction, Rounding } from '@uniswap/sdk'
import React, { useCallback, useContext, useState, useMemo, useRef } from 'react'
// import { useDispatch } from 'react-redux'
import { PlusCircle } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { darken } from 'polished'
//import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight } from '../../components/Button'
import Card  from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmNftModal from '../../components/Nft/ConfirmNftModal'
import CurrencyInputPanel, { Container } from '../../components/CurrencyInputPanel'
import TokenPairSelectPanel from '../../components/TokenPairSelectPanel'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import PageHeader from '../../components/PageHeader'
//import { FESW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { Field, WALLET_BALANCE, NFT_BID_PHASE, BidButtonPrompt, USER_BUTTON_ID } from '../../state/nft/actions'
//import { Field, WALLET_BALANCE, NFT_BID_PHASE, BidButtonPrompt, USER_BUTTON_ID } from '../../state/nft/actions'
import {
  NftBidTrade,
  useDerivedNftInfo,
  useNftActionHandlers,
  useNftState,
  setBidButtonID
} from '../../state/nft/hooks'
import { useExpertModeManager, useTrackedNFTTokenPairs } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { BigNumber } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useNftBidContract } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, FIVE_FRACTION, WEI_DENOM, ZERO_FRACTION, 
  ONE_TENTH_FRACTION, TEN_PERCENT_MORE } from '../../utils'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { DateTime } from 'luxon'
import NftList, { StyledNFTButton } from '../../components/Nft/NftList'
import { FixedSizeList } from 'react-window'
// import { AppDispatch } from '../../state'
import { useNFTPairAdder } from '../../state/user/hooks'
// import { SerializedPair } from '../../state/user/actions'

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

export default function Nft() {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const nftBidContract = useNftBidContract()
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [isExpertMode] = useExpertModeManager()

  // NFT Bidding state
  const {
    typedValue,
    recipient,
  } = useNftState()

  const {
    feswaPairBidInfo,
    pairCurrencies,
    parsedAmounts,
    nftPairToSave,
    inputError
  } = useDerivedNftInfo()

  const { address: recipientAddress } = useENSAddress(recipient)

  const [buttonID, nftStatusPrompt] = useMemo(()=>{
    if (!feswaPairBidInfo.pairBidInfo) return [inputError, 'Waiting...']

    let NftBidStatus: USER_BUTTON_ID
    let nftStatusString: string | undefined
    if (feswaPairBidInfo.ownerPairNft === account) {
      nftStatusString = "Your are the owner"
    }
     
    switch (feswaPairBidInfo.pairBidInfo.poolState) {
      case NFT_BID_PHASE.BidToStart: 
        NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_INIT_BID)
        nftStatusString = nftStatusString??'Waiting for a bid'
        break
      case NFT_BID_PHASE.BidPhase: 
        NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_TO_BID)
        nftStatusString = nftStatusString??'Bid ongoing'
        break
      case NFT_BID_PHASE.BidDelaying: 
        NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_TO_BID)
        nftStatusString = nftStatusString??'Bid in overtime'
        break
      case NFT_BID_PHASE.BidSettled:
        NftBidStatus =  (feswaPairBidInfo.ownerPairNft === account)
                        ? setBidButtonID(inputError, USER_BUTTON_ID.OK_FOR_SALE)
                        : setBidButtonID(inputError, USER_BUTTON_ID.ERR_BID_ENDED)   
        nftStatusString = nftStatusString??'Bid completed'
        break
      case NFT_BID_PHASE.PoolHolding: 
          NftBidStatus =  (feswaPairBidInfo.ownerPairNft === account)
                          ? setBidButtonID(inputError, USER_BUTTON_ID.OK_FOR_SALE)
                          : setBidButtonID(inputError, USER_BUTTON_ID.ERR_BID_ENDED)     
        nftStatusString = nftStatusString??'NFT in holding'
        break
      case NFT_BID_PHASE.PoolForSale: 
          if(feswaPairBidInfo.ownerPairNft === account){
            if(!parsedAmounts[WALLET_BALANCE.ETH]) {
              NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_CLOSE_SALE) 
            }else{
              NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_CHANGE_PRICE)
            }
          } else {
            NftBidStatus = setBidButtonID(inputError, USER_BUTTON_ID.OK_BUY_NFT)    
          }
          nftStatusString = nftStatusString??'Pair NFT on sale'
          break
        default:
          NftBidStatus = inputError
          nftStatusString = nftStatusString??'Unknown Status'
      }  
      return [NftBidStatus, nftStatusString]

    },[feswaPairBidInfo, account, inputError, parsedAmounts])

   const nftStatus: number = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return -1
      return feswaPairBidInfo.pairBidInfo.poolState
      },[feswaPairBidInfo])
  
  const [ nftBidPriceString, newNftBidPriceString ] = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return ['_', '_']
      const nftBidPrice = new Fraction(feswaPairBidInfo.pairBidInfo.currentPrice.toString(), WEI_DENOM)
      const newNftBidPrice =  nftBidPrice.lessThan(ZERO_FRACTION) 
                              ? nftBidPrice.add(ONE_TENTH_FRACTION) 
                              : nftBidPrice.multiply(TEN_PERCENT_MORE)
      return [ nftBidPrice.toSignificant(6, {rounding: Rounding.ROUND_UP}), 
               newNftBidPrice.toSignificant(6, {rounding: Rounding.ROUND_UP}) ]
    },[feswaPairBidInfo])

  const nftLastBidTime = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return ''
      return DateTime.fromSeconds(feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()).toFormat("yyyy-LLL-dd HH:MM:ss"); 
    },[feswaPairBidInfo])

  const nftBidEndingTime = useMemo(()=>{
      if (!feswaPairBidInfo.pairBidInfo) return ''
      const timeNftCreation: number = feswaPairBidInfo.pairBidInfo.timeCreated.toNumber()
      const timeNftLastBid: number = feswaPairBidInfo.pairBidInfo.lastBidTime.toNumber()

      const now = DateTime.now().toSeconds()
      const timeNormalEnd = timeNftCreation + 3600 * 10       // Normal: 3600 * 24 * 14

      if(timeNftLastBid < (timeNormalEnd - 3600 * 2)){
        if(now > timeNftLastBid){
          return 'Ended'.concat(DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:MM:ss"))      
        }
        return DateTime.fromSeconds(timeNormalEnd).toFormat("yyyy-LLL-dd HH:MM:ss")
      } 
      if(now < (timeNftLastBid + 3600 * 2)) {
        return DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:MM:ss")   
      }
      return 'Extra'.concat(DateTime.fromSeconds(timeNftLastBid + 3600 * 2).toFormat("yyyy-LLL-dd HH:MM:ss"))     
    },[feswaPairBidInfo])

  const nftTrackedList = useTrackedNFTTokenPairs()
  const nftBid: NftBidTrade = { pairCurrencies, parsedAmounts }
  const { onNftUserInput, onNftCurrencySelection, onChangeNftRecipient } = useNftActionHandlers()
  const handleTypeInput = useCallback(
    (value: string) => { onNftUserInput(value) },
    [onNftUserInput]
  )

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

  const ethBalance = useETHBalances( account ? [account] : [] )
  const {maxAmountInput, atMaxAmountInput} = useMemo(()=>{
      if( !account || !ethBalance ) return {undefined, boolean: false}
      const maxAmountInput = maxAmountSpend(ethBalance[account])
      const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[WALLET_BALANCE.ETH]?.equalTo(maxAmountInput))
      return { maxAmountInput, atMaxAmountInput}
    }, [account, ethBalance, parsedAmounts] )
  
  async function handleNftBidding(){
    const nftBidderAmount = parsedAmounts[WALLET_BALANCE.ETH]

    const pairTokens =  { [Field.TOKEN_A]: wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId),
                          [Field.TOKEN_B]: wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId) 
                        }
 
    if (!nftBidderAmount || !account || !library || !chainId || !nftBidContract || !pairTokens ) return
    if (!pairTokens[Field.TOKEN_A] || !pairTokens[Field.TOKEN_B] ) return

    const tokenAddressA = pairTokens[Field.TOKEN_A]?.address
    const tokenAddressB = pairTokens[Field.TOKEN_B]?.address
    const toAddess = recipientAddress === null ? account : recipientAddress
      
    setNftBidState({ attemptingTxn: true, nftBidToConfirm, showConfirm, nftBidErrorMessage: undefined, txHash: undefined })
    await nftBidContract.estimateGas['BidFeswaPair']( tokenAddressA, tokenAddressB, toAddess, 
                                      { value: BigNumber.from(nftBidderAmount.raw.toString()) })
      .then(async(estimatedGasLimit) => {
        await nftBidContract.BidFeswaPair(tokenAddressA, tokenAddressB, toAddess, 
                                          { value: BigNumber.from(nftBidderAmount.raw.toString()), gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `NFT bidding ${nftBidderAmount?.toSignificant(6)} ETH`,
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

  const isHighValueNftBidder: boolean = parsedAmounts[WALLET_BALANCE.ETH] ? (!parsedAmounts[WALLET_BALANCE.ETH]?.lessThan(FIVE_FRACTION)) : false

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

  const fixedList = useRef<FixedSizeList>()

  const adderNftList = useNFTPairAdder()
  const handleAddNftToTrackList = useCallback(() => {
        const tokenA = wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId)
        const tokenB = wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId)

        if (!tokenA || !tokenB) return       
        adderNftList( tokenA, tokenB,  false)
    }, [adderNftList, pairCurrencies, chainId])
  
  return (
    <>
      <AppBody>
        <PageHeader header="Nft Bid" />
        <Wrapper id="nft-bid-page">
          <ConfirmNftModal
            isOpen={showConfirm}
            nftBid={nftBid}
            originalNftBid={nftBidToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            onConfirm={handleNftBidding}
            swapErrorMessage={nftBidErrorMessage}
            onDismiss={handleConfirmDismiss}
            highSponsor = {isHighValueNftBidder}
          />
          <AutoColumn gap={'md'}>
            <TokenPairSelectPanel
              label='NFT Bid'
              currencyA={pairCurrencies[Field.TOKEN_A]}
              currencyB={pairCurrencies[Field.TOKEN_B]}              
              onMax={handleMaxInput}
              onCurrencySelectA={handleInputSelect}
              onCurrencySelectB={handleOutputSelect}
              id="NFT-bid-currency-input"
              customBalanceText = 'Balance: '
            />
            <CurrencyInputPanel
              label='Bid Price'
              value={typedValue}
              showMaxButton={!atMaxAmountInput}
              currency={ETHER}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              disableCurrencySelect = {true}
              id="NFT-bid-currency-input"
              customBalanceText = 'Balance: '
            />
            { (recipient === null && isExpertMode) && (
              <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                <div></div>
                <LinkStyledButton id="add-recipient-button" onClick={() => onChangeNftRecipient('')}>
                  + Add a send (optional)
                </LinkStyledButton>
              </AutoRow>
            )}

            {recipient !== null && (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <Text fontWeight={500} fontSize={16} color={theme.primary1}>
                    High-Value NFT Bid:
                  </Text>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeNftRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeNftRecipient} />
              </>
            )}

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
                        { nftPairToSave && (
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
                      You will be the first bidder. <br />
                      Minimum Bid price: <strong> 0.2 ETH.</strong>
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidPhase) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Current price: <strong> {nftBidPriceString} ETH. </strong>  <br />
                      Last Bid Time: <strong> {nftLastBidTime} </strong>  <br />
                      {nftBidEndingTime.startsWith('Ended')
                      ? <span>  Bid Completed at: <strong> {nftBidEndingTime.substr(5)} </strong> </span>
                      : <span>  Bid Ending Time: <strong> {nftBidEndingTime} </strong>  <br /> 
                                Minimum Bid price: <strong> {newNftBidPriceString} ETH.</strong> 
                        </span> }
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidDelaying) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Current price: <strong> {nftBidPriceString} ETH. </strong> <br />
                      Last Bid Time: <strong>{nftLastBidTime}</strong>  <br />
                      {nftBidEndingTime.startsWith('Extra')} 
                      ? `Bid Completed, <strong> {nftBidEndingTime} </strong>  <br />`
                      : `Bid Extra Ending Time: <strong> {nftBidEndingTime} </strong>  <br />`
                      Minimum Bid price: <strong> {newNftBidPriceString} ETH.</strong>
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.BidSettled) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Final bid price: <strong> {nftBidPriceString} ETH. </strong> <br />
                      Bid Time Window is <strong>CLosed</strong>
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolHolding) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Final bid price: <strong> {nftBidPriceString} ETH. </strong>
                    </TYPE.italic>
                  )}
                  { (nftStatus === NFT_BID_PHASE.PoolForSale) && (
                    <TYPE.italic textAlign="center" fontSize={14} style={{ width: '100%' }}>
                      Token-pair NFT Sale price: <strong> {nftBidPriceString} ETH. </strong>
                    </TYPE.italic>
                  )}
                </AutoColumn>
              </Container>
            )}

            {
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="10px">
                  {isHighValueNftBidder && (
                    <RowBetween align="center">
                      <Text fontWeight={500} fontSize={14} color={theme.red2}>
                        High-Value NFT Bid:
                      </Text>
                      { (buttonID === USER_BUTTON_ID.ERR_LOW_BALANCE)
                        ? (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            Insufficient ETH
                          </Text>)
                        : (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            {parsedAmounts[WALLET_BALANCE.ETH]?.toSignificant(6)} ETH
                          </Text>)
                      }
                    </RowBetween>
                  )}
                </AutoColumn>
              </Card>
            }
          </AutoColumn>

          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap="8px">
              <ButtonError
                onClick={() => {
                  if (isExpertMode) {
                    handleNftBidding()
                  } else {
                    setNftBidState({
                      nftBidToConfirm: nftBid,
                      attemptingTxn: false,
                      nftBidErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined
                    })
                  }
                }}
                id="NFT-bid-button"
                disabled={ buttonID < USER_BUTTON_ID.OK_INIT_BID}
                error={ isHighValueNftBidder && (buttonID >= USER_BUTTON_ID.OK_INIT_BID) && (buttonID >= USER_BUTTON_ID.OK_CHANGE_PRICE)}
              >
                <Text fontSize={20} fontWeight={500}>
                  { `${BidButtonPrompt[buttonID]} 
                     ${ (isHighValueNftBidder && (buttonID >= USER_BUTTON_ID.OK_INIT_BID) && (buttonID >= USER_BUTTON_ID.OK_CHANGE_PRICE)) 
                      ? ' Anyway' : ''}`}
                </Text>

              </ButtonError>
              </AutoColumn>              
            )}
            {nftBidErrorMessage && !showConfirm ? <SwapCallbackError error={nftBidErrorMessage} /> : null}
           </BottomGrouping>
        </Wrapper>
      </AppBody>
      <NftList nftList={nftTrackedList} onNftTokenSelect={handleNftSelect} fixedListRef={fixedList} />
    </>
  )
}

//id="NFT-bid-button"
//disabled={!!NftBidInputError}
//error={ !NftBidInputError && isHighValueNftBidder}
//>
//<Text fontSize={20} fontWeight={500}>
//  { NftBidInputError
//      ? NftBidInputError
//      : `Sponosor${isHighValueNftBidder ? ' Anyway' : ''}`}
//</Text>
