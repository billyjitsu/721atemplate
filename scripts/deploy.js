const hre = require("hardhat");

async function main() {

  //variables
  const royalty = "500";
  const hiddenURI = "https://nfbeez.mypinata.cloud/ipfs/QmSnQ8qXZX2ADbiYni9fJ4igyTDHgF9Q7HZweFb7BHTUuq/1.json";
 // const merkle = "";
  
  const Web3 = await hre.ethers.getContractFactory("Template");
  const web3 = await Web3.deploy(royalty, hiddenURI);

  await web3.deployed();

  console.log("Template Contract deployed to:", web3.address);
  const receipt = await web3.deployTransaction.wait();
  console.log("gasUsed:" , receipt.gasUsed);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  // units * price per unit * value of eth
  // 2329485 *  30 gas * 2900

  // 2329485 * 0.000000030 x 2900

  //optimized contract 3982269


  // hidden uri - https://nfbeez.mypinata.cloud/ipfs/QmSnQ8qXZX2ADbiYni9fJ4igyTDHgF9Q7HZweFb7BHTUuq/1.json
  // reveal uir - https://nfbeez.mypinata.cloud/ipfs/Qmbm3Djnah3vR9RR7rCVRkNsBrvRzzmTJfSt6fRb1wHmT8/

  
  //setting hidden URI  full path:   ipfs://QmTvUtD92cWT2EM5Jz9yAUfmE9HftcgwV27qHPfv5Ym32J/1.json

  //token uri                       ipfs://QmTvUtD92cWT2EM5Jz9yAUfmE9HftcgwV27qHPfv5Ym32J/

  // root hash is in hex :   0x95f055acd455a996e22a9fc88c45ba8ebb72b4aa7c67eee09c54154278cfaa20
  // the proof NO SPACE NO Quotes :[0x67fcd2489de3cad4c4be15c58ca60f0df94323e882d5e4483778331ff0e1c766,
                                //0x0bbdbda1e7bb688d48302e95d14a21a7c90f156790c16df9dd0b376a24fab0b3,
                                //0xe1391c9c23df81f6c6a6f44037c24b6f1288a7c20e739ab3d06449970e6869f3,
                                // 0xf77a8d64b6f9526fdfe3567ae043274f06bfa2677fa71e7fe783c4f62f00ca0b]