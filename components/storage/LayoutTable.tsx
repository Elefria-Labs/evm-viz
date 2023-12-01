import {
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  useDisclosure,
  Button,
} from "@chakra-ui/react";
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { DataType, SlotType } from "../viz/Storage";
import React, { useEffect, useRef, useState } from "react";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";

import { isArray } from "lodash";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from "@chakra-ui/react";
import { ObjectTypeView } from "./ObjectTypeView";

type LayoutTablePropsType = {
  storageLayout: SlotType[];
  types: Record<string, DataType>;
  slotValues: any[];
};
export function LayoutTable(props: LayoutTablePropsType) {
  const { storageLayout, types, slotValues } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [flatSlotValues, setFlatSlotValues] = useState([]);
  useEffect(() => {
    if (slotValues == null || slotValues.length == 0) {
      return;
    }
    setFlatSlotValues(
      slotValues.reduce((prev, curr) => {
        if (isArray(curr)) return [...prev, ...curr];
        return [...prev, curr];
      }, [])
    );
  }, [slotValues]);
  return (
    <>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Label</Th>
              <Th>Slot (Offset)</Th>
              <Th>Type (size in bytes)</Th>
              <Th>Slot Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {storageLayout.map((slot, i: number) => (
              <Tr key={`slot-${i}`}>
                <Td>{slot.label}</Td>
                <Td>
                  {slot.slot}
                  {slot.offset != 0 && ` (${slot.offset})`}
                </Td>
                <Td>{`${types[slot.type].label} (${
                  types[slot.type].numberOfBytes
                })`}</Td>
                <Td>
                  {typeof flatSlotValues[i] == "object" ? (
                    <Button onClick={onOpen}>View</Button>
                  ) : (
                    flatSlotValues[i]
                  )}
                </Td>
                <ObjectTypeView flatSlotValue={flatSlotValues[i]} />
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
