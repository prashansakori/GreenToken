import type { ProjectSubmission, VerificationAuditEntry } from '../types';

export interface VerificationDecisionInput {
  projectId: string;
  verifierWallet: string;
  verificationReference: string;
  evidenceHash: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}

export interface VerificationRegistryAdapter {
  recordDecision(input: VerificationDecisionInput): Promise<VerificationAuditEntry>;
}

export async function hashSubmissionEvidence(submission: ProjectSubmission): Promise<string> {
  return hashEvidenceDocuments(submission.documents);
}

export async function hashEvidenceDocuments(
  documents: Array<{ name: string; sha256?: string }>
): Promise<string> {
  if (documents.length === 0) {
    throw new Error('Every evidence document must be uploaded and hashed before verification.');
  }

  const normalizedEvidence = documents.map((document) => {
    if (!document.name.trim() || !document.sha256 || !/^[0-9a-f]{64}$/i.test(document.sha256)) {
      throw new Error('Every evidence document must be uploaded and hashed before verification.');
    }
    return { name: document.name.trim(), sha256: document.sha256.toLowerCase() };
  });
  const canonicalEvidence = JSON.stringify(normalizedEvidence
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalEvidence));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashEvidenceFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const localVerificationAdapter: VerificationRegistryAdapter = {
  async recordDecision(input) {
    if (!input.projectId || !input.verifierWallet || !input.verificationReference.trim()) {
      throw new Error('A project, verifier wallet, and verification reference are required.');
    }
    if (!/^[0-9a-f]{64}$/i.test(input.evidenceHash)) {
      throw new Error('Evidence hash must be a SHA-256 digest.');
    }

    return {
      id: `verification-${crypto.randomUUID()}`,
      projectId: input.projectId,
      action: input.decision,
      actorWallet: input.verifierWallet,
      verificationReference: input.verificationReference.trim(),
      timestamp: new Date().toISOString(),
      evidenceHash: input.evidenceHash,
      reason: input.reason
    };
  }
};
