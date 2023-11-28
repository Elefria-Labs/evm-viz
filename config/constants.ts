import { Network } from "alchemy-sdk";
import { mainnet, polygonMumbai } from "viem/chains";

export const githubLink = "https://github.com/heypran/zk-block";
export const twitterLink = "https://twitter.com/zk_block";

const baseUrl = "https://www.zkblock.app/";
export const Links = {
  home: baseUrl,
  boilerplate: "https://boilerplate.zkblock.app/",
  blog: "https://blog.zkblock.app/",
  zkChains: `${baseUrl}zk-networks`,
  zkTools: `${baseUrl}zk-tools`,
  contribute: `${baseUrl}contribute`,
  playgrounds: `${baseUrl}playgrounds`,
  eip712: `${baseUrl}eip712`,
  erc191: `${baseUrl}erc191`,
  txDecoder: `${baseUrl}txdecoder`,
  gasConverter: `${baseUrl}gasconverter`,
  byteconversion: `${baseUrl}byteconversion`,
  contractAddressGen: `${baseUrl}contract-address-gen`,
  burnerWallet: `${baseUrl}burner-wallet`,
  merkleTreeGenerator: `${baseUrl}merkletree-generator`,
  about: `${baseUrl}about`,
  subscribe: `${baseUrl}subscribe`,
  evm: "https://evm.zkblock.app/",
};

export const repoLink = "https://github.com/heypran/zk-block";
export const zkToosLink = "https://github.com/heypran/zk-tools";

export const solidityDataTypes = {
  bool: 1,
  uint8: 1,
  int8: 1,
  uint16: 2,
  int16: 2,
  uint32: 4,
  int32: 4,
  uint64: 8,
  int64: 8,
  uint128: 16,
  int128: 16,
  uint256: 32,
  int256: 32,
  address: 20,
};

export const alchemyConfig = {
  apiKey: process.env.ALCHEMY_KEY as string,
  network: Network.MATIC_MUMBAI,
};

export const SupportedChains = [polygonMumbai];
