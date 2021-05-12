import { ETHER } from '@uniswap/sdk'
import React, { useCallback, useContext, useState, useMemo } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight } from '../../components/Button'
import Card  from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmNftModal from '../../components/Nft/ConfirmNftModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import TokenPairSelectPanel from '../../components/TokenPairSelectPanel'
import { AutoRow, RowBetween } from '../../components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import PageHeader from '../../components/PageHeader'
//import { FESW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { Field, WALLET_BALANCE } from '../../state/nft/actions'
import {
  NftBidTrade,
  useDerivedNftInfo,
  useNftActionHandlers,
  useNftState
} from '../../state/nft/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { BigNumber } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useNftBidContract } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, FIVE_FRACTION } from '../../utils'

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
    pairTokens,
    parsedAmounts,
    inputError: NftBidInputError
  } = useDerivedNftInfo()

  const { address: recipientAddress } = useENSAddress(recipient)

  const nftBid: NftBidTrade = { pairTokens, parsedAmounts }
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

  const handleAcceptChanges = useCallback(() => {
    setNftBidState({ nftBidToConfirm: nftBid, nftBidErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, nftBidErrorMessage, nftBid, txHash])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onNftUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onNftUserInput])


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
              currencyA={pairTokens[Field.TOKEN_A]}
              currencyB={pairTokens[Field.TOKEN_B]}              
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
            <AutoColumn justify="space-between">
              <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                <ArrowWrapper clickable={false}>
                  <ArrowDown
                    size="16"
                    color={theme.primary1}
                  />
                </ArrowWrapper>
                {recipient === null && isExpertMode ? (
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeNftRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>

            {recipient !== null && (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.primary1} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeNftRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeNftRecipient} />
              </>
            )}
            {
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="10px">
                  {isHighValueNftBidder && (
                    <RowBetween align="center">
                      <Text fontWeight={500} fontSize={14} color={theme.red2}>
                        High-Value NFT Bid:
                      </Text>
                      { NftBidInputError === 'Insufficient ETH balance'
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
                disabled={!!NftBidInputError}
                error={ !NftBidInputError && isHighValueNftBidder}
              >
                <Text fontSize={20} fontWeight={500}>
                  { NftBidInputError
                      ? NftBidInputError
                      : `Sponosor${isHighValueNftBidder ? ' Anyway' : ''}`}
                </Text>
              </ButtonError>
              </AutoColumn>              
            )}
            {nftBidErrorMessage && !showConfirm ? <SwapCallbackError error={nftBidErrorMessage} /> : null}
           </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
