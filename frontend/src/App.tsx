import ConnectWallet from "./components/ConnectWallet";
import MintCertificate from "./components/MintCertificate";
import VerifyCertificate from "./components/VerifyCertificate";
import BatchMintCertificates from "./components/BatchMintCertificates";
import RevokeCertificate from "./components/RevokeCertificate";
import "./App.css";



function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <h2>CertiChain</h2>
            <span>Academic Certificates</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-link">
            <span>⌂</span>
            Dashboard
          </a>
          <a href="#issue" className="nav-link">
            <span>＋</span>
            Issue Certificate
          </a>
          <a href="#batch" className="nav-link">
            <span>▤</span>
            Batch Import
          </a>
          <a href="#revoke" className="nav-link">
            <span>−</span>
            Revoke Certificate
          </a>
          <a href="#verify" className="nav-link">
            <span>⌕</span>
            Verify Certificate
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="network-dot"></span>
          <div>
            <strong>Hardhat Network</strong>
            <small>Local blockchain</small>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <h1>Certificate Dashboard</h1>
            <p className="page-description">
              Manage and verify academic certificates.
            </p>
          </div>

          <div className="wallet-panel">
            <ConnectWallet />
          </div>
        </header>

        <section className="dashboard-section" id="issue">
          <div className="section-heading">
            <div>
              <h2>Issue a Certificate</h2>
              <p>Create a new academic certificate.</p>
            </div>
          </div>
          <div className="content-card">
            <MintCertificate />
          </div>
        </section>

        <section className="dashboard-section" id="batch">
          <div className="section-heading">
            <div>
              <h2>Batch Import</h2>
              <p>Import multiple certificates from an Excel or CSV file.</p>
            </div>
          </div>
          <div className="content-card">
            <BatchMintCertificates />
          </div>
        </section>

        <section className="dashboard-section" id="revoke">
          <div className="section-heading">
            <div>
              <h2>Revoke a Certificate</h2>
              <p>Revoke an existing academic certificate.</p>
            </div>
          </div>
          <div className="content-card">
            <RevokeCertificate />
          </div>
        </section>

        <section className="dashboard-section" id="verify">
          <div className="section-heading">
            <div>
              <h2>Verify a Certificate</h2>
              <p>Check a certificate and its current status.</p>
            </div>
          </div>
          <div className="content-card verification-card">
            <VerifyCertificate />
          </div>
        </section>

        <footer className="app-footer">
          <span>CertiChain</span>
          <span>Academic Certificate Management</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
