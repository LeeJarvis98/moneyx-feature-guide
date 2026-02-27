'use client';

import { useEffect, type CSSProperties } from 'react';
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
import styles from './AccountChainFlow.module.css';

// Type definitions
interface ReferralChainMember {
  userId: string;
  email: string;
  partnerRank: string;
}

interface ReferralChain {
  userId: string;
  depth: number;
  directReferrerId: string | null;
  chain: ReferralChainMember[];
  chainLength: number;
}

interface PartnerTreeNode {
  id: string;
  email: string;
  partner_rank: string;
  reward_percentage: number;
  total_lots: number;
  total_reward: number;
  parentUserId: string;
  depth: number;
}

interface AccountChainFlowProps {
  referralChain: ReferralChain | null;
  partnerTree: PartnerTreeNode[];
  userId: string;
  userRank: { partner_rank: string; reward_percentage: number; lot_volume: number } | null;
  exnessTotals: { volume_lots: number; reward_usd: number };
}

// Node data type
interface ChainNodeData extends Record<string, unknown> {
  role: keyof typeof ROLE_STYLE;
  userId: string;
  email: string;
  rank: string;
  metrics: { label: string; value: string }[];
}

// Role styles (Dark Mode)
const ROLE_STYLE = {
  current_user: { border: '#4dabf7', bg: '#1a1f2e', label: 'Bạn', miniColor: '#339af0' },
  upline: { border: '#51cf66', bg: '#1a2e1f', label: 'Upline', miniColor: '#51cf66' },
  direct_partner: { border: '#fcc419', bg: '#2e261a', label: 'Đại lý trực tiếp', miniColor: '#fcc419' },
  indirect_partner: { border: '#cc5de8', bg: '#2e1a2e', label: 'Đại lý gián tiếp', miniColor: '#cc5de8' },
};

const RANK_COLOURS = {
  ADMIN: 'red',
  SALE: 'orange',
  'Kim Cương': 'blue',
  'Bạch Kim': 'cyan',
  'Vàng': 'yellow',
  'Bạc': 'gray',
  'Đồng': 'cyan',
  None: 'dark',
};

// Canonical keep percentages per rank (source: docs/VNCLC.md)
const RANK_KEEP_PCT: Record<string, number> = {
  'Kim Cương': 90,
  'Bạch Kim': 85,
  'Vàng': 80,
  'Bạc': 75,
  'Đồng': 70,
};

// Custom Node Component
function ChainNode({ data }: { data: ChainNodeData }) {
  const roleStyle = ROLE_STYLE[data.role];

  return (
    <div
      className={styles.chainNode}
      style={{ '--node-border': roleStyle.border, '--node-bg': roleStyle.bg } as CSSProperties}
    >
      {/* Handle for incoming connections (from above) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={true}
        style={{
          background: roleStyle.border,
          width: 8,
          height: 8,
        }}
      />

      <Stack gap={8}>
        <Group justify="space-between">
          <Text size="xs" fw={700} tt="uppercase" c={roleStyle.border}>
            {roleStyle.label}
          </Text>
          {!(data.role === 'upline' && (data.rank === 'ADMIN' || data.rank === 'SALE')) && (
            <Badge size="xs" color={RANK_COLOURS[data.rank as keyof typeof RANK_COLOURS] || 'dark'}>
              {data.rank}
            </Badge>
          )}
        </Group>

        <Stack gap={4}>
          <Text size="xs" fw={600} c="#e9ecef">{data.userId}</Text>
          {data.role !== 'upline' && (
            <Text size="xs" c="#adb5bd">{data.email}</Text>
          )}
        </Stack>

        {data.role !== 'upline' && (
          <div className={styles.chainNodeMetrics}>
            {data.metrics.map((metric: { label: string; value: string }, idx: number) => (
              <div key={idx}>
                <Text size="xs" c="#adb5bd">{metric.label}</Text>
                <Text size="sm" fw={600} c="#f1f3f5">{metric.value}</Text>
              </div>
            ))}
          </div>
        )}
      </Stack>

      {/* Handle for outgoing connections (to below) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        style={{
          background: roleStyle.border,
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}

const nodeTypes = {
  chainNode: ChainNode,
};

// Layout function using Dagre
function getLayoutedElements<TData extends Record<string, unknown>>(
  nodes: Node<TData>[],
  edges: Edge[]
): { nodes: Node<TData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 90 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 200 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 100,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function AccountChainFlowInner({
  referralChain,
  partnerTree,
  userId,
  userRank,
  exnessTotals,
}: AccountChainFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ChainNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Build nodes and edges
  useEffect(() => {
    const newNodes: Node<ChainNodeData>[] = [];
    const newEdges: Edge[] = [];

    // 1. Add current user node only
    if (referralChain && referralChain.chain) {
      const currentUserMember = referralChain.chain.find((m) => m.userId === userId);
      if (currentUserMember) {
        const totalFromChain = partnerTree
          .filter((p) => p.parentUserId === userId)
          .reduce((sum, p) => sum + p.total_reward, 0);
        const metrics = userRank
          ? [
              { label: '% Thưởng', value: `${userRank.reward_percentage}%` },
              { label: '% Hệ thống', value: `${100 - userRank.reward_percentage}%` },
            ]
          : [];

        newNodes.push({
          id: currentUserMember.userId,
          type: 'chainNode',
          position: { x: 0, y: 0 },
          data: {
            role: 'current_user',
            userId: currentUserMember.userId,
            email: currentUserMember.email,
            rank: currentUserMember.partnerRank,
            metrics,
          },
        });
      }
    }

    // 2. Add direct partner nodes only
    partnerTree.forEach((partner) => {
      if (partner.partner_rank === 'None') return; // Skip non-partners
      if (partner.parentUserId !== userId) return; // Skip indirect partners

      const keepPct = RANK_KEEP_PCT[partner.partner_rank] ?? partner.reward_percentage;
      const metrics = [
        { label: '% Thưởng', value: `${keepPct}%` },
        { label: '% Hệ thống', value: `${100 - keepPct}%` },
      ];

      newNodes.push({
        id: partner.id,
        type: 'chainNode',
        position: { x: 0, y: 0 },
        data: {
          role: 'direct_partner',
          userId: partner.id,
          email: partner.email,
          rank: partner.partner_rank,
          metrics,
        },
      });
    });

    // 3. Create edges from current user to direct partners
    const nodeIds = new Set(newNodes.map((n) => n.id));

    partnerTree.forEach((partner) => {
      if (partner.partner_rank === 'None') return;
      if (partner.parentUserId !== userId) return;
      if (!nodeIds.has(partner.id)) return;

      newEdges.push({
        id: `e-${userId}-${partner.id}`,
        source: userId,
        target: partner.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#f59f00', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59f00' },
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [referralChain, partnerTree, userId, userRank, exnessTotals, setNodes, setEdges]);

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ background: '#0d1117', borderBottom: '1px solid #1e2533' }}>
        <Group gap="md">
          <Badge variant="dot" color={ROLE_STYLE.current_user.miniColor}>
            {ROLE_STYLE.current_user.label}
          </Badge>
          <Badge variant="dot" color={ROLE_STYLE.direct_partner.miniColor}>
            {ROLE_STYLE.direct_partner.label}
          </Badge>
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
            nodeColor={(node) => {
              const role = node.data.role as keyof typeof ROLE_STYLE;
              return ROLE_STYLE[role]?.miniColor || '#ccc';
            }}
            maskColor="rgba(20, 25, 35, 0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrap with ReactFlowProvider for standalone use
export default function AccountChainFlow(props: AccountChainFlowProps) {
  return (
    <ReactFlowProvider>
      <AccountChainFlowInner {...props} />
    </ReactFlowProvider>
  );
}
