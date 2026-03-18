'use client';

import { useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { Badge, Group, Stack, Text } from '@mantine/core';
import '@xyflow/react/dist/style.css';
import type { NetworkSnapshotNode } from '@/types';
import styles from './AccountChainFlow.module.css';

interface AccountChainFlowProps {
  nodes: NetworkSnapshotNode[];
}

// Node data type
interface ChainNodeData extends Record<string, unknown> {
  role: keyof typeof ROLE_STYLE;
  userId: string;
  email: string | null;
  metrics: { label: string; value: string }[];
}

// Role styles (Dark Mode)
const ROLE_STYLE = {
  current_user: { border: '#4dabf7', bg: '#1a1f2e', label: 'Bạn', miniColor: '#339af0' },
  upline: { border: '#51cf66', bg: '#1a2e1f', label: 'Upline', miniColor: '#51cf66' },
  direct_partner: { border: '#fcc419', bg: '#2e261a', label: 'Đại lý trực tiếp', miniColor: '#fcc419' },
  indirect_partner: { border: '#cc5de8', bg: '#2e1a2e', label: 'Đại lý gián tiếp', miniColor: '#cc5de8' },
};

const ROLE_MAP: Record<string, keyof typeof ROLE_STYLE> = {
  'You': 'current_user',
  'Upline': 'upline',
  'Direct Partner': 'direct_partner',
  'Indirect Partner': 'indirect_partner',
};

// Edge colour per source role
const EDGE_COLOUR: Record<string, string> = {
  current_user: '#4dabf7',
  upline: '#51cf66',
  direct_partner: '#fcc419',
  indirect_partner: '#cc5de8',
};

const ROLE_CLASS: Record<keyof typeof ROLE_STYLE, string> = {
  current_user: '',
  upline: styles.chainNodeUpline,
  direct_partner: styles.chainNodeDirect,
  indirect_partner: styles.chainNodeIndirect,
};

// Custom Node Component
function ChainNode({ data }: { data: ChainNodeData }) {
  const roleStyle = ROLE_STYLE[data.role];
  const roleClass = ROLE_CLASS[data.role];

  return (
    <div className={`${styles.chainNode} ${roleClass}`}>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={false}
        style={{ background: roleStyle.border, width: 8, height: 8 }}
      />

      <Stack gap={8}>
        <Text size="xs" fw={700} tt="uppercase" c={roleStyle.border}>
          {roleStyle.label}
        </Text>

        <Stack gap={4}>
          <Text size="xs" fw={600} c="#e9ecef">{data.userId}</Text>
          {data.role !== 'upline' && data.email && (
            <Text size="xs" c="#adb5bd">{data.email}</Text>
          )}
        </Stack>

        {data.role !== 'upline' && data.metrics.length > 0 && (
          <div className={styles.chainNodeMetrics}>
            {data.metrics.map((metric, idx) => (
              <div key={idx}>
                <Text size="xs" c="#adb5bd">{metric.label}</Text>
                <Text size="sm" fw={600} c="#f1f3f5">{metric.value}</Text>
              </div>
            ))}
          </div>
        )}
      </Stack>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={false}
        style={{ background: roleStyle.border, width: 8, height: 8 }}
      />
    </div>
  );
}

const nodeTypes = { chainNode: ChainNode };

// Layout using Dagre
function getLayoutedElements<TData extends Record<string, unknown>>(
  nodes: Node<TData>[],
  edges: Edge[]
): { nodes: Node<TData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 90 });
  nodes.forEach((n) => g.setNode(n.id, { width: 220, height: 200 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - 110, y: pos.y - 100 } };
    }),
    edges,
  };
}

function AccountChainFlowInner({ nodes: networkNodes }: AccountChainFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ChainNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const newNodes: Node<ChainNodeData>[] = networkNodes.map((n) => {
      const role = ROLE_MAP[n.role] ?? 'direct_partner';
      const metrics: { label: string; value: string }[] =
        role !== 'upline'
          ? [
              { label: 'Lots', value: n.total_lots.toLocaleString() },
              { label: 'Hoa hồng', value: `$${parseFloat(n.total_reward_usd.toPrecision(10))}` },
            ]
          : [];

      return {
        id: n.user_id,
        type: 'chainNode',
        position: { x: 0, y: 0 },
        data: { role, userId: n.user_id, email: n.email, metrics },
      };
    });

    // Build a user_id → role map for edge colouring
    const roleByUserId: Record<string, string> = {};
    networkNodes.forEach((n) => { roleByUserId[n.user_id] = ROLE_MAP[n.role] ?? 'direct_partner'; });

    const nodeIds = new Set(newNodes.map((n) => n.id));
    const newEdges: Edge[] = networkNodes
      .filter((n) => n.parent_user_id && nodeIds.has(n.parent_user_id) && nodeIds.has(n.user_id))
      .map((n) => {
        const sourceRole = roleByUserId[n.parent_user_id!] ?? 'direct_partner';
        const colour = EDGE_COLOUR[sourceRole] ?? '#888';
        return {
          id: `e-${n.parent_user_id}-${n.user_id}`,
          source: n.parent_user_id!,
          target: n.user_id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: colour, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: colour },
        };
      });

    const { nodes: laid, edges: laidEdges } = getLayoutedElements(newNodes, newEdges);
    setNodes(laid);
    setEdges(laidEdges);
  }, [networkNodes, setNodes, setEdges]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Group gap="md">
          {Object.entries(ROLE_STYLE).map(([key, s]) => (
            <Badge key={key} variant="dot" color={s.miniColor}>{s.label}</Badge>
          ))}
        </Group>
      </div>

      <div className={styles.flowContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} color="#3a3f4b" gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => ROLE_STYLE[node.data.role as keyof typeof ROLE_STYLE]?.miniColor ?? '#ccc'}
            maskColor="rgba(20, 25, 35, 0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function AccountChainFlow(props: AccountChainFlowProps) {
  return (
    <ReactFlowProvider>
      <AccountChainFlowInner {...props} />
    </ReactFlowProvider>
  );
}
