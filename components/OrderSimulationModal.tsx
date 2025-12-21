'use client';

import { Modal, ScrollArea } from '@mantine/core';
import { OrderSimulationTable } from './OrderSimulationTable';

interface OrderSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationData: {
    initialLot: number;
    nextLot: number;
    dcaType: 'add' | 'multiply';
    maxOrders: number;
    dcaDistance: number;
    currencyPair: string;
  };
}

export function OrderSimulationModal({ isOpen, onClose, simulationData }: OrderSimulationModalProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Order Simulation"
      size="lg"
      centered
    >
      <ScrollArea h={600}>
        <OrderSimulationTable
          initialLot={simulationData.initialLot}
          nextLot={simulationData.nextLot}
          dcaType={simulationData.dcaType}
          maxOrders={simulationData.maxOrders}
          dcaDistance={simulationData.dcaDistance}
          currencyPair={simulationData.currencyPair}
        />
      </ScrollArea>
    </Modal>
  );
}
