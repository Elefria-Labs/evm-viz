import { Tabs, TabList, Tab, TabPanel, TabPanels } from "@chakra-ui/react";
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

type LayoutTablePropsType = {
  storageLayout: SlotType[];
  types: Record<string, DataType>;
};
export function LayoutTable(props: LayoutTablePropsType) {
  console.log("props......", props);
  const { storageLayout, types } = props;
  return (
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Label</Th>
            <Th>Slot (Offset)</Th>
            <Th>Type (size in bytes)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {storageLayout.map((slot) => (
            <Tr>
              <Td>{slot.label}</Td>
              <Td>{`${slot.slot}(${slot.offset})`}</Td>
              <Td>{`${types[slot.type].label} (${
                types[slot.type].numberOfBytes
              })`}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
