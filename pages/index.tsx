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
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Container,
  Input,
  Checkbox,
  Select,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { GlobalHeader } from "../components/common/global-header";
import { PageWrapper } from "../components/common/page-wrapper";
import { Footer } from "../components/footer";
import StorageLayoutParser, {
  DataType,
  SlotType,
} from "../components/viz/Storage";
import { readNonPrimaryDataType } from "../components/viz/utils";
import { sampleContract2 } from "../data/data";
import { compile } from "../src/sol/compiler";
import styles from "../styles/Home.module.css";
import { SupportedChains } from "../config/constants";
import { StorageLayout } from "../components/storage/StorageLayout";

const Home: NextPage = () => {
  const [sourceCode, setSourceCode] = useState(sampleContract2);
  const [byteCode, setByteCode] = useState("");
  const [abi, setAbi] = useState("");
  const [smartContractAddr, setSmartContractAddr] = useState<string>("");
  const [useOnChainAddr, setUseOnChainAddr] = useState<boolean>(false);
  const [storageLayout, setStorageLayout] = useState<SlotType[]>();
  const [dataTypes, setDataTypes] = useState<Record<string, DataType>>();
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [methodIdentifiers, setMethodIdentifiers] = useState<any>();
  const [slotValues, setSlotValues] = useState<any[]>();
  const [show, setShow] = useState(false);

  const compileSourceCode = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    button.disabled = true;
    compile(sourceCode)
      .then(async (contractData) => {
        const data = contractData[0];
        setByteCode(() => data.byteCode);
        setAbi(() => JSON.stringify(data.abi));
        setStorageLayout(data.storageLayout.storage);
        setDataTypes(data.storageLayout.types);
        await visualizeStorageLayout(
          data.storageLayout,
          data.storageLayout.types
        );
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
  const visualizeStorageLayout = async (
    storageLayout: any,
    dataTypes: Record<string, DataType>
  ) => {
    const data = await readNonPrimaryDataType(
      storageLayout.storage,
      "test",
      dataTypes
    );
    setSlotValues(data);
    console.log("readNonPrimaryDataType", data);
  };

  console.log("storageLayout", storageLayout);
  console.log("dataTypes", dataTypes);
  const onSmartContractAddr = (value: string) => {
    setSmartContractAddr(value);
  };
  const highlightedByteCode = () => {
    if (byteCode == null || !byteCode.length) {
      return;
    }
    let ByteCodeText = "";
    const data = (" " + byteCode).slice(1);
    const initCodeStart = "6080604052";
    const endOfInitCode = data.indexOf(initCodeStart, initCodeStart.length);
    const initCode = data.substring(0, endOfInitCode);
    ByteCodeText = `<span style="color:green">${initCode}</span>`;
    console.log("methodIdentifiers", methodIdentifiers);
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
        <Box maxH={300} overflowY="auto">
          <div dangerouslySetInnerHTML={{ __html: ByteCodeText }} />
        </Box>
      </Box>
    );
  };
  return (
    <div style={{ paddingLeft: "0px", paddingTop: "0px" }}>
      <PageWrapper>
        <GlobalHeader variant={"transparent"} />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          // TODO
          minH="94vh"
        >
          <Box display="flex" flexDirection="column" flex="1">
            <Container maxW="container.lg">
              <div>
                <Head>
                  <title>EVM Slot Visualizer</title>
                  <meta
                    name="description"
                    content="Compile solidity code on frontend with Next.js and Solc-js"
                  />
                  <link rel="icon" href="/favicon.ico" />
                </Head>
                <Heading size={"md"} mb={4}>
                  EVM Slot Visualizer
                </Heading>
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                >
                  <Flex mt="10px" maxW="900" flexDirection="column">
                    <Flex>
                      <Card>
                        <CardBody>
                          <Flex flexDirection={"column"}>
                            <Heading size={"md"} mb={4}>
                              Source Code
                            </Heading>
                            <Textarea
                              rows={20}
                              cols={100}
                              onChange={(e) => setSourceCode(e.target.value)}
                              defaultValue={sourceCode}
                            />
                            <Checkbox
                              my={2}
                              onChange={(e) =>
                                setUseOnChainAddr(e.target.checked)
                              }
                            >
                              Use on-chain address
                            </Checkbox>
                            {useOnChainAddr && (
                              <Input
                                mb={2}
                                onChange={(e) =>
                                  onSmartContractAddr(e.target.value)
                                }
                                placeholder="0xaaad12312....."
                              />
                            )}
                            <Flex>
                              <Select
                                placeholder="Select option"
                                w={240}
                                mr={8}
                                defaultValue={80_001}
                              >
                                {SupportedChains.map((chain) => (
                                  <option value={chain.id} key={chain.id}>
                                    {chain.name}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                colorScheme="teal"
                                size="sm"
                                my="4px"
                                onClick={compileSourceCode}
                              >
                                Compile
                              </Button>
                            </Flex>
                          </Flex>
                        </CardBody>
                      </Card>
                    </Flex>
                    {abi && (
                      <Accordion defaultIndex={[1]} allowMultiple>
                        <AccordionItem>
                          <AccordionButton>
                            <Box
                              as="span"
                              flex="1"
                              textAlign="left"
                              color="black"
                            >
                              <Heading size={"md"} mb={4}>
                                ABI
                              </Heading>
                            </Box>
                            <AccordionIcon color={"black"} />
                          </AccordionButton>

                          <AccordionPanel pb={4}>
                            <Textarea
                              readOnly
                              rows={10}
                              cols={100}
                              value={abi}
                            />
                          </AccordionPanel>
                        </AccordionItem>

                        <AccordionItem>
                          <AccordionButton>
                            <Box
                              as="span"
                              flex="1"
                              textAlign="left"
                              color="black"
                            >
                              <Heading size={"md"} mb={4}>
                                Bytecode
                              </Heading>
                            </Box>
                            <AccordionIcon color={"black"} />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <Text color="green">*represents init bytecode</Text>
                            <Text color="blue" mb={4}>
                              *represents method selectors
                            </Text>
                            {methodIdentifiers != null && highlightedByteCode()}
                          </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                          <AccordionButton>
                            <Box
                              as="span"
                              flex="1"
                              textAlign="left"
                              color="black"
                            >
                              <Heading size={"md"} mb={4}>
                                Storage Layout
                              </Heading>
                            </Box>
                            <AccordionIcon color={"black"} />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            {storageLayout != null && !!dataTypes && (
                              <>
                                {/* <StorageLayoutParser
                                  storageLayout={storageLayout}
                                  types={dataTypes}
                                  methodIdentifiers={methodIdentifiers}
                                /> */}
                                <StorageLayout
                                  storageLayout={storageLayout}
                                  types={dataTypes}
                                  slotValues={slotValues}
                                />
                              </>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                          <AccordionButton>
                            <Box
                              as="span"
                              flex="1"
                              textAlign="left"
                              color="black"
                            >
                              <Heading size={"md"} mb={4}>
                                Method Selectors
                              </Heading>
                            </Box>
                            <AccordionIcon color={"black"} />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            {methodIdentifiers && (
                              <Box>
                                <Grid
                                  templateColumns="repeat(2, 1fr)"
                                  gap={1}
                                  mb={4}
                                  style={{ border: "0.5px solid black" }}
                                >
                                  <GridItem
                                    w="100%"
                                    h="8"
                                    borderRight="1px solid black"
                                  >
                                    <Text>Method</Text>
                                  </GridItem>
                                  <GridItem
                                    w="100%"
                                    h="8"
                                    borderRight="1px solid black"
                                  >
                                    <Text>Selector</Text>
                                  </GridItem>
                                </Grid>
                                {Object.keys(methodIdentifiers).map(
                                  (key, i) => {
                                    return (
                                      <Grid
                                        templateColumns="repeat(2, 1fr)"
                                        gap={1}
                                        mb={4}
                                        style={{ border: "0.5px solid black" }}
                                        key={i}
                                      >
                                        <GridItem
                                          w="100%"
                                          h="8"
                                          borderRight="1px solid black"
                                        >
                                          <Text>{key}</Text>
                                        </GridItem>
                                        <GridItem
                                          w="100%"
                                          h="8"
                                          borderRight="1px solid black"
                                        >
                                          <Text>{methodIdentifiers[key]}</Text>
                                        </GridItem>
                                      </Grid>
                                    );
                                  }
                                )}
                              </Box>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </Flex>
                  <Flex mt="10px" maxW="900"></Flex>
                </Flex>
              </div>
            </Container>
          </Box>
          <Footer />
        </Box>
      </PageWrapper>
    </div>
  );
};

export default Home;
