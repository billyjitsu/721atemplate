//SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

contract Template is ERC721A, Ownable, ERC2981, ReentrancyGuard{
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 7777;
    // uint256 public constant MAX_PUBLIC_MINT = 10;
    uint256 public constant MAX_ALLOWLIST_MINT = 3;
    uint256 public constant PUBLIC_SALE_PRICE = 0.09 ether;
    uint256 public constant ALLOWLIST_SALE_PRICE = 0.08 ether;

    string private  baseTokenUri;
    string public   hiddenURI;

    //deploy smart contract, toggle WL, toggle WL when done, toggle publicSale 
    bool public isRevealed;
    bool public publicSale;
    bool public allowListSale;
    bool public teamMinted;
    bool public paused;

    bytes32 private merkleRoot;

    mapping(address => uint256) public totalPublicMint;
    mapping(address => uint256) public totalAllowListMint;

    //Bips = percentage * 10,000   eg .025 * 10,000 = 250  5% = 500
    constructor(uint96 _royaltyFeesInBips, address _royalty, string memory _hiddenURI) ERC721A("Template", "TMP"){
        setRoyaltyInfo(_royalty, _royaltyFeesInBips);
        hiddenURI = _hiddenURI;
        //consider merkleroot too
    }

    //Make sure that calls are not from contracts
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "Template - Cannot be called by a contract");
        _;
    }

    function mint(uint256 _quantity) external payable {
        require(!paused, "Contract Paused");
        require(publicSale, "Template - Not Yet Active.");
        require((totalSupply() + _quantity) <= MAX_SUPPLY, "Template - Beyond Max Supply");
       // require((totalPublicMint[msg.sender] +_quantity) <= MAX_PUBLIC_MINT, "Template - hit max mint for this wallet!");
        require(msg.value >= (PUBLIC_SALE_PRICE * _quantity), "Template - Below");

        totalPublicMint[msg.sender] += _quantity;
        _safeMint(msg.sender, _quantity);
    }

    function allowlistMint(bytes32[] memory _merkleProof, uint256 _quantity) external payable callerIsUser{
        require(!paused, "Contract Paused");
        require(allowListSale, "Template - Minting is on Pause");
        require((totalSupply() + _quantity) <= MAX_SUPPLY, "Template - Cannot mint beyond max supply");
        require((totalAllowListMint[msg.sender] + _quantity)  <= MAX_ALLOWLIST_MINT, "Template - Cannot mint beyond whitelist max mint!");
        require(msg.value >= (ALLOWLIST_SALE_PRICE * _quantity), "Template - Payment is below the price");
        //create leaf node
        bytes32 sender = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, sender), "Template - You are not whitelisted");

        totalAllowListMint[msg.sender] += _quantity;
        _safeMint(msg.sender, _quantity);
    }

    function teamMint() external onlyOwner{
        require(!teamMinted, "Template - Team already minted");
        teamMinted = true;
        _safeMint(msg.sender, 200);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenUri;
    }

    //return uri for certain token
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        if(!isRevealed){
            return hiddenURI;
        }
  
        return bytes(baseTokenUri).length > 0 ? string(abi.encodePacked(baseTokenUri, tokenId.toString(), ".json")) : "";
    }

    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory ownerTokens)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 totalTkns = totalSupply();
            uint256 resultIndex = 0;
            uint256 tnkId;

            for (tnkId = _startTokenId(); tnkId <= totalTkns; tnkId++) {
                if (ownerOf(tnkId) == _owner) {
                    result[resultIndex] = tnkId;
                    resultIndex++;
                }
            }

            return result;
        }
    }

    // method overriden to start token ID from 1.
    function _startTokenId() internal pure virtual override returns (uint256) {
        return 1;
    }

    //Interface overide for royalties
     function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721A, ERC2981)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId);
    }

    //Only Owner Functions
    function setRoyaltyInfo(address _receiver, uint96 _royaltyFeesInBips) public onlyOwner {
        _setDefaultRoyalty(_receiver, _royaltyFeesInBips);
    }

    function setTokenUri(string memory _baseTokenUri) external onlyOwner{
        baseTokenUri = _baseTokenUri;
    }
    function setHiddenUri(string memory _hiddenURI) external onlyOwner{
        hiddenURI = _hiddenURI;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner{
        merkleRoot = _merkleRoot;
    }

    function getMerkleRoot() external view returns (bytes32){
        return merkleRoot;
    }

    function toggleAllowListSale() external onlyOwner{
        allowListSale = !allowListSale;
    }

    function togglePublicSale() external onlyOwner{
        publicSale = !publicSale;
    }

    function toggleReveal() external onlyOwner{
        isRevealed = !isRevealed;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success);
    }
}