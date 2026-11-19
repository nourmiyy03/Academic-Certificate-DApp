
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {

    // Structure représentant un certificat académique
    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
        bool revoked;
    }

    // Identifiant du prochain certificat
    uint256 private nextCertificateId = 1;

    // Stockage des certificats : ID => Certificate
    mapping(uint256 => Certificate) private certificates;

    // Vérifier si un étudiant possède déjà un certificat
    mapping(string => bool) public studentIdExists;

    // Adresse du propriétaire du contrat
    address public owner;



    // event permet a l'app frontend de détecter qu'un certificat vient d'être créé
    event CertificateMinted(
        uint256 indexed certId,
        string studentId,
        address recipient
    );

    // Constructeur exécuté une seule fois au déploiement
    constructor() {
        owner = msg.sender;
    }
    

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }


    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade
    ) external onlyOwner returns (uint256 certId) {

        require(to != address(0), "Invalid recipient");
        require(!studentIdExists[studentId], "Student already certified");

        certId = nextCertificateId;

        certificates[certId] = Certificate({
            studentName: studentName,
            studentId: studentId,
            diplomaTitle: diplomaTitle,
            issueDate: issueDate,
            grade: grade,
            recipient: to,
            revoked: false
        });

        studentIdExists[studentId] = true;

        nextCertificateId++;

        emit CertificateMinted(
            certId,
            studentId,
            to
        );
    }


    // Consulter les informations d'un certificat
    function getCertificate(uint256 certId) external view returns (Certificate memory) {
        require(certId > 0 && certId < nextCertificateId, "Certificate does not exist");

        return certificates[certId];
    }

    // Révoquer un certificat
    function revokeCertificate(uint256 certId) external onlyOwner {
        require(certId > 0 && certId < nextCertificateId, "Certificate does not exist");
        require(!certificates[certId].revoked, "Certificate already revoked");

        certificates[certId].revoked = true;
    }


    struct CertificateInput {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
    }


    function batchMint(
        CertificateInput[] calldata inputs
    ) external onlyOwner {
        require(inputs.length > 0, "Empty batch");

        for (uint256 i = 0; i < inputs.length; i++) {
            _mintCertificate(inputs[i]);
        }
    }


    function _mintCertificate(
        CertificateInput calldata input
    ) internal {
        require(input.recipient != address(0), "Invalid recipient");
        require(!studentIdExists[input.studentId], "Student already certified");

        uint256 certId = nextCertificateId;

        certificates[certId] = Certificate({
            studentName: input.studentName,
            studentId: input.studentId,
            diplomaTitle: input.diplomaTitle,
            issueDate: input.issueDate,
            grade: input.grade,
            recipient: input.recipient,
            revoked: false
        });

        studentIdExists[input.studentId] = true;
        nextCertificateId++;

        emit CertificateMinted(certId, input.studentId, input.recipient);
    }


}