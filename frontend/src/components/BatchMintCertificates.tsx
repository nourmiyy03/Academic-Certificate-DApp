
import { useState } from "react";
import * as XLSX from "xlsx";
import { isAddress } from "ethers";
import { getCertificateContract } from "../services/contract";

interface CertificateRow {
  studentName: string;
  studentId: string;
  diplomaTitle: string;
  issueDate: string;
  grade: string;
  recipient: string;
}

interface ValidatedCertificate extends CertificateRow {
  rowNumber: number;
  errors: string[];
}

function formatExcelDate(value: unknown): string {
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return "";

    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }

  return String(value ?? "").trim();
}

function validateDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function BatchMintCertificates() {
  const [certificates, setCertificates] =
    useState<ValidatedCertificate[]>([]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState("");
  const [mintMessageType, setMintMessageType] = useState("");
  const [fileName, setFileName] = useState("");
  const [batchSize, setBatchSize] = useState(10);

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setCertificates([]);
    setSelectedRows([]);
    setMintMessage("");
    setMintMessageType("");

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json<CertificateRow>(
          worksheet,
          { defval: "" }
        );

        if (rows.length === 0) {
          setError("The selected file is empty.");
          return;
        }

        // Detect duplicate Student IDs inside the uploaded file
        const idCounts = new Map<string, number>();

        rows.forEach((row) => {
          const id = String(row.studentId ?? "").trim().toLowerCase();

          if (id) {
            idCounts.set(id, (idCounts.get(id) || 0) + 1);
          }
        });

        // Validate every row
        const validatedRows: ValidatedCertificate[] = rows.map(
          (row, index) => {
            const certificate = {
              studentName: String(row.studentName ?? "").trim(),
              studentId: String(row.studentId ?? "").trim(),
              diplomaTitle: String(row.diplomaTitle ?? "").trim(),
              issueDate: formatExcelDate(row.issueDate),
              grade: String(row.grade ?? "").trim(),
              recipient: String(row.recipient ?? "").trim(),
            };

            const errors: string[] = [];

            if (!certificate.studentName)
              errors.push("Missing student name");

            if (!certificate.studentId)
              errors.push("Missing student ID");

            if (!certificate.diplomaTitle)
              errors.push("Missing diploma title");

            if (!validateDate(certificate.issueDate))
              errors.push("Invalid date (expected YYYY-MM-DD)");

            if (
              !certificate.grade ||
              !Number.isFinite(Number(certificate.grade))
            ) {
              errors.push("Invalid grade");
            }

            if (!isAddress(certificate.recipient))
              errors.push("Invalid Ethereum address");

            const idKey = certificate.studentId.toLowerCase();

            if (idKey && (idCounts.get(idKey) || 0) > 1) {
              errors.push("Duplicate student ID in file");
            }

            return {
              ...certificate,
              rowNumber: index + 2,
              errors,
            };
          }
        );

        // Check student IDs against the blockchain
        const contract = await getCertificateContract();

        await Promise.all(
          validatedRows.map(async (row) => {
            if (row.errors.length > 0) return;

            const alreadyExists = await contract.studentIdExists(
              row.studentId
            );

            if (alreadyExists) {
              row.errors.push(
                "Student already certified on blockchain"
              );
            }
          })
        );

        // Update the interface
        setCertificates(validatedRows);

        setSelectedRows(
          validatedRows
            .filter((row) => row.errors.length === 0)
            .map((row) => row.rowNumber)
        );
      } catch (err) {
        console.error(err);
        setError("Unable to read this file. Check the file format and wallet connection.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function toggleRow(rowNumber: number) {
    setSelectedRows((previous) =>
      previous.includes(rowNumber)
        ? previous.filter((id) => id !== rowNumber)
        : [...previous, rowNumber]
    );
  }

  const validRows = certificates.filter(
    (row) => row.errors.length === 0
  );

  function toggleAllValidRows() {
    if (selectedRows.length === validRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(validRows.map((row) => row.rowNumber));
    }
  }


  async function handleBatchMint() {
    try {
      setMinting(true);
      setMintMessage("");
      setMintMessageType("");

      const contract = await getCertificateContract();

      const selectedCertificates = certificates
        .filter(
          (row) =>
            selectedRows.includes(row.rowNumber) &&
            row.errors.length === 0
        )
        .map((row) => ({
          rowNumber: row.rowNumber,
          studentName: row.studentName,
          studentId: row.studentId,
          diplomaTitle: row.diplomaTitle,
          issueDate: row.issueDate,
          grade: row.grade,
          recipient: row.recipient,
        }));

      if (selectedCertificates.length === 0) {
        setMintMessage("No valid certificates selected.");
        setMintMessageType("info");
        return;
      }

      // Divide selected certificates into smaller batches
      const totalBatches = Math.ceil(
        selectedCertificates.length / batchSize
      );

      let completedCount = 0;
      const transactionHashes: string[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;

        const currentBatch = selectedCertificates.slice(
          start,
          start + batchSize
        );

        const batchData = currentBatch.map(
          ({ rowNumber, ...certificate }) => certificate
        );

        setMintMessage(
          `Processing batch ${i + 1}/${totalBatches} (${currentBatch.length} certificates)...`
        );
        setMintMessageType("info");

        try {
          // Send transaction
          const tx = await contract.batchMint(batchData);

          setMintMessage(
            `Batch ${i + 1}/${totalBatches} sent. Waiting for confirmation...`
          );

          // Wait for blockchain confirmation
          const receipt = await tx.wait();

          transactionHashes.push(receipt.hash);
          completedCount += currentBatch.length;

          // Remove successfully minted rows from selection
          const completedRowNumbers = currentBatch.map(
            (certificate) => certificate.rowNumber
          );

          setSelectedRows((previous) =>
            previous.filter(
              (rowNumber) => !completedRowNumbers.includes(rowNumber)
            )
          );

          setMintMessage(
            `Batch ${i + 1}/${totalBatches} confirmed. ${completedCount}/${selectedCertificates.length} certificates registered.`
          );
          setMintMessageType("info");

        } catch (batchError) {
          console.error(`Batch ${i + 1} failed:`, batchError);

          setMintMessage(
            `Batch ${i + 1}/${totalBatches} failed. ${completedCount} of ${selectedCertificates.length} certificates were successfully registered. Remaining certificates are still selected. Error: ${
              batchError instanceof Error
                ? batchError.message
                : "Unknown error"
            }`
          );

          setMintMessageType("error");
          return;
        }
      }

      setMintMessage(
        `Batch mint completed successfully! ${completedCount} certificates registered in ${totalBatches} transaction(s).\nTransaction hashes: ${transactionHashes.join(", ")}`
      );
      setMintMessageType("success");

    } catch (err) {
      console.error("Batch mint error:", err);

      setMintMessage(
        err instanceof Error
          ? `Batch mint failed: ${err.message}`
          : "Batch mint failed."
      );

      setMintMessageType("error");

    } finally {
      setMinting(false);
    }
  }


  const validCount = validRows.length;
  const invalidCount = certificates.length - validCount;
  const allValidSelected =
    validRows.length > 0 && selectedRows.length === validRows.length;

  return (
    <div className="batch-container">
      <div className="batch-intro">
        <div>
          <h3>Import Certificates</h3>
          <p>
            Upload a spreadsheet containing the academic certificate
            information.
          </p>
        </div>
      </div>

      <div className="batch-upload">
        <div className="upload-description">
          <div className="upload-icon">↑</div>
          <div>
            <strong>Choose an Excel or CSV file</strong>
            <p>Supported formats: .xlsx, .xls, .csv</p>
          </div>
        </div>

        <label className="file-picker">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
          />
          <span>Browse files</span>
        </label>
      </div>

      {fileName && (
        <div className="selected-file">
          <span className="file-name-icon">▤</span>
          <span className="selected-file-name">{fileName}</span>
          <span className="file-selected-label">Selected</span>
        </div>
      )}

      {error && (
        <div className="batch-error">
          {error}
        </div>
      )}

      {certificates.length > 0 && (
        <>
          <div className="batch-divider"></div>

          <div className="batch-section-title">
            <div>
              <h3>Import Summary</h3>
              <p>Review the results of the file validation.</p>
            </div>
          </div>

          <div className="batch-stats">
            <div className="batch-stat">
              <span>Total records</span>
              <strong>{certificates.length}</strong>
            </div>

            <div className="batch-stat valid-stat">
              <span>Valid</span>
              <strong>{validCount}</strong>
            </div>

            <div className="batch-stat invalid-stat">
              <span>Invalid</span>
              <strong>{invalidCount}</strong>
            </div>

            <div className="batch-stat selected-stat">
              <span>Selected</span>
              <strong>{selectedRows.length}</strong>
            </div>
          </div>

          <div className="batch-preview-header">
            <div>
              <h3>Certificate Preview</h3>
              <p>
                Review the records before registering them on the blockchain.
              </p>
            </div>

            <button
              type="button"
              className="select-all-button"
              onClick={toggleAllValidRows}
              disabled={validRows.length === 0}
            >
              {allValidSelected ? "Deselect all" : "Select all valid"}
            </button>
          </div>

          <div className="batch-table-wrapper">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Diploma</th>
                  <th>Issue Date</th>
                  <th>Grade</th>
                  <th>Recipient</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {certificates.map((cert) => (
                  <tr
                    key={cert.rowNumber}
                    className={
                      cert.errors.length > 0 ? "invalid-row" : ""
                    }
                  >
                    <td>
                      <input
                        className="batch-checkbox"
                        type="checkbox"
                        checked={selectedRows.includes(cert.rowNumber)}
                        disabled={cert.errors.length > 0}
                        onChange={() => toggleRow(cert.rowNumber)}
                      />
                    </td>

                    <td>{cert.studentName || "—"}</td>
                    <td>{cert.studentId || "—"}</td>
                    <td>{cert.diplomaTitle || "—"}</td>
                    <td>{cert.issueDate || "—"}</td>
                    <td>{cert.grade || "—"}</td>
                    <td className="recipient-cell">
                      {cert.recipient || "—"}
                    </td>

                    <td>
                      {cert.errors.length === 0 ? (
                        <span className="status-valid">Valid</span>
                      ) : (
                        <div className="status-invalid">
                          <span>Invalid</span>
                          <small>{cert.errors.join(", ")}</small>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="batch-actions">
            <div className="batch-selection-info">
              {selectedRows.length} of {validCount} valid records selected
            </div>

            <div className="batch-size-control">
              <label htmlFor="batch-size">Certificates per batch</label>

              <select
                id="batch-size"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                disabled={minting}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <button
              className="batch-mint-button"
              onClick={handleBatchMint}
              disabled={minting || selectedRows.length === 0}
            >
              {minting
                ? "Processing..."
                : `Issue ${selectedRows.length} Certificates`}
            </button>
          </div>

          {mintMessage && (
            <div className={`batch-message ${mintMessageType}`}>
              {mintMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BatchMintCertificates;
