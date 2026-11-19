# Smart Contract Security Audit Report
## Academic Certificate DApp — ERC-721

**Audit Date:** November 19, 2026  
**Contract:** `CertificateRegistry.sol`  
**Solidity Version:** 0.8.34  
**OpenZeppelin Version:** 5.6.1  
**Analysis Tool:** Slither 0.11.6

---

## 1. Audit Scope

The audit focused on the `CertificateRegistry` smart contract, which implements an academic certificate registry using the ERC-721 standard.

The following components were examined:

- ERC-721 implementation using OpenZeppelin's `ERC721URIStorage`.
- Role-based access control using `AccessControl`.
- Individual certificate issuance through `mintCertificate()`.
- Batch certificate issuance through `batchMintCertificates()`.
- Certificate revocation through `revokeCertificate()`.
- Certificate information retrieval through `getCertificate()`.
- Metadata management through `tokenURI()`.

The audit also reviewed the frontend integration and the automated test suite.

## 2. Security Checklist

| Security Requirement | Result | Observation |
|---|---|---|
| Access control | OK | MINTER_ROLE and DEFAULT_ADMIN_ROLE restrict sensitive operations. |
| Reentrancy protection | OK* | ReentrancyGuard and nonReentrant modifiers are implemented on mint functions. |
| Input validation | OK | Zero addresses, empty fields and invalid batch lengths are rejected. |
| Duplicate certificate prevention | OK | Duplicate student IDs are rejected. |
| Event emission | OK | CertificateMinted and CertificateRevoked events are implemented. |
| Certificate revocation | OK | Revocation uses a boolean flag and emits an event. |
| Integer overflow | OK* | Solidity 0.8.x provides checked arithmetic by default. |
| Batch processing | OK | Batch mint validates array lengths and rejects empty batches. |

*These checks do not constitute proof against every possible attack. In particular, no dedicated malicious-receiver reentrancy simulation or overflow-specific test was performed.*

## 3. Vulnerability Analysis

Static analysis was performed using Slither with dependency findings excluded.

The analysis reported three findings:

**1. Reentrancy (reentrancy-benign)**

Slither identified an external call through `_safeMint()` followed by a state update through `_setTokenURI()`.

The contract implements `ReentrancyGuard`, and both external mint functions use the `nonReentrant` modifier. Certificate information and student ID state are also updated before `_safeMint()`.

The finding was reviewed and documented. No malicious receiver contract was used to simulate a reentrancy attack. Therefore, additional adversarial testing is recommended.

**2. Solidity pragma differences (pragma)**

Slither reported different Solidity version constraints across the contract and imported OpenZeppelin interfaces and libraries.

This is an informational finding related to compiler version declarations, not an identified exploitable vulnerability in the application logic.

**3. Gas optimization (costly-loop)**

Slither identified the increment of `nextCertificateId` inside the batch mint loop.

This operation is required to assign a unique identifier to each certificate. It may contribute to gas consumption during large batch operations, but it does not represent a security vulnerability.

No critical or high-severity vulnerability was established by these findings.

## 4. Automated Testing Results

The project uses Hardhat for automated testing.

**Test execution:** `npx hardhat test`

**Result: 17 passing tests**

The tests cover:

- Deployment and role assignment.
- ERC-721 interface support.
- Successful certificate minting and metadata retrieval.
- Duplicate student ID rejection.
- Invalid recipient and empty URI rejection.
- CertificateMinted event emission.
- Unauthorized mint and revoke attempts.
- Role administration restrictions.
- Successful batch minting.
- Empty batch and mismatched array rejection.
- Duplicate IDs within a batch.
- Certificate revocation and event emission.
- Prevention of repeated revocation.
- Prevention of student ID reuse after revocation.

All 17 tests passed successfully.

## 5. Recommendations and Limitations

The following improvements are recommended:

1. Perform dedicated reentrancy testing using a malicious ERC-721 receiver contract.
2. Consider gas optimization for large batch mint operations.
3. Test additional edge cases, including maximum batch sizes and unusually long metadata fields.
4. Store certificate metadata on decentralized storage such as IPFS rather than relying on demonstration URLs.
5. Perform additional testing before deploying the contract in a production environment.

## 6. Conclusion

The Academic Certificate DApp successfully implements the ERC-721 standard with OpenZeppelin and role-based access control.

The contract includes input validation, duplicate certificate prevention, batch issuance, certificate revocation, event emission and reentrancy protection.

All 17 automated tests passed, and Slither identified three findings that were reviewed and documented. No critical or high-severity vulnerability was established during this assessment.

This report represents a simplified educational security assessment and does not replace a professional smart contract audit.
