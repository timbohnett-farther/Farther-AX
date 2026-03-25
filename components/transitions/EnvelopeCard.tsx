'use client';

import { useState } from 'react';
import { StatusPill } from './StatusPill';

const C = {
  dark: '#FAF7F2', slate: 'rgba(250,247,242,0.5)',
  teal: '#2bb8c4', border: 'rgba(250,247,242,0.08)',
  green: '#4ade80', amber: '#fbbf24',
};

interface DocuSignSigner {
  name: string;
  email: string;
  status: string;
  signedDateTime?: string;
  deliveredDateTime?: string;
  sentDateTime?: string;
}

interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  emailSubject: string;
  sentDateTime?: string;
  completedDateTime?: string;
  signers: DocuSignSigner[];
}

function fmtDate(d?: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EnvelopeCard({ envelope }: { envelope: DocuSignEnvelope }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 8, overflow: 'hidden' }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
        background: expanded ? 'rgba(43,184,196,0.04)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <StatusPill status={envelope.status} />
          <span style={{ fontSize: 13, color: C.dark, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {envelope.emailSubject || 'No subject'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: C.slate }}>Sent {fmtDate(envelope.sentDateTime)}</span>
          {envelope.completedDateTime && <span style={{ fontSize: 11, color: C.green }}>Done {fmtDate(envelope.completedDateTime)}</span>}
          <span style={{ fontSize: 14, color: C.slate, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', display: 'inline-block' }}>&#9662;</span>
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Signers</div>
          {envelope.signers.map((signer, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusPill status={signer.status} />
                <div>
                  <div style={{ fontSize: 13, color: C.dark, fontWeight: 500 }}>{signer.name}</div>
                  <div style={{ fontSize: 11, color: C.slate }}>{signer.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.slate, textAlign: 'right' }}>
                {signer.signedDateTime ? <span style={{ color: C.green }}>Signed {fmtDate(signer.signedDateTime)}</span>
                  : signer.deliveredDateTime ? <span style={{ color: C.amber }}>Delivered {fmtDate(signer.deliveredDateTime)}</span>
                  : signer.sentDateTime ? <span>Sent {fmtDate(signer.sentDateTime)}</span>
                  : '--'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
