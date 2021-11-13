import React, { useContext } from 'react'
import { AutoColumn } from '../../components/Column'
import styled, { ThemeContext }  from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { RowBetween, RowFixed } from '../../components/Row'
import { Link } from 'react-router-dom'
import { ProposalStatus } from './styled'
import { ButtonPrimary } from '../../components/Button'
import { Button } from 'rebass/styled-components'
import { darken } from 'polished'
import { CardSection, StyledPositionCard  } from '../../components/earn/styled'
import { useAllProposalData, ProposalData, useUserVotes, useUserDelegatee } from '../../state/governance/hooks'
import DelegateModal from '../../components/vote/DelegateModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { FESW, ZERO_ADDRESS, NETWORK_NAME } from '../../constants'
import { JSBI, TokenAmount, ChainId } from '@feswap/sdk'
import { shortenAddress } from '../../utils'
import { getExplorerLink} from '../../utils/explorer'
import Loader from '../../components/Loader'
import FormattedCurrencyAmount from '../../components/FormattedCurrencyAmount'
import { useModalOpen, useToggleDelegateModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import { VoteCard } from '../Pool'

const PageWrapper = styled(AutoColumn)``

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const Proposal = styled(Button)`
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 1rem;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  align-items: center;
  text-align: left;
  outline: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
`

const ProposalNumber = styled.span`
  opacity: 0.6;
`

const ProposalTitle = styled.span`
  font-weight: 600;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
  
  `};
`

const TextButton = styled(TYPE.main)`
  color: ${({ theme }) => theme.primary1};
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const AddressButton = styled.div`
  border: 1px solid ${({ theme }) => theme.bg3};
  padding: 2px 4px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text1};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Vote() {
  const { account, chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const Network = chainId ? NETWORK_NAME[chainId] : ''
  const theme = useContext(ThemeContext)

  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggelDelegateModal = useToggleDelegateModal()

  // get data to list all proposals
  const allProposals: ProposalData[] = useAllProposalData()

  // user data
  const availableVotes: TokenAmount | undefined = useUserVotes()
  const feswBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, chainId ? FESW[chainId] : undefined)
  const userDelegatee: string | undefined = useUserDelegatee()

  // show delegation option if they have have a balance, but have not delegated
  const showUnlockVoting = Boolean(
    feswBalance && JSBI.notEqual(feswBalance.raw, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  return (
    <PageWrapper gap="lg" justify="center">
      <DelegateModal
        isOpen={showDelegateModal}
        onDismiss={toggelDelegateModal}
        title={showUnlockVoting ? 'Unlock Votes' : 'Update Delegation'}
      />
      <TopSection gap="md">
        <VoteCard>
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.black fontWeight={600}>FeSwap Governance</TYPE.black>
              </RowBetween>
              <RowBetween>
                <TYPE.black fontSize={14}>
                {GORV_TOKEN_NAME} tokens represent voting shares in FeSwap governance on <b>{Network}</b>. You can vote on each proposal yourself or
                  delegate your votes to a third party.
                </TYPE.black>
              </RowBetween>
              <ExternalLink
                style={{ color: 'black', textDecoration: 'underline' }}
                href="https://www.feswap.io/docs/feswap/governance"
                target="_blank"
              >
                <TYPE.black fontSize={14}>Read more about FeSwap governance ↗</TYPE.black>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
        </VoteCard>
      </TopSection>
      <TopSection style={{padding: "0px 10px 0px 10px"}}>
        <WrapSmall>
          <RowFixed>
            <TYPE.mediumHeader color="text2" style={{ margin: '0.5rem 0rem 0.5rem 0' }}>My Right:</TYPE.mediumHeader>
            { !showUnlockVoting && availableVotes && JSBI.notEqual(JSBI.BigInt(0), availableVotes?.raw) 
              ? (
                  <TYPE.mediumHeader ml="12px" color={theme.primary1}>
                    <FormattedCurrencyAmount currencyAmount={availableVotes} /> Votes
                  </TYPE.mediumHeader>  ) 
              : feswBalance &&
                userDelegatee &&
                userDelegatee !== ZERO_ADDRESS &&
                JSBI.notEqual(JSBI.BigInt(0), feswBalance?.raw) 
                ? (
                    <TYPE.mediumHeader ml="12px" color={theme.primary1}>
                      <FormattedCurrencyAmount currencyAmount={feswBalance} /> Votes
                    </TYPE.mediumHeader>  ) 
                : ('')
            }
          </RowFixed>
          <RowFixed>
            { showUnlockVoting 
              ? ( <ButtonPrimary
                    style={{ width: 'fit-content' }}
                    padding="8px"
                    borderRadius="8px"
                    onClick={toggelDelegateModal}
                  >
                    Unlock Voting
                  </ButtonPrimary>  ) 
              : ( (userDelegatee && userDelegatee !== ZERO_ADDRESS) 
                  ? ( <RowFixed>
                        <TYPE.body fontWeight={500} mr="4px" color="text2">
                          Delegated to:
                        </TYPE.body>
                        <AddressButton>
                          <StyledExternalLink
                            href={getExplorerLink(chainId??ChainId.MAINNET, userDelegatee, 'address')}
                            style={{ margin: '0 4px' }}
                          >
                            {userDelegatee === account ? 'Self' : shortenAddress(userDelegatee)}
                          </StyledExternalLink>
                          <TextButton onClick={toggelDelegateModal} style={{ marginLeft: '4px' }}>
                            (edit)
                          </TextButton>
                        </AddressButton>
                      </RowFixed> ) 
                  : ( (!account)
                      ? ( <TYPE.body fontWeight={500} mr="4px" fontSize={16} color={theme.text3} > Please Connect Your Wallet </TYPE.body> )
                      : (!feswBalance || JSBI.equal(JSBI.BigInt(0), feswBalance?.raw))
                        ? ( <TYPE.body fontWeight={500} mr="4px" fontSize={16} color={theme.text3} > No {GORV_TOKEN_NAME} Token </TYPE.body> )
                        : ( allProposals.length === 0)
                          ? ( <TYPE.body fontWeight={500} mr="4px" fontSize={16} color={theme.text3} > No Proposal </TYPE.body> )
                          : (!allProposals || !availableVotes) && <Loader /> )
                )
            }
          </RowFixed>
        </WrapSmall>
        </TopSection>

        <StyledPositionCard bgColor={'blue'} style={{padding: '10px 10px 16px 10px'}}>
          <WrapSmall style={{alignItems: 'center', paddingBottom: '10px'}}>
            <TYPE.mediumHeader>
              All Proposals
            </TYPE.mediumHeader>
            <ButtonPrimary as={Link} to="/create-proposal" style={{ width: 'fit-content', borderRadius: '8px' }} padding="8px" >
              Create Proposal
            </ButtonPrimary>
          </WrapSmall>

          {allProposals?.length === 0 && (
            <EmptyProposals>
              <TYPE.body style={{ marginBottom: '8px' }}>No proposals found.</TYPE.body>
              <TYPE.subHeader>
                <i>Proposals submitted by community members will appear here.</i>
              </TYPE.subHeader>
            </EmptyProposals>
          )}
          {allProposals?.map((p: ProposalData, i) => {
            return (
              <Proposal as={Link} to={'/vote/' + p.id} key={i}>
                <ProposalNumber>{p.id}</ProposalNumber>
                <ProposalTitle>{p.title}</ProposalTitle>
                <ProposalStatus status={p.status}>{p.status}</ProposalStatus>
              </Proposal>
            )
          })}
      </StyledPositionCard>
      <TopSection>
        <TYPE.subHeader color="text3" style={{ textAlign: 'center' }}>
          A minimum threshhold of 1% of the total {GORV_TOKEN_NAME} supply is required to submit proposals
        </TYPE.subHeader>
      </TopSection>
    </PageWrapper>
  )
}


//? ( <TYPE.body fontWeight={500} mr="4px" color="text2"> Please Connect Wallet </TYPE.body> )
//('Please Connect Wallet' )
