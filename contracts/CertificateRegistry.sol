// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CertificateRegistry is ERC721URIStorage, AccessControl, ReentrancyGuard {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
        bool revoked;
    }

    uint256 private nextCertificateId = 1;

    mapping(uint256 => Certificate) private certificates;

    mapping(string => bool) public studentIdExists;

    event CertificateMinted(
        uint256 indexed tokenId,
        string studentId,
        address recipient
    );

    event CertificateRevoked(
        uint256 indexed tokenId
    );

    constructor() ERC721("Academic Certificate", "ACERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade,
        string calldata uri
    )
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        returns (uint256 tokenId)
    {
        tokenId = nextCertificateId;

        _mintCertificate(
            to,
            uri,
            studentName,
            studentId,
            diplomaTitle,
            issueDate,
            grade
        );
    }

    function batchMintCertificates(
        address[] calldata to,
        string[] calldata uris,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades
    )
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
    {
        require(to.length > 0, "Empty batch");

        require(
            to.length == uris.length &&
            to.length == studentNames.length &&
            to.length == studentIds.length &&
            to.length == diplomaTitles.length &&
            to.length == issueDates.length &&
            to.length == grades.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < to.length; i++) {
            _mintCertificate(
                to[i],
                uris[i],
                studentNames[i],
                studentIds[i],
                diplomaTitles[i],
                issueDates[i],
                grades[i]
            );
        }
    }

    function _mintCertificate(
        address to,
        string calldata uri,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade
    )
        internal
    {
        require(to != address(0), "Invalid recipient");

        require(
            bytes(studentName).length > 0,
            "Invalid student name"
        );

        require(
            bytes(studentId).length > 0,
            "Invalid student ID"
        );

        require(
            bytes(diplomaTitle).length > 0,
            "Invalid diploma title"
        );

        require(
            bytes(issueDate).length > 0,
            "Invalid issue date"
        );

        require(
            bytes(grade).length > 0,
            "Invalid grade"
        );

        require(
            bytes(uri).length > 0,
            "Invalid token URI"
        );

        require(
            !studentIdExists[studentId],
            "Student already certified"
        );

        uint256 tokenId = nextCertificateId;


        // 1. Effects: update the contract state first
        certificates[tokenId] = Certificate({
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

        // 2. Interactions: perform external calls after state updates
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // 3. Emit event
        emit CertificateMinted(
            tokenId,
            studentId,
            to
        );
    }

    function revokeCertificate(
        uint256 tokenId
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Certificate does not exist"
        );

        require(
            !certificates[tokenId].revoked,
            "Certificate already revoked"
        );

        certificates[tokenId].revoked = true;

        emit CertificateRevoked(tokenId);
    }

    function getCertificate(
        uint256 tokenId
    )
        external
        view
        returns (Certificate memory)
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Certificate does not exist"
        );

        return certificates[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override
        returns (string memory)
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Certificate does not exist"
        );

        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}