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
  const [show, setShow] = useState(false);

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
                          <Heading size={"md"} mb={4}>
                            Source Code
                          </Heading>
                          <Textarea
                            rows={20}
                            cols={100}
                            onChange={(e) => setSourceCode(e.target.value)}
                            defaultValue={sourceCode}
                          />
                          <Button
                            colorScheme="teal"
                            size="sm"
                            my="4px"
                            onClick={compileSourceCode}
                          >
                            Compile
                          </Button>
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
                            {highlightedByteCode()}
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
                                <StorageLayoutParser
                                  storageLayout={storageLayout}
                                  types={dataTypes}
                                  methodIdentifiers={methodIdentifiers}
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
