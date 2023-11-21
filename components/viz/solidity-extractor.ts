import { Network, Alchemy } from "alchemy-sdk";
import { Eip1193Provider, ethers } from "ethers";
import Web3 from "Web3";
import { solidityDataTypes } from "../../config/constants";
import { DataType, SlotType } from "./Storage";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

class ContractHelperBase {
  protected contractAddress: string;
  protected alchemyConfig: { apiKey: string; network: Network };
  protected settings: { apiKey: string; network: Network };
  protected ethweb3: Web3;
  protected alchemy: Alchemy;
  protected defaultProvider: any;
  protected providerUrl: string | undefined;

  constructor(
    contractAddress: string,
    alchemyConfig: { apiKey: string; network: Network },
    providerUrl?: string | undefined
  ) {
    this.contractAddress = contractAddress;
    this.alchemyConfig = alchemyConfig;
    this.settings = {
      apiKey: alchemyConfig.apiKey,
      network: alchemyConfig.network,
    };
    this.defaultProvider =
      providerUrl && new Web3.providers.HttpProvider(providerUrl as string);
    this.ethweb3 = new Web3(
      providerUrl
        ? this.defaultProvider
        : `https://${alchemyConfig.network}.g.alchemy.com/v2/${alchemyConfig.apiKey}`
    );
    this.alchemy = new Alchemy(this.settings);
  }

  getContractStorage() {
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

      // const data = await provider?.getStorage(
      //   "0x7706566ACc3091911fc7da2EaBDD06116038AD6a",
      //   position
      // );
      // console.log("data", data);
    }
  }

  public convertToNumber(value: string): number {
    return this.ethweb3?.utils?.hexToNumber(value) as number;
  }

  public getSlotAddress(mappingType: string[], key: string[]): string {
    return Web3.utils.soliditySha3(
      this.ethweb3.eth.abi.encodeParameters(mappingType, key)
    ) as string;
  }

  public convertToString(value: string): string {
    return this.ethweb3.utils.hexToString(value)?.split("\u0000")?.[0] || "";
  }

  public convertValue(value: string, type: string): string | number {
    if (type.includes("string") || type.includes("bytes"))
      return this.convertToString(value);
    if (type.includes("uint"))
      return this.convertToNumber(value) as unknown as number;
    return "";
  }

  public getNextAddress(currentAddress: string, move: number = 1): string {
    const currentAddressNumber = BigInt(currentAddress);
    const nextAddressNumber = currentAddressNumber + BigInt(move);
    const nextAddress = "0x" + nextAddressNumber.toString(16);
    return nextAddress;
  }

  protected async resolveArrayPromises(array: Promise<any>[]): Promise<any[]> {
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

  public async getValueAtSlotAddressForArray(address: string): Promise<number> {
    const arraySlotValue = await this.getStorageAtSpecificSlot(address);
    return this.convertToNumber(arraySlotValue);
  }

  public async getStorageAtSpecificSlot(
    slotAddress: string | number
  ): Promise<string> {
    return this.defaultProvider
      ? this.getContractStorage()?.provider?.getStorage(
          this.contractAddress,
          slotAddress
        )
      : this.alchemy.core.getStorageAt(this.contractAddress, slotAddress);
  }

  public getValue(currentType, currentTypeData) {
    if (currentType.includes("mapping")) return "";
    if (currentType.includes("address")) return currentTypeData;
    else if (currentType.includes("string") || currentType.includes("bytes"))
      return this.convertToString?.(currentTypeData);
    else if (currentType.includes("uint"))
      return this.convertToNumber?.(currentTypeData);
  }

  public async getPackedStorageValuesAtSpecificSlot(
    slotPosition: string,
    types: string[]
  ): Promise<(string | number)[]> {
    console.log("Web3.utils", Web3.utils.toHex(slotPosition));
    const storageData = await this.getStorageAtSpecificSlot(
      Number(slotPosition)
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
}

export class MappingValues extends ContractHelperBase {
  async getMappingValues(
    mappingStructure: string,
    variableSlot: string,
    keys: string[],
    dataTypes: Record<string, any> = {}
  ): Promise<any[]> {
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
          ? this.getSlotAddress(
              [mappingType, "uint256"],
              [keys[keysIndex], currentSlot]
            )
          : this.getSlotAddress(
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
      const structDataType =
        dataTypes[splitValue?.[splitValue?.length - 1]?.split("))")?.[0]]
          ?.members;

      if (structDataType?.length > 1) {
        const structValue: any[] = [];
        for (let i = 0; i < structDataType.length; i++) {
          if (
            ["t_string_storage", "t_uint256"].includes(structDataType[i]?.type)
          ) {
            const data = await this.getStorageAtSpecificSlot(currentSlot);
            structValue.push({
              label: structDataType[i]?.label,
              value: this.convertValue(data, structDataType[i]?.type),
            });

            if (i < structDataType.length - 1) {
              currentSlot = this.getNextAddress(currentSlot);
            }
          }
        }
        return structValue;
      }
    }

    return []; // Handle other cases if needed
  }
}

class ArrayValues extends ContractHelperBase {
  async getArrayValues(variableSlot, type) {
    const nestedArrayLength = type
      ?.split("(")
      ?.filter((val) => val === "t_array")?.length;
    const arrayLength = this.convertToNumber(
      await this.getStorageAtSpecificSlot(variableSlot)
    );

    if (nestedArrayLength > 1) {
      return this.getNestedArrayValues(
        "array",
        variableSlot,
        nestedArrayLength - 1
      );
    } else {
      const currentVariableSlot = variableSlot;
      const arrayData = await Promise.all(
        Array.from({ length: arrayLength }, async (_, i) => {
          const valueAtSlot = await this.getValueAtSlotAddressForArray(
            currentVariableSlot
          );
          return valueAtSlot;
        })
      );
      return this.resolveArrayPromises(arrayData as unknown as Promise<any>[]);
    }
  }

  async getNestedArrayValues(
    type: string,
    variableSlot: string,
    nestedArrayLength: number
  ): Promise<(string | number)[][]> {
    const arrayLength = this.convertToNumber(
      await this.getStorageAtSpecificSlot(variableSlot)
    );

    if (arrayLength < 1) return [];
    let currentVariableSlot = Web3.utils.soliditySha3(
      this.ethweb3.eth.abi.encodeParameter("uint256", variableSlot)
    );

    if (nestedArrayLength > 0) {
      let arrayValue: any[] = [];
      for (let i = 0; i < arrayLength; i++) {
        arrayValue[i] = this.getNestedArrayValues(
          type,
          currentVariableSlot as string,
          nestedArrayLength - 1
        );

        currentVariableSlot = this.getNextAddress(
          currentVariableSlot as string
        );
      }
      return this.resolveArrayPromises(arrayValue);
    } else {
      const arrayLength = this.convertToNumber(
        await this.getStorageAtSpecificSlot(variableSlot)
      );
      if (!arrayLength) return [];
      let arrayData: (number | bigint)[] = [];
      for (let i = 0; i < arrayLength; i++) {
        const valueAtSlot: number | bigint =
          await this.getValueAtSlotAddressForArray(
            currentVariableSlot as string
          );
        arrayData.push(valueAtSlot);
        currentVariableSlot = this.getNextAddress(
          currentVariableSlot as string
        );
      }
      return this.resolveArrayPromises(
        arrayData as unknown as Promise<number | BigInt>[]
      );
    }
  }
}

export class SolidityExtractor extends ContractHelperBase {
  private mappingValues: MappingValues;
  private arrayValues: ArrayValues;
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
    super(contractAddress, alchemyConfig, providerUrl);
    this.mappingValues = new MappingValues(contractAddress, alchemyConfig);
    this.arrayValues = new ArrayValues(contractAddress, alchemyConfig);
    this.storageLayout = storageLayout;
    this.dataTypes = dataTypes;
    this.slotStructure = storageLayout?.reduce((acc, curr) => {
      if (!acc?.[curr.slot]) acc[curr.slot] = { variableSlot: [] };
      acc[curr.slot]?.variableSlot?.push(curr.type);
      return acc;
    }, {});
  }

  public async getAllSlotValues() {
    const slotValues = Object.keys(this.slotStructure)?.map(async (slot) => {
      const currentVariableSlot = this.slotStructure?.[slot]?.variableSlot;
      if (currentVariableSlot?.length > 1) {
        return await this.getPackedStorageValuesAtSpecificSlot(
          slot,
          this.slotStructure?.[slot].variableSlot
        );
      } else if (
        currentVariableSlot?.length === 1 &&
        currentVariableSlot?.[0]?.includes("array")
      ) {
        return await this.getArrayValues(slot, currentVariableSlot?.[0]);
      } else {
        const value = await this.getStorageAtSpecificSlot(Number(slot));
        return this.getValue(currentVariableSlot?.[0], value);
      }
    });
    return this.resolveArrayPromises(slotValues as unknown as Promise<any>[]);
  }

  public async getMappingValues(
    variableSlot: string,
    keys: string[]
  ): Promise<{ [key: string]: number | string }[]> {
    return this.mappingValues.getMappingValues(
      this.slotStructure[variableSlot]?.variableSlot[0],
      variableSlot,
      keys,
      this.dataTypes
    );
  }

  public async getArrayValues(
    variableSlot: string | number,
    type?: string | undefined
  ): Promise<number[] | string[]> {
    return this.arrayValues.getArrayValues(
      Number(variableSlot),
      type ?? this.slotStructure[variableSlot]?.variableSlot[0]
    );
  }
}
