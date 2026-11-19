
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
  const [tokenURI, setTokenURI] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [mintResult, setMintResult] = useState<{
  tokenId: string;
  tokenURI: string;
  transactionHash: string;
} | null>(null);

  async function handleMint() {
    try {
      setMessage("");
      setMessageType("");

      if (
        !studentName.trim() ||
        !studentId.trim() ||
        !diplomaTitle.trim() ||
        !issueDate ||
        !grade.trim() ||
        !recipient.trim() ||
        !tokenURI.trim()
      ) {
        setMessage("Please complete all required fields.");
        setMessageType("error");
        return;
      }

      if (!Number.isFinite(Number(grade))) {
        setMessage("Grade must be a valid number.");
        setMessageType("error");
        return;
      }

      if (!isAddress(recipient.trim())) {
        setMessage("Please enter a valid Ethereum address.");
        setMessageType("error");
        return;
      }

      try {
        new URL(tokenURI.trim());
      } catch {
        setMessage("Please enter a valid metadata URI.");
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
        grade.trim(),
        tokenURI.trim()
      );

      setMessage("Transaction sent. Waiting for confirmation...");
      setMessageType("info");

      const receipt = await tx.wait();

      // Retrieve the CertificateMinted event
      const mintEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === "CertificateMinted");

      if (!mintEvent) {
        throw new Error("CertificateMinted event not found.");
      }

      const mintedTokenId = mintEvent.args.tokenId.toString();

      // Read the URI stored on the blockchain
      const confirmedURI = await contract.tokenURI(mintEvent.args.tokenId);

      setMintResult({
        tokenId: mintedTokenId,
        tokenURI: confirmedURI,
        transactionHash: receipt.hash,
      });

      setMessage(
        `Certificate issued successfully! Transaction: ${receipt.hash}`
      );
      setMessageType("success");

      setStudentName("");
      setStudentId("");
      setDiplomaTitle("");
      setIssueDate("");
      setGrade("");
      setRecipient("");
      setTokenURI("");

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

        <div className="form-group full-width">
          <label>Token Metadata URI *</label>
          <input
            type="text"
            placeholder="https://example.com/certificates/1.json"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
          />
          <small>
            URL pointing to the JSON metadata associated with this NFT.
          </small>
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

      
      {mintResult && (
        <div className="transaction-message success">
          <h4>Certificate Successfully Issued</h4>

          <p>
            <strong>Token ID:</strong> #{mintResult.tokenId}
          </p>

          <p>
            <strong>Token URI:</strong>
            <a
              href={mintResult.tokenURI}
              target="_blank"
              rel="noopener noreferrer"
            >
              {mintResult.tokenURI}
            </a>
          </p>

          <p>
            <strong>Transaction Hash:</strong>
            <a
              href={`https://sepolia.etherscan.io/tx/${mintResult.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {mintResult.transactionHash}
            </a>
          </p>
        </div>
      )}

    </div>
  );
}

export default MintCertificate;
