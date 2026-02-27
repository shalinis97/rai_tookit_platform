import React from 'react';
import Modal from './Modal';

function CertificateModal({ agent, onClose }) {
  const issued = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <Modal title="Agent Certificate" onClose={onClose}>
      <div className="cert-wrapper">
        <div className="certificate">
          {/* Corner dots */}
          <div className="cert-corner-dot tl" />
          <div className="cert-corner-dot tr" />
          <div className="cert-corner-dot bl" />
          <div className="cert-corner-dot br" />

          {/* Seal */}
          <div className="cert-seal">🏅</div>

          {/* Header text */}
          <div className="cert-eyebrow">RAI Platform</div>
          <div className="cert-headline">Certificate of Registration</div>

          {/* Ornate divider */}
          <div className="cert-divider">
            <div className="cert-divider-line" />
            <div className="cert-diamond" />
            <div className="cert-divider-line rev" />
          </div>

          <div className="cert-presents">This certifies that</div>

          <div className="cert-name">{agent.name}</div>

          <div className="cert-body">
            is an officially registered AI Agent on the RAI Platform
            and is duly authorized to operate within its designated
            use case under applicable governance policies.
          </div>

          {/* Footer */}
          <div className="cert-footer">
            <div className="cert-foot-item">
              <div className="cert-foot-label">Platform</div>
              <div className="cert-foot-value">RAI Platform</div>
            </div>
            <div className="cert-foot-item">
              <div className="cert-foot-label">Issued</div>
              <div className="cert-foot-value">{issued}</div>
            </div>
            <div className="cert-foot-item">
              <div className="cert-foot-label">Status</div>
              <div className="cert-foot-value">Active</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CertificateModal;
