import { useState } from "react";
import { isAddress } from "ethers";
import { getCertificateContract } from "../services/contract";


function MintCertificate() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [diplomaTitle, setDiplomaTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [grade, setGrade] = useState("");
  const [recipient, setRecipient] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleMint() {
    try {
      setMessage("");
      setMessageType("");

      // Validate required fields
      if (
        !studentName.trim() ||
        !studentId.trim() ||
        !diplomaTitle.trim() ||
        !issueDate ||
        !grade.trim() ||
        !recipient.trim()
      ) {
        setMessage("Please complete all required fields.");
        setMessageType("error");
        return;
      }

      // Validate grade
      if (!Number.isFinite(Number(grade))) {
        setMessage("Grade must be a valid number.");
        setMessageType("error");
        return;
      }

      // Validate Ethereum address
      if (!isAddress(recipient.trim())) {
        setMessage("Please enter a valid Ethereum address.");
        setMessageType("error");
        return;
      }

      setLoading(true);

      const contract = await getCertificateContract();

      const tx = await contract.mintCertificate(
        recipient.trim(),
        studentName.trim(),
        studentId.trim(),
        diplomaTitle.trim(),
        issueDate,
        grade.trim()
      );

      setMessage("Transaction sent. Waiting for confirmation...");
      setMessageType("info");

      const receipt = await tx.wait();

      setMessage(
        `Certificate issued successfully! Transaction: ${receipt.hash}`
      );
      setMessageType("success");

      // Reset form after successful mint
      setStudentName("");
      setStudentId("");
      setDiplomaTitle("");
      setIssueDate("");
      setGrade("");
      setRecipient("");

    } catch (error) {
      console.error("Mint error:", error);

      setMessage(
        error instanceof Error
          ? `Certificate issuance failed: ${error.message}`
          : "Certificate issuance failed."
      );
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mint-form">

      <div className="form-intro">
        <div>
          <h3>New Academic Certificate</h3>
          <p>Enter the student's academic information below.</p>
        </div>
        <span className="required-note">* Required fields</span>
      </div>

      <div className="form-grid">

        <div className="form-group">
          <label>Student Full Name *</label>
          <input
            type="text"
            placeholder="e.g. Sara Amrani"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Student ID *</label>
          <input
            type="text"
            placeholder="e.g. ST002"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Diploma Title *</label>
          <input
            type="text"
            placeholder="e.g. Master Data Engineering and AI"
            value={diplomaTitle}
            onChange={(e) => setDiplomaTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Issue Date *</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Grade *</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 16.20"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Recipient Wallet Address *</label>
          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <small>Ethereum address of the certificate recipient.</small>
        </div>

      </div>

      <div className="form-actions">
        <button
          className="primary-action"
          onClick={handleMint}
          disabled={loading}
        >
          {loading ? "Processing transaction..." : "Issue Certificate"}
        </button>
      </div>

      {message && (
        <div className={`transaction-message ${messageType}`}>
          {message}
        </div>
      )}

    </div>
  );
}

export default MintCertificate;
