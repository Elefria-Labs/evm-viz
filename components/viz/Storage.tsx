// src/StorageLayoutParser.tsx
import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

// src/types.ts
export interface StorageLayoutEntry {
  slot: string;
  label: string;
  offset: number;
  size: number;
}

export interface StorageLayoutParserProps {
  storageLayout: SlotType[];
  types: Record<string, DataType>;
  methodIdentifiers: any;
}
export type SlotType = {
  contract: string;
  label: string;
  type: string;
  offset: number;
  slot: string;
};
export type DataType = {
  base?: string;
  encoding: string;
  label: string;
  numberOfBytes: string;
};
const StorageLayoutParser: React.FC<StorageLayoutParserProps> = ({
  storageLayout,
  types,
  methodIdentifiers,
}) => {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);

  const handleCellHover = (label: string | null) => {
    setSelectedVariable(label);
  };

  const createStorageLayout = (
    slots: SlotType[]
  ): Record<string, SlotType[]> => {
    const slotMap: Record<string, SlotType[]> = {};
    if (slots.length == 0) {
      return slotMap;
    }

    for (let i = 0; i < slots.length; ++i) {
      const currentSlot = slots[i];
      if (slotMap[currentSlot.slot] != null) {
        const singleSlot = slotMap[currentSlot.slot];
        singleSlot && singleSlot.push(currentSlot);
        continue;
      }
      const singleSlot = new Array<SlotType>();
      singleSlot.push(currentSlot);
      slotMap[currentSlot.slot] = singleSlot;
    }

    return slotMap;
  };

  const [slotMap, setSlotMap] = useState<Record<string, SlotType[]>>(
    createStorageLayout(storageLayout)
  );
  useEffect(() => {});
  console.log("slotMap", slotMap);

  const RenderSlotMap = (slotNumber: string) => {
    const items: any = [];

    slotMap[slotNumber]?.map((slot: SlotType, j) => {
      const numBytes = Number(types[slot.type].numberOfBytes) / 8;

      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(
        16
      )}`;

      // const colors = generateShades()?.[0];
      for (let i = 0; i < numBytes; ++i) {
        items.push(
          <Tooltip label={slot.label} aria-label={slot.label}>
            <GridItem
              w="100%"
              h="8"
              bg="gray.400"
              key={i}
              style={{
                borderRadius: 10,
                alignContent: "center",
                justifyContent: "center",
              }}
              //onMouseEnter={() => handleCellHover(slot.label)}
              //onMouseLeave={() => handleCellHover(null)}
            ></GridItem>
          </Tooltip>
        );
      }
      return items;
    });

    if (items.length < 4) {
      for (let i = 0; i <= 4 - items.length; ++i) {
        items.push(
          <GridItem
            w="100%"
            h="8"
            bg="gray.800"
            key={i}
            style={{
              borderRadius: 10,
              alignContent: "center",
              justifyContent: "center",
            }}
            // onMouseEnter={() => handleCellHover(slot.label)}
            //onMouseLeave={() => handleCellHover(null)}
          >
            {/* {slot.label} {types[slot.type].numberOfBytes} */}
          </GridItem>
        );
      }
    }
    return items.map((item: any) => item);
  };
  console.log("methodIdentifiers", methodIdentifiers);
  return (
    <Box>
      <Grid templateColumns="repeat(3, 1fr)" gap={1} mb={4}>
        <GridItem w="100%" h="8">
          <Text>*Each box represent 8 bytes.</Text>
        </GridItem>
        <GridItem
          w="100%"
          h="8"
          bg="gray.400"
          style={{ borderRadius: 10, borderRightWidth: "2px" }}
        >
          <Text>Occupied</Text>
        </GridItem>
        <GridItem
          w="100%"
          h="8"
          bg="gray.800"
          style={{ borderRadius: 10, borderRightWidth: "2px", color: "white" }}
        >
          <Text>Unoccupied</Text>
        </GridItem>
      </Grid>
      <Box p={8}>
        <Grid
          templateColumns="repeat(6, 1fr)"
          gap={1}
          mb={4}
          style={{ border: "0.5px solid black" }}
        >
          <GridItem w="100%" h="8" borderRight="1px solid black">
            <Text>Slot Number</Text>
          </GridItem>
          <GridItem w="100%" h="8" borderRight="1px solid black">
            <Text>Single/Packed</Text>
          </GridItem>
          <GridItem w="100%" h="8">
            Slots
          </GridItem>
        </Grid>
        {Object.keys(slotMap).map((slotNumber, i) => (
          <Grid key={i} templateColumns="repeat(6, 0.5fr)" gap={2} mb={4}>
            <GridItem
              w="100%"
              h="8"
              key={i}
              style={{ borderRadius: 10, borderRightWidth: "1px" }}
            >
              <Text>Slot: {slotNumber}</Text>
            </GridItem>
            <GridItem
              w="100%"
              h="8"
              key={i}
              style={{ borderRadius: 10, borderRightWidth: "2px" }}
            >
              <Text>
                {slotMap[slotNumber]?.length == 1
                  ? "Single"
                  : `Packed(${slotMap[slotNumber]?.length})`}
              </Text>
            </GridItem>
            {RenderSlotMap(slotNumber)}
          </Grid>
        ))}
      </Box>
      <div className="hover-popover">{selectedVariable}</div>
    </Box>
  );
};

export default StorageLayoutParser;

function generateShades() {
  var numOfShades = 20; // Set here the Desired number of Shades
  var hue = 164; // The Select Value: 0->360
  const colors = [];
  //createSPAN("hsl(" + hue + ", 100%, 50%)"); // Create The selected color!
  function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  for (var i = 0; i < numOfShades; i++) {
    // Create shades!
    let hsl = "hsl(" + hue + ", " + rand(10, 90) + "%, " + rand(10, 90) + "%)";
    colors.push(hsl);
  }
  return colors;
}
