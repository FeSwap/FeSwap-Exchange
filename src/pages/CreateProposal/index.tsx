import React, { useCallback, useMemo, useState } from 'react'
import JSBI from 'jsbi'
import styled from 'styled-components/macro'
import { utils } from 'ethers'
import { ExternalLink, TYPE } from 'theme'
import { Currency, CurrencyAmount, Token } from '@feswap/sdk'
import { FESW } from '../../constants'
import { AppBodyFat } from '../AppBody'
import { CreateProposalTabs } from '../../components/NavigationTabs'
import { ButtonError } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { BlueCard } from 'components/Card'
import { Wrapper } from 'pages/Pool/styleds'
import { ProposalAction, ProposalActionSelector, ProposalActionSelectorModal } from './ProposalActionSelector'
import { ProposalEditor } from './ProposalEditor'
import { ProposalActionDetail } from './ProposalActionDetail'
import { ProposalSubmissionModal } from './ProposalSubmissionModal'
import { useActiveWeb3React } from '../../hooks'
import {
  CreateProposalData,
  useCreateProposalCallback,
  useLatestProposalId,
  useProposalData,
  useProposalThreshold,
  useUserVotes,
} from 'state/governance/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { getAddress } from '@ethersproject/address'
import {StyledPageCard, CardNoise} from '../../components/earn/styled'

const CreateProposalButton = ({
  proposalThreshold,
  hasActiveOrPendingProposal,
  hasEnoughVote,
  isFormInvalid,
  handleCreateProposal,
}: {
  proposalThreshold?: CurrencyAmount
  hasActiveOrPendingProposal: boolean
  hasEnoughVote: boolean
  isFormInvalid: boolean
  handleCreateProposal: () => void
}) => {
  const formattedProposalThreshold = proposalThreshold
    ? JSBI.divide(
        proposalThreshold.quotient,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(proposalThreshold.currency.decimals))
      ).toLocaleString()
    : undefined

  return (
    <ButtonError
      style={{ marginTop: '18px' }}
      error={hasActiveOrPendingProposal || !hasEnoughVote}
      disabled={isFormInvalid || hasActiveOrPendingProposal || !hasEnoughVote}
      onClick={handleCreateProposal}
    >
      {hasActiveOrPendingProposal ? (
        `You already have an active or pending proposal`
      ) : !hasEnoughVote ? (
        <>
          {formattedProposalThreshold ? (
            `You must have ${formattedProposalThreshold} votes to submit a proposal`
          ) : (
           `You don't have enough votes to submit a proposal`
          )}
        </>
      ) : (
        `Create Proposal`
      )}
    </ButtonError>
  )
}

const CreateProposalWrapper = styled(Wrapper)`
  display: flex;
  flex-flow: column wrap;
`

export default function CreateProposal() {
  const { account, chainId } = useActiveWeb3React()

  const latestProposalId = useLatestProposalId(account ?? undefined) ?? '0'
  const latestProposalData = useProposalData(latestProposalId)
  const availableVotes = useUserVotes()
  const proposalThreshold: CurrencyAmount | undefined = useProposalThreshold()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)
  const [toAddressValue, setToAddressValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState<Currency>(FESW[chainId ?? 1])
  const [amountValue, setAmountValue] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [bodyValue, setBodyValue] = useState('')

  const handleActionSelectorClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  const handleActionChange = useCallback(
    (proposalAction: ProposalAction) => {
      setProposalAction(proposalAction)
    },
    [setProposalAction]
  )

  const handleDismissActionSelector = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleDismissSubmissionModal = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
  }, [setHash, setAttempting])

  const handleToAddressInput = useCallback(
    (toAddress: string) => {
      setToAddressValue(toAddress)
    },
    [setToAddressValue]
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      setCurrencyValue(currency)
    },
    [setCurrencyValue]
  )

  const handleAmountInput = useCallback(
    (amount: string) => {
      setAmountValue(amount)
    },
    [setAmountValue]
  )

  const handleTitleInput = useCallback(
    (title: string) => {
      setTitleValue(title)
    },
    [setTitleValue]
  )

  const handleBodyInput = useCallback(
    (body: string) => {
      setBodyValue(body)
    },
    [setBodyValue]
  )

  const isFormInvalid = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !utils.isAddress(toAddressValue) ||
          !(currencyValue instanceof Token) ||
          amountValue === '' ||
          titleValue === '' ||
          bodyValue === ''
      ),
    [proposalAction, toAddressValue, currencyValue, amountValue, titleValue, bodyValue]
  )

  const hasEnoughVote = Boolean(
    availableVotes && proposalThreshold && JSBI.greaterThanOrEqual(availableVotes.quotient, proposalThreshold.quotient)
  )

  const createProposalCallback = useCreateProposalCallback()

  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData

    if (!createProposalCallback || !proposalAction || !(currencyValue instanceof Token)) return

    const tokenAmount = tryParseAmount(amountValue, currencyValue)
    if (!tokenAmount) return

    createProposalData.targets = [currencyValue.address]
    createProposalData.values = ['0']
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let types: string[][]
    let values: string[][]
    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        createProposalData.signatures = [`transfer(${types[0].join(',')})`]
        break
      }

      case ProposalAction.APPROVE_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }
    }

    createProposalData.calldatas = []
    for (let i = 0; i < createProposalData.signatures.length; i++) {
      createProposalData.calldatas[i] = utils.defaultAbiCoder.encode(types[i], values[i])
    }

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch(() => {
      setAttempting(false)
    })

    if (hash) setHash(hash)
  }

  return (
    <AppBodyFat >
      <StyledPageCard bgColor={'red'}>
      <CardNoise />
      <CreateProposalTabs />
      <CreateProposalWrapper>
        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.link fontWeight={400} color={'primaryText1'}>
              <strong>Tip:</strong> Select an action and describe your proposal for the community. 
              The proposal cannot be modified after submission, so please verify all information before submitting. 
              The voting period will begin immediately and last for 7 days. To propose a custom action,{' '}
              <ExternalLink href="https://feswap.io/docs/v2/governance/governance-reference/#propose">
                read the docs ↗
              </ExternalLink>
            </TYPE.link>
          </AutoColumn>
        </BlueCard>

        <ProposalActionSelector onClick={handleActionSelectorClick} proposalAction={proposalAction} />
        <ProposalActionDetail
          proposalAction={proposalAction}
          currency={currencyValue}
          amount={amountValue}
          toAddress={toAddressValue}
          onCurrencySelect={handleCurrencySelect}
          onAmountInput={handleAmountInput}
          onToAddressInput={handleToAddressInput}
        />
        <ProposalEditor
          title={titleValue}
          body={bodyValue}
          onTitleInput={handleTitleInput}
          onBodyInput={handleBodyInput}
        />
        <CreateProposalButton
          proposalThreshold={proposalThreshold}
          hasActiveOrPendingProposal={
            latestProposalData?.status ==='active' || latestProposalData?.status === 'pending'
          }
          hasEnoughVote={hasEnoughVote}
          isFormInvalid={isFormInvalid}
          handleCreateProposal={handleCreateProposal}
        />
      </CreateProposalWrapper>
      <ProposalActionSelectorModal
        isOpen={modalOpen}
        onDismiss={handleDismissActionSelector}
        onProposalActionSelect={(proposalAction: ProposalAction) => handleActionChange(proposalAction)}
      />
      <ProposalSubmissionModal isOpen={attempting} hash={hash} onDismiss={handleDismissSubmissionModal} />
      </StyledPageCard>
    </AppBodyFat>
  )
}

//{!hasEnoughVote ? (
//  <AutonomousProposalCTA>
//    {`Don't have 2.5M votes? Anyone can create an autonomous proposal using `}
//    <ExternalLink href="https://fish.vote">fish.vote</ExternalLink>
//  </AutonomousProposalCTA>
//) : null}
