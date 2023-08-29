import {
  Button,
  Card,
  CardBody,
  Textarea,
  Text,
  Flex,
  Box,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import StorageLayoutParser, { DataType, SlotType } from "../components/Storage";
import { sampleContract } from "../data/data";
import { compile } from "../src/sol/compiler";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const [sourceCode, setSourceCode] = useState(sampleContract);
  const [byteCode, setByteCode] = useState("");
  const [abi, setAbi] = useState("");
  const [storageLayout, setStorageLayout] = useState<SlotType[]>();
  const [dataTypes, setDataTypes] = useState<Record<string, DataType>>();
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [methodIdentifiers, setMethodIdentifiers] = useState<any>();

  const compileSourceCode = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    button.disabled = true;
    compile(sourceCode)
      .then((contractData) => {
        const data = contractData[0];
        setByteCode(() => data.byteCode);
        setAbi(() => JSON.stringify(data.abi));
        setStorageLayout(data.storageLayout.storage);
        setDataTypes(data.storageLayout.types);
        visualizeStorageLayout(data.storageLayout);
        setMethodIdentifiers(data.evm.methodIdentifiers);
      })
      .catch((err) => {
        alert(err);
        console.error(err);
      })
      .finally(() => {
        button.disabled = false;
      });
  };
  const visualizeStorageLayout = (storageLayout: any) => {
    // Implement the logic to visualize the storage layout using a grid
    // For simplicity, we'll just highlight the first 4 storage slots (32 bytes each)
    const highlightedCells: number[] = [];
    for (let i = 0; i < 4; i++) {
      highlightedCells.push(i);
    }
    setHighlightedCells(highlightedCells);
  };

  console.log("storageLayout", storageLayout);
  console.log("dataTypes", dataTypes);
  const highlightedByteCode = () => {
    if (byteCode == null || !byteCode.length) {
      return;
    }
    let ByteCodeText = "";
    const data = (" " + byteCode).slice(1);
    const initCodeStart = "6080604052";
    const endOfInitCode = data.indexOf(initCodeStart, initCodeStart.length);
    const initCode = data.substring(0, endOfInitCode);
    console.log("inicode", initCode);
    ByteCodeText = `<span style="color:green">${initCode}</span>`;
    for (let i = endOfInitCode; i < data.length; ) {
      const len8 = data.substring(i, i + 8);
      if (Object.values(methodIdentifiers).includes(len8)) {
        ByteCodeText = `${ByteCodeText}<span style="color:blue">${len8}</span>`;
        i = i + 8;
      }
      ByteCodeText = `${ByteCodeText}${data[i]}`;
      i = i + 1;
    }

    return (
      <Box>
        <Text>ByteCode</Text>
        <Box maxW="350px" maxH={300} overflowY="auto">
          <div dangerouslySetInnerHTML={{ __html: ByteCodeText }} />
        </Box>
      </Box>
    );
  };
  return (
    <div>
      <Head>
        <title>EVM Slot Visualizer</title>
        <meta
          name="description"
          content="Compile solidity code on frontend with Next.js and Solc-js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Text className={styles.title}>EVM Slot Visualizer</Text>
      <Flex justifyContent="center" alignItems="center" flexDirection="column">
        <Flex mt="10px" maxW="900">
          <Flex justifyContent={"space-between"}>
            <Card>
              <CardBody>
                <Text>
                  {" "}
                  <span color="blue" />
                  Source Code
                </Text>
                <Textarea
                  rows={20}
                  cols={100}
                  onChange={(e) => setSourceCode(e.target.value)}
                  defaultValue={sourceCode}
                />
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={compileSourceCode}
                >
                  Compile
                </Button>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text>ABI</Text>
                <Textarea readOnly rows={10} cols={100} value={abi} />
                <Text>Compiled ByteCode</Text>
                <Textarea readOnly rows={10} cols={100} value={byteCode} />
                {highlightedByteCode()}
              </CardBody>
            </Card>
          </Flex>
        </Flex>
        <Flex mt="10px" maxW="900">
          {storageLayout != null && !!dataTypes && (
            <>
              <StorageLayoutParser
                storageLayout={storageLayout}
                types={dataTypes}
                methodIdentifiers={methodIdentifiers}
              />
            </>
          )}
          {methodIdentifiers && (
            <Box>
              <Grid
                templateColumns="repeat(2, 1fr)"
                gap={1}
                mb={4}
                style={{ border: "0.5px solid black" }}
              >
                <GridItem w="100%" h="8" borderRight="1px solid black">
                  <Text>Method</Text>
                </GridItem>
                <GridItem w="100%" h="8" borderRight="1px solid black">
                  <Text>Selector</Text>
                </GridItem>
              </Grid>
              {Object.keys(methodIdentifiers).map((key, i) => {
                return (
                  <Grid
                    templateColumns="repeat(2, 1fr)"
                    gap={1}
                    mb={4}
                    style={{ border: "0.5px solid black" }}
                    key={i}
                  >
                    <GridItem w="100%" h="8" borderRight="1px solid black">
                      <Text>{key}</Text>
                    </GridItem>
                    <GridItem w="100%" h="8" borderRight="1px solid black">
                      <Text>{methodIdentifiers[key]}</Text>
                    </GridItem>
                  </Grid>
                );
              })}
            </Box>
          )}
        </Flex>
      </Flex>
    </div>
  );
};

export default Home;
