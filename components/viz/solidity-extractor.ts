import { Network, Alchemy } from "alchemy-sdk";
import { Eip1193Provider, ethers } from "ethers";
import Web3 from "Web3";
import { solidityDataTypes } from "../../config/constants";
import { VariableType } from "../../config/enums";
import { DataType, SlotType } from "./Storage";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/**
 * The `ContractHelperBase` class serves as a foundational utility for interacting with Ethereum smart contracts,
 * offering a set of methods to facilitate the retrieval and manipulation of data stored within the contract's storage.
 * This class integrates with the Web3 library for Ethereum and leverages the Alchemy service for enhanced functionality.
 *
 * Key Features:
 * - Conversion utilities for handling hex strings, numeric values, and readable strings.
 * - Methods for reading and interpreting various data types stored in the contract, including arrays, structs, and mappings.
 * - Computation of storage slot positions and handling of array and struct storage.
 *
 * Usage:
 * - Instantiate the class by providing the contract address, Alchemy API key, network information, data types, and an optional provider URL.
 * - Utilize the provided methods to interact with the smart contract, read storage, and retrieve data based on specified types and storage slots.
 * - The class supports MetaMask integration for wallet-related operations.
 *
 * @class
 */

class ContractHelperBase {
  protected contractAddress: string;
  protected alchemyConfig: { apiKey: string; network: Network };
  protected settings: { apiKey: string; network: Network };
  protected ethWeb3: Web3;
  protected alchemy: Alchemy;
  protected defaultProvider: any;
  protected providerUrl: string | undefined;
  protected dataTypes: Record<string, DataType>;

  constructor(
    contractAddress: string,
    alchemyConfig: { apiKey: string; network: Network },
    dataTypes: Record<string, DataType>,
    providerUrl?: string | undefined
  ) {
    this.contractAddress = contractAddress;
    this.alchemyConfig = alchemyConfig;
    this.dataTypes = dataTypes;
    this.settings = {
      apiKey: alchemyConfig.apiKey,
      network: alchemyConfig.network,
    };
    this.defaultProvider =
      providerUrl && new Web3.providers.HttpProvider(providerUrl as string);
    this.ethWeb3 = new Web3(
      providerUrl
        ? this.defaultProvider
        : `https://${alchemyConfig.network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`
    );
    this.alchemy = new Alchemy(this.settings);
  }

  /**
   * Retrieves the wallet signer and provider for Ethereum interactions. Displays a message if MetaMask is not installed.
   *
   * @returns {Object} An object containing the wallet provider and signer, or null if MetaMask is not installed.
   */

  wallet() {
    let signer = null;
    let provider;
    if (window.ethereum == null) {
      alert("MetaMask not installed; using read-only defaults");
    } else {
      provider = new ethers.BrowserProvider(
        window?.ethereum as Eip1193Provider
      );
      signer = provider.getSigner().then((signer) => signer);
      return { provider, signer };
    }
  }

  /**
   * Converts a hexadecimal string to a numeric value.
   *
   * @param {string} value - The hexadecimal string to be converted.
   * @returns {number} The numeric value derived from the hexadecimal string.
   */

  public convertToNumber(value: string): number {
    return this.ethWeb3?.utils?.hexToNumber(value) as number;
  }

  /**
   * Converts a hexadecimal string to a readable string.
   *
   * @param {string} value - The hexadecimal string to be converted.
   * @returns {string} The readable string derived from the hexadecimal string.
   */

  public convertToString(value: string): string {
    return this.ethWeb3.utils.hexToString(value)?.split("\u0000")?.[0] || "";
  }

  /**
   * Converts a value based on its data type.
   *
   * @param {string} value - The value to be converted.
   * @param {string} type - The data type of the value.
   * @returns {string | number} The converted value.
   */

  public convertValue(value: string, type: string): string | number {
    if (type.includes(VariableType.String) || type.includes(VariableType.Bytes))
      return this.convertToString(value);
    if (type.includes(VariableType.Uint))
      return this.convertToNumber(value) as unknown as number;
    if (type.includes(VariableType.Address)) return value as unknown as string;
    return "";
  }

  /**
   * Gets the appropriate value based on the data type.
   *
   * @param {any} currentType - The current data type.
   * @param {any} currentTypeData - The data associated with the data type.
   * @returns {any} The extracted value based on the data type.
   */

  public getValue(currentType, currentTypeData) {
    if (currentType.includes(VariableType.Mapping)) return "";

    if (currentType.includes(VariableType.Address)) return currentTypeData;

    if (
      currentType.includes(VariableType.Bytes) ||
      currentType.includes(VariableType.String)
    )
      return this.convertToString?.(currentTypeData);

    if (currentType.includes(VariableType.Uint))
      return this.convertToNumber?.(currentTypeData);

    if (currentType.includes(VariableType.Bool))
      return !!Number(currentTypeData);
  }

  /**
   * Computes the storage slot position for a mapping using the specified mapping type and key.
   *
   * @param {string[]} mappingType - The mapping type.
   * @param {string[]} key - The key associated with the mapping.
   * @returns {string} The computed storage slot position.
   */

  public getSlotPosition(mappingType: string[], key: string[]): string {
    return Web3.utils.soliditySha3(
      this.ethWeb3.eth.abi.encodeParameters(mappingType, key)
    ) as string;
  }

  /**
   * Computes the next storage slot position based on the current address and optional move.
   *
   * @param {string} currentAddress - The current storage slot address in hexadecimal format.
   * @param {number} move - The number of slots to move. Default is 1.
   * @returns {string} The next storage slot position.
   */

  public getNextSlotPosition(currentAddress: string, move: number = 1): string {
    const currentAddressNumber = BigInt(currentAddress);
    const nextAddressNumber = currentAddressNumber + BigInt(move);
    const nextAddress = "0x" + nextAddressNumber.toString(16);
    return nextAddress;
  }

  /**
   * Reads the storage slot of the contract at the specified address or index.
   *
   * @param {string | number} slotAddress - The slot address or index to read.
   * @returns {Promise<string>} A promise that resolves to the data stored in the specified storage slot.
   */

  public async readStorageSlot(slotAddress: string | number): Promise<string> {
    return this.defaultProvider
      ? this.wallet()?.provider?.getStorage(this.contractAddress, slotAddress)
      : this.alchemy.core.getStorageAt(this.contractAddress, slotAddress);
  }

  /**
   * Unpacks values from a storage slot based on the specified slot position and data types.
   *
   * @param {string} slotPosition - The position of the storage slot in hexadecimal format.
   * @param {string[]} types - The data types associated with the values to be unpacked.
   * @returns {Promise<(string | number)[]>} A promise that resolves to an array of unpacked values.
   */

  public async unpackValuesFromSlot(
    slotPosition: string,
    types: string[]
  ): Promise<(string | number)[]> {
    const storageData = await this.readStorageSlot(
      Boolean(slotPosition.match(/^0x[0-9a-f]+$/i))
        ? slotPosition
        : Number(slotPosition)
    );
    const hexString = storageData.replace("0x", "");
    let slotValues: (string | number)[] = [];
    let sliceStart = 64;
    let sliceEnd = 64;
    for (let i = 0; i < types.length; i++) {
      const currentType = types[i].split("t_")?.[1];
      const bytesToSlice = solidityDataTypes[currentType] * 2;
      sliceStart -= bytesToSlice;
      const currentTypeData = hexString.slice(sliceStart, sliceEnd);
      sliceEnd = sliceStart;
      slotValues.push(this.getValue(currentType, `0x${currentTypeData}`));
    }

    return slotValues;
  }

  /**
   * Resolves promises in an array and handles errors.
   *
   * @param {string[] | number[]} array - An array of promises to be resolved.
   * @returns {Promise<string[] | number[] | undefined>} A promise that resolves to the resolved values or undefined in case of errors.
   */

  protected async resolveArrayPromises(
    array
  ): Promise<string[] | number[] | undefined> {
    return Promise.allSettled(array).then((results) => {
      const data = results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          console.log(result.reason);
          return [];
        }
      });
      return data ?? [];
    });
  }

  /**
   * Retrieves array data from the storage slot of the specified address.
   *
   * @param {string} address - The storage slot address in hexadecimal format.
   * @returns {Promise<number>} A promise that resolves to the array data.
   */

  public async retrieveArrayDataFromSlot(address: string): Promise<number> {
    const arraySlotValue = await this.readStorageSlot(address);
    return this.convertToNumber(arraySlotValue);
  }

  /**
   * Extracts the struct type from the given type string.
   *
   * @param {string} type - The type string.
   * @returns {string | null} The extracted struct type or null if not found.
   */

  private getStructType(type: string) {
    if (type.includes("t_array")) {
      let startDelimiter = "t_array(";
      let endDelimiter = ")dyn_storage";

      let startIndex = type.indexOf(startDelimiter);
      let endIndex = type.indexOf(
        endDelimiter,
        startIndex + startDelimiter.length
      );

      let structType =
        startIndex !== -1 && endIndex !== -1
          ? type.substring(startIndex + startDelimiter.length, endIndex)
          : null;
      return structType;
    }
    if (type.includes(VariableType.Mapping)) {
      const structDelimiter = /[,]/;
      const splitValue = type?.split(structDelimiter);
      return splitValue?.[splitValue?.length - 1]?.split("))")?.[0];
    }
  }

  /**
   * Reads values from a struct stored in the contract's storage.
   *
   * @param {string | number} variableSlot - The slot identifier or index of the struct in storage.
   * @param {number} structArrayLength - The length of the struct array.
   * @param {string} type - The type of the struct.
   * @param {boolean} isMappingSource - Indicates if the struct is a mapping source.
   * @returns {Promise<any[] | undefined>} A promise that resolves to an array of values from the struct.
   */

  private async readStructValues(
    variableSlot: string | number,
    structArrayLength: number,
    type: string,
    isMappingSource: boolean
  ): Promise<any[] | undefined> {
    const structDataType = this.dataTypes?.[type]?.members;
    if (!structDataType) return;
    const structKeys = structDataType?.reduce((acc, curr) => {
      if (!acc?.[curr.slot]) acc[curr.slot] = { variableType: [], label: [] };
      acc[curr.slot]?.variableType?.push(curr.type);
      acc[curr.slot]?.label?.push(curr.label);
      return acc;
    }, {});

    const structKeysLength = Object.keys(structKeys).length;
    let currentSlot = !isMappingSource
      ? (Web3.utils.soliditySha3(
          this.ethWeb3.eth.abi.encodeParameter("uint256", variableSlot)
        ) as string)
      : variableSlot;
    const structValue: any[] = [];
    for (let j = 0; j < structArrayLength; j++) {
      if (structDataType?.length > 0) {
        for (let i = 0; i < structKeysLength; i++) {
          if (
            structKeys[i]?.variableType?.[0].includes("t_array") ||
            structKeys[i]?.variableType?.[0].includes("t_mapping")
          ) {
            // This need to be confirm if the mapping value can be access in the struct
            // const data = await this.readMappingFromStorage(
            //   structKeys[i]?.variableType?.[0],
            //   variableSlot,
            //   ["0x8B20814C182DbF6687957A80C4fCD9e6f10f05B9"]
            // );
          } else {
            if (structKeys[i]?.variableType?.length > 1) {
              const packedData = await this.unpackValuesFromSlot(
                currentSlot as string,
                structKeys[i]?.variableType
              );

              packedData.forEach((value, index) => {
                structValue.push({
                  label: structKeys[i]?.label[index],
                  value,
                });
              });
            } else {
              const data = await this.readStorageSlot(currentSlot);
              structValue.push({
                label: structKeys[i]?.label[0],
                value: this.convertValue(data, structKeys[i]?.variableType[0]),
              });
            }
          }
          if (i < structKeysLength)
            currentSlot = this.getNextSlotPosition(currentSlot as string);
        }
      }
    }
    return structValue;
  }

  /**
   * Retrieves values from an array stored in the contract's storage.
   *
   * @param {string | number} variableSlot - The slot identifier or index of the array in storage.
   * @param {string} type - The type of the array.
   * @returns {Promise<string[] | number[] | undefined>} A promise that resolves to an array of values from the array storage.
   */

  async readArrayStorage(
    variableSlot: number | string,
    type: string
  ): Promise<string[] | number[] | undefined> {
    const nestedArrayLength = type
      ?.split("(")
      ?.filter((val) => val === "t_array")?.length;
    const arrayLength = this.convertToNumber(
      await this.readStorageSlot(variableSlot)
    );

    if (nestedArrayLength > 1) {
      return this.retrieveNestedArrayValues(
        VariableType.Array,
        variableSlot,
        nestedArrayLength - 1
      );
    } else {
      let arrayData: (string | number | bigint)[] = [];
      let currentVariableSlot = this.getSlotPosition(
        ["uint256"],
        [variableSlot as string]
      ) as string;
      if (type.includes("struct")) {
        const structType = this.getStructType(type) ?? "";
        return this.readStructValues(
          variableSlot,
          arrayLength,
          structType,
          false
        );
      }
      for (let i = 0; i < arrayLength; i++) {
        const currentSlotValue: number | bigint =
          await this.retrieveArrayDataFromSlot(currentVariableSlot as string);
        arrayData.push(currentSlotValue);
        currentVariableSlot = this.getNextSlotPosition(
          currentVariableSlot as string
        );
      }
      return this.resolveArrayPromises(arrayData);
    }
  }

  /**
   * Retrieves values from nested arrays stored in the contract's storage.
   *
   * @param {string} type - The type of the nested arrays.
   * @param {string | number} variableSlot - The slot identifier or index of the nested arrays in storage.
   * @param {number} nestedArrayLength - The length of the nested arrays.
   * @returns {Promise<any[] | undefined>} A promise that resolves to an array of values from the nested arrays.
   */

  async retrieveNestedArrayValues(
    type: string,
    variableSlot: string | number,
    nestedArrayLength: number
  ): Promise<string[] | number[] | undefined> {
    const arrayLength = this.convertToNumber(
      await this.readStorageSlot(variableSlot)
    );

    if (arrayLength < 1) return [];
    let currentVariableSlot = this.getSlotPosition(
      ["uint256"],
      [variableSlot as string]
    );

    if (nestedArrayLength > 0) {
      let arrayValue: Promise<string[] | number[] | undefined>[] = [];
      for (let i = 0; i < arrayLength; i++) {
        arrayValue[i] = this.retrieveNestedArrayValues(
          type,
          currentVariableSlot as string,
          nestedArrayLength - 1
        );

        currentVariableSlot = this.getNextSlotPosition(
          currentVariableSlot as string
        );
      }
      return this.resolveArrayPromises(arrayValue);
    } else {
      const arrayLength = this.convertToNumber(
        await this.readStorageSlot(variableSlot)
      );
      if (type.includes("struct")) {
        const structType = this.getStructType(type) ?? "";
        return this.readStructValues(
          this.getSlotPosition(["uint256"], [variableSlot as string]),
          arrayLength,
          structType as string,
          false
        );
      }
      if (!arrayLength) return [];
      let arrayData: (number | bigint)[] = [];
      for (let i = 0; i < arrayLength; i++) {
        const valueAtSlot: number | bigint =
          await this.retrieveArrayDataFromSlot(currentVariableSlot as string);
        arrayData.push(valueAtSlot);
        currentVariableSlot = this.getNextSlotPosition(
          currentVariableSlot as string
        );
      }
      return this.resolveArrayPromises(
        arrayData as unknown as Promise<number | BigInt>[]
      );
    }
  }

  /**
   * Reads values from a mapping stored in the contract's storage.
   *
   * @param {string} mappingStructure - The structure of the mapping.
   * @param {string} variableSlot - The slot identifier or index of the mapping in storage.
   * @param {string[]} keys - The keys associated with the mapping.
   * @returns {Promise<{ [key: string]: number | string }[] | string | number> } A promise that resolves to an array of values from the mapping.
   */

  async readMappingFromStorage(
    mappingStructure: string,
    variableSlot: string,
    keys: string[]
  ) {
    const delimiters = /[(,]/;
    const mappingTypes = mappingStructure.split(delimiters);

    if (mappingTypes[mappingTypes.length - 2] === "t_struct") {
      mappingTypes.pop();
    }

    let hasFirstMappingFound = false;
    let currentSlot = variableSlot;
    let keysIndex = 0;

    for (let i = 0; i < mappingTypes?.length - 2; i++) {
      if (mappingTypes[i] === "t_mapping") {
        const mappingType = mappingTypes[i + 1]?.split("t_")?.[1];
        const nextSlot = hasFirstMappingFound
          ? this.getSlotPosition(
              [mappingType, "uint256"],
              [keys[keysIndex], currentSlot]
            )
          : this.getSlotPosition(
              [mappingType, "uint256"],
              [keys[keysIndex], currentSlot]
            );

        hasFirstMappingFound = true;
        keysIndex++;
        currentSlot = nextSlot;
      }
    }

    if (mappingTypes[mappingTypes.length - 1] === "t_struct") {
      const structDelimiter = /[,]/;
      const splitValue = mappingStructure?.split(structDelimiter);

      return this.readStructValues(
        currentSlot,
        1,
        splitValue?.[splitValue?.length - 1]?.split("))")?.[0],
        true
      ) as unknown as any[];
    }
    return this.convertValue(
      await this.readStorageSlot(currentSlot),
      mappingTypes[mappingTypes.length - 1]
    );
  }
}

/**
 * The `SolidityExtractor` class extends the functionality of the `ContractHelperBase` class,
 * providing additional capabilities for extracting and interpreting data from Ethereum smart contracts.
 * This class focuses on analyzing the storage layout of a smart contract and facilitates the retrieval
 * of values based on the defined storage structure.
 *
 * Key Features:
 * - Inherits from `ContractHelperBase`, leveraging its Ethereum interaction capabilities.
 * - Stores and utilizes the storage layout of the smart contract, specified as an array of `SlotType`.
 * - Manages a record of data types associated with the contract's variables for interpretation.
 * - Constructs a slot structure to organize storage slots by variable slots for efficient retrieval.
 * - Offers methods to retrieve values from storage slots, arrays, and mappings based on the defined structure.
 *
 * Usage:
 * - Instantiate the class by providing the contract address, Alchemy API key, storage layout, data types, and an optional provider URL.
 * - Utilize the provided methods to retrieve values from storage slots, arrays, and mappings based on the specified structure.
 * - Leverage the inheritance from `ContractHelperBase` for general Ethereum interaction functionalities.
 *
 * Note: This class assumes the use of Web3 for Ethereum interactions and Alchemy for extended functionality.
 *
 * @class
 * @extends {ContractHelperBase}
 */

export class SolidityExtractor extends ContractHelperBase {
  public storageLayout: SlotType[];
  public dataTypes: Record<string, DataType>;
  public slotStructure: {};
  public providerUrl: string | undefined;

  constructor(
    contractAddress: string,
    alchemyConfig: { apiKey: string; network: Network },
    storageLayout: SlotType[],
    dataTypes: Record<string, DataType>,
    providerUrl?: string
  ) {
    super(contractAddress, alchemyConfig, dataTypes, providerUrl);
    this.storageLayout = storageLayout;
    this.dataTypes = dataTypes;
    this.slotStructure = storageLayout?.reduce((acc, curr) => {
      if (!acc?.[curr.slot]) acc[curr.slot] = { variableSlot: [] };
      acc[curr.slot]?.variableSlot?.push(curr.type);
      return acc;
    }, {});
  }

  /**
   * Retrieves values from storage slots based on the provided slot structure.
   * @returns {Promise<any[]>} A promise that resolves to an array of values retrieved from storage.
   */

  public async getAllSlotValues() {
    const slotValues = Object.keys(this.slotStructure)?.map(async (slot) => {
      const currentVariableSlot = this.slotStructure?.[slot]?.variableSlot;

      // Check if the variable slot has more than one variable type
      if (currentVariableSlot?.length > 1) {
        return await this.unpackValuesFromSlot(
          slot,
          this.slotStructure?.[slot].variableSlot
        );
      } else if (
        currentVariableSlot?.length === 1 &&
        currentVariableSlot?.[0]?.includes(VariableType.Array)
      ) {
        return await this.retrieveArrayValues(slot, currentVariableSlot?.[0]);
      } else {
        const value = await this.readStorageSlot(Number(slot));
        return this.getValue(currentVariableSlot?.[0], value);
      }
    });

    // Resolve all promises in the array and return the result
    return this.resolveArrayPromises(slotValues as unknown as Promise<any>[]);
  }

  /**
   * Retrieves values from a mapping storage based on the specified variable slot and keys.
   *
   * @param {string} variableSlot - The variable slot identifier used to locate the mapping in storage.
   * @param {string[]} keys - An array of keys for which mapping values need to be retrieved.
   * @returns {Promise<{ [key: string]: number | string }[]>} A promise that resolves to an array of objects representing mapping values.
   */

  public async retrieveMappingValues(
    variableSlot: string,
    keys: string[]
  ): Promise<{ [key: string]: number | string }[] | string | number> {
    return this.readMappingFromStorage(
      this.slotStructure[variableSlot]?.variableSlot[0],
      variableSlot,
      keys
    );
  }

  /**
   * Retrieves values from an array storage based on the specified variable slot and type.
   *
   * @param {string | number} variableSlot - The variable slot identifier or index used to locate the array in storage.
   * @param {string | undefined} type - The type of the array, or undefined to infer the type from the variable slot.
   * @returns {Promise<string[] | number[] | undefined>} A promise that resolves to an array of values from the array storage.
   */

  public async retrieveArrayValues(
    variableSlot: string | number,
    type?: string | undefined
  ) {
    return this.readArrayStorage(
      Number(variableSlot),
      type ?? this.slotStructure[variableSlot]?.variableSlot[0]
    );
  }
}
