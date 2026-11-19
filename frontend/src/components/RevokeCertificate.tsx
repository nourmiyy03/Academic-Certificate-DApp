
import { useState } from "react";
import { getCertificateContract } from "../services/contract";

function RevokeCertificate() {
  const [certId, setCertId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    try {
      setMessage("");
      setMessageType("");

      // Validate certificate ID
      const id = Number(certId);

      if (!certId.trim() || !Number.isInteger(id) || id <= 0) {
        setMessage("Please enter a valid Certificate ID.");
        setMessageType("error");
        return;
      }

      setLoading(true);

      // Connect to the smart contract
      const contract = await getCertificateContract();

      // Check if the certificate exists
      const certificate = await contract.getCertificate(id);

      // Check if already revoked
      if (certificate.revoked) {
        setMessage("This certificate has already been revoked.");
        setMessageType("error");
        return;
      }

      // Send revocation transaction
      setMessage("Sending revocation transaction...");
      setMessageType("info");

      const tx = await contract.revokeCertificate(id);

      setMessage("Transaction sent. Waiting for confirmation...");
      setMessageType("info");

      // Wait for blockchain confirmation
      const receipt = await tx.wait();

      setMessage(
        `Certificate #${id} revoked successfully! Transaction: ${receipt.hash}`
      );
      setMessageType("success");

    } catch (err) {
      console.error("Revocation error:", err);

      setMessage(
        err instanceof Error
          ? `Revocation failed: ${err.message}`
          : "Revocation failed."
      );
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="revoke-container">
      <div className="revoke-intro">
        <h3>Certificate Revocation</h3>
        <p>
          Enter the ID of the certificate you want to revoke.
          This action cannot be undone.
        </p>
      </div>

      <div className="revoke-form">
        <div className="revoke-input-group">
          <label htmlFor="revoke-cert-id">Certificate ID</label>
          <input
            id="revoke-cert-id"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 2"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="revoke-button"
          onClick={handleRevoke}
          disabled={loading || !certId.trim()}
        >
          {loading ? "Revoking..." : "Revoke Certificate"}
        </button>
      </div>

      {message && (
        <div className={`revoke-message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default RevokeCertificate;
