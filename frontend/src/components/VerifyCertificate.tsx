import { useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import CertificateRegistry from "../contracts/CertificateRegistry.json";


const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const RPC_URL = "http://127.0.0.1:8545";

interface CertificateData {
  studentName: string;
  studentId: string;
  diplomaTitle: string;
  issueDate: string;
  grade: string;
  recipient: string;
  revoked: boolean;
}

function VerifyCertificate() {
  const [certId, setCertId] = useState("");
  const [certificate, setCertificate] =
    useState<CertificateData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyCertificate() {
    try {
      setError("");
      setCertificate(null);

      const id = Number(certId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("Please enter a valid certificate ID.");
        return;
      }

      setLoading(true);

      // Connect directly to Hardhat without MetaMask
      const provider = new JsonRpcProvider(RPC_URL);

      // Read-only contract connection
      const contract = new Contract(
        CONTRACT_ADDRESS,
        CertificateRegistry.abi,
        provider
      );

      const result = await contract.getCertificate(id);

      setCertificate({
        studentName: result.studentName,
        studentId: result.studentId,
        diplomaTitle: result.diplomaTitle,
        issueDate: result.issueDate,
        grade: result.grade,
        recipient: result.recipient,
        revoked: result.revoked,
      });
    } catch (err) {
      console.error("Certificate verification error:", err);
      setError(
        "Certificate not found or blockchain connection unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-intro">
        <h3>Certificate Lookup</h3>
        <p>
          Enter a certificate ID to check its authenticity and details.
        </p>
      </div>

      <div className="verify-search">
        <div className="verify-input-group">
          <label htmlFor="certificate-id">Certificate ID</label>
          <input
            id="certificate-id"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 1"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="verify-button"
          onClick={verifyCertificate}
          disabled={!certId || loading}
        >
          {loading ? "Verifying..." : "Verify Certificate"}
        </button>
      </div>

      {error && (
        <div className="verify-error">
          {error}
        </div>
      )}

      {certificate && (
        <div className="certificate-result">
          <div className="certificate-result-header">
            <div>
              <h3>Certificate Details</h3>
              <p>Certificate #{certId}</p>
            </div>

            <span
              className={
                certificate.revoked
                  ? "certificate-status revoked"
                  : "certificate-status valid"
              }
            >
              {certificate.revoked ? "Revoked" : "Valid"}
            </span>
          </div>

          <div className="certificate-details">
            <div className="certificate-detail">
              <span>Student Name</span>
              <strong>{certificate.studentName}</strong>
            </div>

            <div className="certificate-detail">
              <span>Student ID</span>
              <strong>{certificate.studentId}</strong>
            </div>

            <div className="certificate-detail">
              <span>Diploma Title</span>
              <strong>{certificate.diplomaTitle}</strong>
            </div>

            <div className="certificate-detail">
              <span>Issue Date</span>
              <strong>{certificate.issueDate}</strong>
            </div>

            <div className="certificate-detail">
              <span>Grade</span>
              <strong>{certificate.grade}</strong>
            </div>

            <div className="certificate-detail full-width">
              <span>Recipient Wallet</span>
              <strong className="certificate-address">
                {certificate.recipient}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyCertificate;
