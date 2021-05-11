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
import NftWarningModal from '../../components/Nft'
import PageHeader from '../../components/PageHeader'
//import { FESW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
//import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { Field } from '../../state/nft/actions'
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
import { useSponsorContract } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, FIVE_FRACTION } from '../../utils'

export default function Nft() {

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const sponsorContract = useSponsorContract()
  const addTransaction = useTransactionAdder()

  const [showSponsorWarning, clearShowSponsorWarning] = useState<boolean>(true)
  
  const [willSponsor, setWillSponsor] = useState<boolean>(false)
  const handleWillSponsor = useCallback((yesOrNo: boolean) => {
    setWillSponsor(yesOrNo)
    clearShowSponsorWarning(false)
  }, [setWillSponsor, clearShowSponsorWarning])

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [isExpertMode] = useExpertModeManager()

  // sponsor state
  const {
    typedValue,
    recipient,
  } = useNftState()

  const {
    pairTokens,
    parsedAmounts,
    inputError: SponsorInputError
  } = useDerivedNftInfo()

  const nftBid: NftBidTrade = { pairTokens, parsedAmounts }
 
//  const { address: recipientAddress } = useENSAddress(recipient)

  const { onNftUserInput, onNftCurrencySelection, onChangeNftRecipient } = useNftActionHandlers()
  const isValid = !SponsorInputError

  const handleTypeInput = useCallback(
    (value: string) => {
      onNftUserInput(value)
    },
    [onNftUserInput]
  )

  // modal and loading
  const [{ showConfirm, nftBidToConfirm, spnosorErrorMessage, attemptingTxn, txHash }, setSponsorState] = useState<{
    showConfirm: boolean
    nftBidToConfirm: NftBidTrade | undefined
    attemptingTxn: boolean
    spnosorErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    nftBidToConfirm: undefined,
    attemptingTxn: false,
    spnosorErrorMessage: undefined,
    txHash: undefined
  })

  const ethBalance = useETHBalances( account ? [account] : [] )
  const {maxAmountInput, atMaxAmountInput} = useMemo(()=>{
      if( !account || !ethBalance ) return {undefined, boolean: false}
      const maxAmountInput = maxAmountSpend(ethBalance[account])
      const atMaxAmountInput = Boolean(maxAmountInput && ethBalance[account]?.equalTo(maxAmountInput))
      return { maxAmountInput, atMaxAmountInput}
    }, [account, ethBalance] )
  
  async function handleSponsor(){
    const sponsorAmount = parsedAmounts[0]
  
    if (!sponsorAmount || !account || !library || !chainId|| !sponsorContract ) return
  
    setSponsorState({ attemptingTxn: true, nftBidToConfirm, showConfirm, spnosorErrorMessage: undefined, txHash: undefined })
    await sponsorContract.estimateGas['Sponsor'](account, {value: BigNumber.from(sponsorAmount.raw.toString())})
      .then(async(estimatedGasLimit) => {
        await sponsorContract.Sponsor(account, { value: BigNumber.from(sponsorAmount.raw.toString()), gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Sponsored ${sponsorAmount?.toSignificant(6)} ETH`,
          })
          setSponsorState({ attemptingTxn: false, nftBidToConfirm, showConfirm, spnosorErrorMessage: undefined, txHash: response.hash })
        })
        .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
                throw new Error(`Sponsor failed: You denied transaction signature.`)
            } else {
              // otherwise, the error was unexpected and we need to convey that
              throw new Error(`Sponsor failed: ${error.message}`)
            }
        })
      })
      .catch((error: any) => {
        setSponsorState({attemptingTxn: false, nftBidToConfirm, showConfirm, spnosorErrorMessage: error.message, txHash: undefined })
      })
  }

  const isHighValueSponsor: boolean = parsedAmounts[0] ? !parsedAmounts[0]?.lessThan(FIVE_FRACTION) : false

  const handleConfirmDismiss = useCallback(() => {
    setSponsorState({ showConfirm: false, nftBidToConfirm, attemptingTxn, spnosorErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onNftUserInput('')
    }
  }, [attemptingTxn, onNftUserInput, spnosorErrorMessage, nftBidToConfirm, txHash])

  const handleInputSelect = useCallback(
    inputCurrency => { onNftCurrencySelection(Field.TOKEN_A, inputCurrency)},
    [onNftCurrencySelection]
  )

  const handleOutputSelect = useCallback(
    outputCurrency => onNftCurrencySelection(Field.TOKEN_B, outputCurrency), 
    [onNftCurrencySelection] 
  )

  const handleAcceptChanges = useCallback(() => {
    setSponsorState({ nftBidToConfirm: nftBid, spnosorErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, spnosorErrorMessage, nftBid, txHash])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onNftUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onNftUserInput])


  return (
    <>
      <NftWarningModal
        isOpen={showSponsorWarning}
        onConfirm={handleWillSponsor}
      />
      <AppBody>
        <PageHeader header="Nft Bid" />
        <Wrapper id="sponsor-page">
          <ConfirmNftModal
            isOpen={showConfirm}
            nftBid={nftBid}
            originalNftBid={nftBidToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            onConfirm={handleSponsor}
            swapErrorMessage={spnosorErrorMessage}
            onDismiss={handleConfirmDismiss}
            highSponsor = {isHighValueSponsor}
          />
          <AutoColumn gap={'md'}>
            <TokenPairSelectPanel
              label='NFT Bid'
              currencyA={pairTokens[Field.TOKEN_A]}
              currencyB={pairTokens[Field.TOKEN_B]}              
              onMax={handleMaxInput}
              onCurrencySelectA={handleInputSelect}
              onCurrencySelectB={handleOutputSelect}
              id="sponsor-currency-input"
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
              id="sponsor-currency-input"
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
                  {isHighValueSponsor && (
                    <RowBetween align="center">
                      <Text fontWeight={500} fontSize={14} color={theme.red2}>
                        High-Value Sponsor:
                      </Text>
                      { SponsorInputError === 'Insufficient ETH balance'
                        ? (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            Insufficient ETH
                          </Text>)
                        : (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            {parsedAmounts[0]?.toSignificant(6)} ETH
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
                    handleSponsor()
                  } else {
                    setSponsorState({
                      nftBidToConfirm: nftBid,
                      attemptingTxn: false,
                      spnosorErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined
                    })
                  }
                }}
                id="sponsor-button"
                disabled={!isValid || !willSponsor}
                error={ isValid && isHighValueSponsor}
              >
                <Text fontSize={20} fontWeight={500}>
                  { !willSponsor
                    ? 'NOT Sponsor'
                    : SponsorInputError
                      ? SponsorInputError
                      : `Sponosor${isHighValueSponsor ? ' Anyway' : ''}`}
                </Text>
              </ButtonError>
              </AutoColumn>              
            )}
            {spnosorErrorMessage && !showConfirm ? <SwapCallbackError error={spnosorErrorMessage} /> : null}
           </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
