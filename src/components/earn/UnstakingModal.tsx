import React, { useState } from 'react'
import { Pair } from '@feswap/sdk'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonError } from '../Button'
import { StakingInfo } from '../../state/stake/hooks'
import { useStakingContract } from '../../hooks/useContract'
import { SubmittedView, LoadingView } from '../ModalViews'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import { useActiveWeb3React } from '../../hooks'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ZERO_FRACTION } from '../../utils'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useActiveWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  const currency0 = unwrappedToken(stakingInfo.tokens[0])
  const currency1 = unwrappedToken(stakingInfo.tokens[1])
  
  const isCorrectOrder = Boolean( Pair.getAddress(stakingInfo.tokens[0], stakingInfo.tokens[1]) ===
                                      stakingInfo.stakedAmount[0].token.address)
  
  const [pairCurrency0, pairCurrency1] = isCorrectOrder ? [currency0, currency1] : [currency1, currency0]

  async function onWithdraw() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await stakingContract
        .exit({ gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Withdraw deposited liquidity`
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? 'Enter an amount'
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body>Deposited liquidity:</TYPE.body>
              { stakingInfo?.stakedAmount[0].greaterThan(ZERO_FRACTION) && (
                <AutoColumn justify="center" gap="0px">
                  <TYPE.body fontWeight={600} fontSize={32}>
                    {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount[0]} />} FESP 
                  </TYPE.body>
                  <TYPE.body> of sub-pool <strong>{pairCurrency0?.symbol}
                              <span role="img" aria-label="wizard-icon">🔗</span>{pairCurrency1?.symbol}</strong>
                  </TYPE.body>    
                </AutoColumn>
              )}
              { stakingInfo?.stakedAmount[1].greaterThan(ZERO_FRACTION) && (
                <AutoColumn justify="center" gap="0px">
                  <TYPE.body fontWeight={600} fontSize={32}>
                    {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount[1]} />} FESP 
                  </TYPE.body>
                  <TYPE.body> of sub-pool <strong>{pairCurrency1?.symbol}
                              <span role="img" aria-label="wizard-icon">🔗</span>{pairCurrency0?.symbol}</strong>
                  </TYPE.body>
                </AutoColumn>
              )}
            </AutoColumn>
          )}
          {stakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body> and Unclaimed: </TYPE.body>
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo?.earnedAmount}/>} FESW
              </TYPE.body>
            </AutoColumn>
          )}
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            When you withdraw, your FESW is claimed and your liquidity is removed from the mining pool 
            and wholely returned to your original account.
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? 'Withdraw & Claim'}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Withdrawing:</TYPE.body>
            { stakingInfo?.stakedAmount[0].greaterThan(ZERO_FRACTION) && (
              <TYPE.body fontSize={20}> {stakingInfo?.stakedAmount?.[0].toSignificant(4)} FESP
                          ({pairCurrency0?.symbol}<span role="img" aria-label="wizard-icon">🔗</span>{pairCurrency1?.symbol})
              </TYPE.body>
            )}
            { stakingInfo?.stakedAmount[1].greaterThan(ZERO_FRACTION) && (
              <TYPE.body fontSize={20}> {stakingInfo?.stakedAmount?.[1].toSignificant(4)} FESP
                          ({pairCurrency1?.symbol}<span role="img" aria-label="wizard-icon">🔗</span>{pairCurrency0?.symbol})
              </TYPE.body>
            )}
            <TYPE.body fontSize={20}>Claiming: {stakingInfo?.earnedAmount?.toSignificant(4)} FESW </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Withdrew FESP!</TYPE.body>
            <TYPE.body fontSize={20}>Claimed FESW!</TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
