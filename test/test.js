const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


describe("Template", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function beforeEachFunction() {
    const publicPrice = String(0.09 * (10 ** 18));
    const whiteListPrice = String(0.08 * (10 ** 18));

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    //variables
    const royalty = "500";
    const royaltyWallet = "0x49284a18822eE0d75fD928e5e0fC5a46C9213D96";
    const hiddenURI =
      "https://nfbeez.mypinata.cloud/ipfs/QmSnQ8qXZX2ADbiYni9fJ4igyTDHgF9Q7HZweFb7BHTUuq/1.json";
    // const merkle = "";

    const rootHash = "0xe773461ace97ebf3c00c769a227851e8c66d51edfe691e9a61a02e6ecda1d725" ;

    const hexProof = 
      ['0x5931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229', '0xcd8846898ff5ae3e9009307a7197717101e9e696ed21cbec822275df1c7996db', '0xdafd05e5d88fa2417529bfc119d9156c41e2e50f813b965472e335ba5d490dd8'] ;
    

    const Template = await hre.ethers.getContractFactory("Template");
    const contract = await Template.deploy(
      royalty,
      royaltyWallet,
      hiddenURI
    );

    return {
      contract,
      owner,
      otherAccount,
      royalty,
      hiddenURI,
      publicPrice,
      whiteListPrice,
      hexProof,
      rootHash,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(beforeEachFunction);

      expect(await contract.owner()).to.equal(owner.address);
    });

    //Try to transfer ownership
    it("Should Transfer Ownership", async function () {
      const { contract, owner, otherAccount } = await loadFixture(
        beforeEachFunction
      );
      await contract.transferOwnership(otherAccount.address);
      expect(await contract.owner()).to.equal(otherAccount.address);
    });
  });

  describe("Mint", function () {

    it("Should revert - mint not live", async function () {
        const { contract, publicPrice } = await loadFixture(beforeEachFunction);
        // await contract.mint(1, { value: 0 });
        await expect(contract.mint(1, { value: publicPrice })).to.be.revertedWith(
          "Template - Not Yet Active."
        );
      });

    it("Mint one", async function () {
      const { contract, owner, publicPrice } = await loadFixture(
        beforeEachFunction
      );
      await contract.togglePublicSale();
      await contract.mint(1, { value: publicPrice });
      expect(await contract.balanceOf(owner.address)).to.equal(1);
    });


    it("Should revert mint no funds", async function () {
      const { contract } = await loadFixture(beforeEachFunction);
      // await contract.mint(1, { value: 0 });
      await contract.togglePublicSale();
      await expect(contract.mint(1, { value: 0 })).to.be.revertedWith(
        "Template - Below"
      );
    });

    
    it("Should mint a bunch", async function () {
      const { contract, owner, publicPrice } = await loadFixture(
        beforeEachFunction
      );
      await contract.togglePublicSale();

      for (let i = 0; i < 5; i++) {
        await contract.mint(1, { value: publicPrice });
      }
      expect(await contract.balanceOf(owner.address)).to.equal(5);
    });

    it("AllowList Mint", async function () {
      const { contract, owner, whiteListPrice, rootHash, hexProof } = await loadFixture(
        beforeEachFunction
      );
      await contract.toggleAllowListSale();
      await contract.setMerkleRoot(rootHash);
        

      await contract.allowlistMint( hexProof, 1, { value: whiteListPrice });
      expect(await contract.balanceOf(owner.address)).to.equal(1);
    });

    it("Pass Max mint revert", async function () {
      const { contract, owner, whiteListPrice, rootHash, hexProof } = await loadFixture(
        beforeEachFunction
      );
      await contract.toggleAllowListSale();
      await contract.setMerkleRoot(rootHash);
        
      for (let i = 0; i < 2; i++) {
      await contract.allowlistMint( hexProof, 1, { value: whiteListPrice });
      }
      expect(await contract.allowlistMint( hexProof, 1, { value: whiteListPrice })).to.be.revertedWith("Template - Cannot mint beyond whitelist max mint!");
    });

    it("AllowList Mint - Not on list", async function () {
      const { contract, owner, otherAccount, whiteListPrice, rootHash, hexProof } = await loadFixture(
        beforeEachFunction
      );
      await contract.toggleAllowListSale();
      await contract.setMerkleRoot(rootHash);
        

      await expect(contract.connect(otherAccount).allowlistMint( hexProof, 1, { value: whiteListPrice })).to.be.revertedWith("Template - You are not whitelisted");
      
    });

    it("contract Paused mint revert", async function () {
      const { contract, owner,publicPrice, whiteListPrice, rootHash, hexProof } = await loadFixture(
        beforeEachFunction
      );
      await contract.toggleAllowListSale();
      await contract.setMerkleRoot(rootHash);
      await contract.togglePause();
        
      await expect(contract.allowlistMint( hexProof, 1, { value: whiteListPrice })).to.be.revertedWith("Contract Paused");
      await expect(contract.mint(1, { value: publicPrice })).to.be.revertedWith("Contract Paused");
    });

    

    //Mint out cap
    /*
      it("Should mint a bunch", async function () {
        const { contract, owner, publicPrice } = await loadFixture(
          beforeEachFunction
        );
  
        for(let i = 0; i < 5; i++) {
          await contract.mint(1, { value: publicPrice });
        }
        expect(await contract.balanceOf(owner.address, 1)).to.equal(5);
      });
      */
  });

  describe("Withdrawal", function () {
    it("Should fail if Non-Owner tries to withdraw", async function () {
      const { contract, otherAccount } = await loadFixture(beforeEachFunction);

      await expect(
        contract.connect(otherAccount).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    /*
    it("Should Withdraw to addresses", async function () {
      const { contract, owner, publicPrice } = await loadFixture(
        beforeEachFunction
      );

      for (let i = 0; i < 55; i++) {
        await contract.mint(1, { value: publicPrice });
      }
      let total = publicPrice * 55;

      // await expect( contract.withdraw().to.changeEtherBalances([owner], [-total] ));
      //not working
    });
    */
  });
});
