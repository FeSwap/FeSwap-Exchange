import { Currency, CurrencyAmount, ETHER } from '@uniswap/sdk'
import React, { useCallback, useContext, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight } from '../../components/Button'
import Card  from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmSponsorModal from '../../components/Sponsor/ConfirmSponsorModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import TradePrice from '../../components/swap/TradePrice'
import SponsorWarningModal from '../../components/Sponsor'
import PageHeader from '../../components/PageHeader'
import { FESW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
//import useENSAddress from '../../hooks/useENSAddress'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  SponsorTrade,
  useDerivedSponsorInfo,
  useSponsorActionHandlers,
  useSponsorState
} from '../../state/sponsor/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { BigNumber } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useSponsorContract } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, FIVE_FRACTION } from '../../utils'


export default function Sponsor() {

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const sponsorContract = useSponsorContract()
  const addTransaction = useTransactionAdder()

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]:  ETHER,
    [Field.OUTPUT]: chainId ? FESW[chainId] : undefined
  }

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
  const { independentField, typedValue, recipient } = useSponsorState() 

  const {
    currencyBalances,
    parsedAmounts,
    feswGiveRate,
    inputError: SponsorInputError
  } = useDerivedSponsorInfo()

  const sponsor: SponsorTrade = {parsedAmounts, feswGiveRate}
  
//  const { address: recipientAddress } = useENSAddress(recipient)

  const { onUserInput, onChangeRecipient } = useSponsorActionHandlers()
  const isValid = !SponsorInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, sponsorToConfirm, spnosorErrorMessage, attemptingTxn, txHash }, setSponsorState] = useState<{
    showConfirm: boolean
    sponsorToConfirm: SponsorTrade | undefined
    attemptingTxn: boolean
    spnosorErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    sponsorToConfirm: undefined,
    attemptingTxn: false,
    spnosorErrorMessage: undefined,
    txHash: undefined
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(12) ?? ''
  }

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  async function handleSponsor(){
    const sponsorAmount = parsedAmounts[Field.INPUT]
  
    if (!sponsorAmount || !account || !library || !chainId|| !sponsorContract ) return
  
    setSponsorState({ attemptingTxn: true, sponsorToConfirm, showConfirm, spnosorErrorMessage: undefined, txHash: undefined })
    await sponsorContract.estimateGas['Sponsor'](account, {value: BigNumber.from(sponsorAmount.raw.toString())})
      .then(async(estimatedGasLimit) => {
        await sponsorContract.Sponsor(account, { value: BigNumber.from(sponsorAmount.raw.toString()), gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Sponsored ${sponsorAmount?.toSignificant(6)} ETH`,
          })
          setSponsorState({ attemptingTxn: false, sponsorToConfirm, showConfirm, spnosorErrorMessage: undefined, txHash: response.hash })
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
        setSponsorState({attemptingTxn: false, sponsorToConfirm, showConfirm, spnosorErrorMessage: error.message, txHash: undefined })
      })
  }

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const isHighValueSponsor: boolean = parsedAmounts[Field.INPUT] ? !parsedAmounts[Field.INPUT]?.lessThan(FIVE_FRACTION) : false

  const handleConfirmDismiss = useCallback(() => {
    setSponsorState({ showConfirm: false, sponsorToConfirm, attemptingTxn, spnosorErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, spnosorErrorMessage, sponsorToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSponsorState({ sponsorToConfirm: sponsor, spnosorErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, spnosorErrorMessage, sponsor, txHash])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])


  return (
    <>
      <SponsorWarningModal
        isOpen={showSponsorWarning}
        onConfirm={handleWillSponsor}
      />
      <AppBody>
        <PageHeader header="Sponsor" />
        <Wrapper id="sponsor-page">
          <ConfirmSponsorModal
            isOpen={showConfirm}
            sponsor={sponsor}
            originalSponsor={sponsorToConfirm}
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
            <CurrencyInputPanel
              label={independentField === Field.OUTPUT && feswGiveRate ? 'Need to sponsor' : 'Will sponsor'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
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
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={independentField === Field.INPUT && feswGiveRate ? 'GET (estimated)' : 'Apply'}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              disableCurrencySelect = {true}
              otherCurrency={currencies[Field.INPUT]}
              id="sponsor-currency-output"
            />

            {recipient !== null && (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.primary1} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            )}
            {
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="10px">
                  {Boolean(feswGiveRate) && (
                    <RowBetween align="center">
                      <RowFixed fontWeight={500} fontSize={14} color={theme.text2}>
                        Giveaway Rate:
                      </RowFixed>
                      <TradePrice
                        price={feswGiveRate}
                        showInverted={showInverted}
                        setShowInverted={setShowInverted}
                      />
                    </RowBetween>
                  )}
                  {isHighValueSponsor && (
                    <RowBetween align="center">
                      <Text fontWeight={500} fontSize={14} color={theme.red2}>
                        High Sponsor
                      </Text>
                      { SponsorInputError === 'Insufficient ETH balance'
                        ? (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            Insufficient ETH
                          </Text>)
                        : (<Text fontWeight={500} fontSize={14} color={theme.red2}>
                            {parsedAmounts[Field.INPUT]?.toSignificant(6)} ETH
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
                      sponsorToConfirm: sponsor,
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
