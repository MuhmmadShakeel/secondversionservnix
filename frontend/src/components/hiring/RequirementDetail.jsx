import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Icon } from '../common/Icon.jsx'
import { SurfaceModal } from '../common/UiParts.jsx'
import { getAccessToken } from '../../redux/Api/auth/AuthApi.js'
import { useAcceptProposalMutation, useGetProposalsQuery, useGetRequirementQuery } from '../../redux/Api/hiring/HiringApi.js'
import { formatBudget } from './formatBudget.js'

function MediaList({ media }) {
  const [preview, setPreview] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])

  async function openMedia(file) {
    setLoadingId(file.id)
    try {
      const response = await fetch(`/v1/hiring/media/${file.id}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      if (!response.ok) throw new Error('Could not open this attachment.')
      setPreview({ url: URL.createObjectURL(await response.blob()), kind: file.kind, fileName: file.fileName })
    } catch (error) { toast.error(error.message) }
    finally { setLoadingId(null) }
  }

  if (!media?.length) return null
  return <div className="hiring-detail-section"><h3>Attachments</h3><div className="hiring-media-list">{media.map((file) => <button key={file.id} type="button" onClick={() => openMedia(file)} disabled={loadingId === file.id}><Icon name={file.kind === 'photo' ? 'image' : file.kind === 'video' ? 'video' : 'mic'} size={18}/><span>{file.fileName}</span><small>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></button>)}</div>{preview && <div className="hiring-preview"><div><strong>{preview.fileName}</strong><button type="button" onClick={() => setPreview(null)} aria-label="Close preview"><Icon name="close" size={17}/></button></div>{preview.kind === 'photo' ? <img src={preview.url} alt={preview.fileName}/> : preview.kind === 'video' ? <video src={preview.url} controls/> : <audio src={preview.url} controls/>}</div>}</div>
}

function ProposalComparison({ requirementId, isOpen }) {
  const { data, isLoading, isError } = useGetProposalsQuery(requirementId)
  const [accept, { isLoading: accepting }] = useAcceptProposalMutation()
  const [confirmId, setConfirmId] = useState(null)
  const [sort, setSort] = useState('recent')
  const proposals = [...(data?.proposals || [])].sort((a, b) => sort === 'lowest' ? Number(a.bidAmount) - Number(b.bidAmount) : new Date(b.createdAt) - new Date(a.createdAt))

  async function confirmAccept(proposalId) {
    try { await accept({ requirementId, proposalId }).unwrap(); toast.success('Proposal accepted. Other offers were declined.'); setConfirmId(null) }
    catch { toast.error('Could not accept this proposal.') }
  }

  return <div className="hiring-detail-section"><div className="hiring-section-heading"><h3>Proposals ({proposals.length})</h3><select aria-label="Sort proposals" value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Most recent</option><option value="lowest">Lowest bid</option></select></div>{isLoading ? <p>Loading proposals…</p> : isError ? <p>Could not load proposals.</p> : !proposals.length ? <p>No proposals yet. Workers can apply while this requirement is open.</p> : <div className="hiring-proposal-list">{proposals.map((proposal) => <article key={proposal.id} className="hiring-proposal"><div><strong>{proposal.workerName}</strong><span className={`hiring-status ${proposal.status}`}>{proposal.status}</span></div><p>{proposal.coverLetter}</p><div className="hiring-proposal-facts"><span>Rs. {Number(proposal.bidAmount).toLocaleString('en-PK')}</span><span>{proposal.deliveryDays} days delivery</span></div>{isOpen && proposal.status === 'pending' && (confirmId === proposal.id ? <div className="hiring-accept-confirm"><span>Accept this offer and decline the others?</span><button type="button" disabled={accepting} onClick={() => confirmAccept(proposal.id)}>Confirm accept</button><button type="button" onClick={() => setConfirmId(null)}>Cancel</button></div> : <button className="hiring-accept" type="button" onClick={() => setConfirmId(proposal.id)}>Accept proposal</button>)}</article>)}</div>}</div>
}

export function RequirementDetail({ id, currentUserId, myProposal, onClose, onPropose, onEdit }) {
  const { data, isLoading, isError } = useGetRequirementQuery(id)
  const item = data?.requirement
  const isOwner = item?.ownerUserId === currentUserId
  return <SurfaceModal title="Requirement details" onClose={onClose}>
    {isLoading ? <p className="hiring-detail-loading">Loading requirement…</p> : isError || !item ? <p className="hiring-detail-loading">This requirement is unavailable.</p> : <div className="hiring-detail">
      <div className="hiring-card-top"><span className="hiring-category">{item.category}</span><span className={`hiring-status ${item.status}`}>{item.status}</span></div>
      <h2>{item.title}</h2><p className="hiring-detail-client">Posted by {item.ownerName}</p>
      <div className="hiring-detail-budget"><strong>{formatBudget(item)}</strong><span>{item.proposalCount} proposals</span></div>
      <div className="hiring-detail-section"><h3>Project brief</h3><p className="hiring-description">{item.description}</p></div>
      <MediaList media={item.media}/>
      {isOwner ? <><ProposalComparison requirementId={item.id} isOpen={item.status === 'open'}/>{item.status !== 'awarded' && <button className="secondary-button" type="button" onClick={() => onEdit(item)}>Edit requirement</button>}</> : myProposal ? <div className="hiring-proposal-notice"><strong>Your proposal: {myProposal.status}</strong><p>Rs. {Number(myProposal.bidAmount).toLocaleString('en-PK')} · {myProposal.deliveryDays} days</p></div> : item.status === 'open' ? <button className="primary-button" type="button" onClick={() => onPropose(item)}>Send a proposal <Icon name="arrow" size={16}/></button> : null}
    </div>}
  </SurfaceModal>
}
