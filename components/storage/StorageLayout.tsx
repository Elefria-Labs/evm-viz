import { Tabs, TabList, Tab, TabPanel, TabPanels } from "@chakra-ui/react";
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from "@chakra-ui/react";
import { LayoutTable } from "./LayoutTable";
import { DataType, SlotType } from "../viz/Storage";

export type StorageLayoutPropsType = {
  storageLayout: SlotType[];
  types: Record<string, DataType>;
  slotValues: any[];
};
export function StorageLayout(props: StorageLayoutPropsType) {
  return (
    <Tabs>
      <TabList>
        <Tab>Layout</Tab>
        <Tab>Two</Tab>
        <Tab>Three</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <LayoutTable {...props} />
        </TabPanel>
        <TabPanel>
          <p>two!</p>
        </TabPanel>
        <TabPanel>
          <p>three!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
