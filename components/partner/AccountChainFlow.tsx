'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { Badge, Group, Stack, Text, Button } from '@mantine/core';
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

// Role styles (Dark Mode)
const ROLE_STYLE = {
  current_user: { border: '#4dabf7', bg: '#1a1f2e', label: 'You', miniColor: '#339af0' },
  upline: { border: '#51cf66', bg: '#1a2e1f', label: 'Upline', miniColor: '#51cf66' },
  direct_partner: { border: '#fcc419', bg: '#2e261a', label: 'Direct Partner', miniColor: '#fcc419' },
  indirect_partner: { border: '#cc5de8', bg: '#2e1a2e', label: 'Indirect Partner', miniColor: '#cc5de8' },
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

// Custom Node Component
function ChainNode({ data }: { data: any }) {
  const roleStyle = ROLE_STYLE[data.role as keyof typeof ROLE_STYLE];

  return (
    <div
      style={{
        width: 220,
        border: `2px solid ${roleStyle.border}`,
        backgroundColor: roleStyle.bg,
        borderRadius: 8,
        padding: 12,
        position: 'relative',
      }}
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
          <Badge size="xs" color={RANK_COLOURS[data.rank as keyof typeof RANK_COLOURS] || 'dark'}>
            {data.rank}
          </Badge>
        </Group>

        <Stack gap={4}>
          <Text size="xs" fw={600} c="#e9ecef">{data.userId}</Text>
          <Text size="xs" c="#adb5bd">{data.email}</Text>
        </Stack>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {data.metrics.map((metric: { label: string; value: string }, idx: number) => (
            <div key={idx}>
              <Text size="xs" c="#adb5bd">{metric.label}</Text>
              <Text size="sm" fw={600} c="#f1f3f5">{metric.value}</Text>
            </div>
          ))}
        </div>
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
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build nodes and edges
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 1. Add upline chain nodes
    if (referralChain && referralChain.chain) {
      referralChain.chain.forEach((member) => {
        const isCurrentUser = member.userId === userId;
        const role = isCurrentUser ? 'current_user' : 'upline';

        let metrics = [];
        if (isCurrentUser && userRank) {
          const totalFromChain = partnerTree.reduce((sum, p) => sum + p.total_reward, 0);
          metrics = [
            { label: 'Keep %', value: `${userRank.reward_percentage}%` },
            { label: ' Upline %', value: `${100 - userRank.reward_percentage}%` },
            { label: 'Own Keep', value: `$${(exnessTotals.reward_usd * (userRank.reward_percentage / 100)).toFixed(2)}` },
            { label: ' From Chain', value: `$${totalFromChain.toFixed(2)}` },
          ];
        } else {
          metrics = [
            { label: 'Keep %', value: '' },
            { label: ' Upline %', value: '' },
            { label: 'Lots', value: '' },
            { label: 'Reward', value: '' },
          ];
        }

        newNodes.push({
          id: member.userId,
          type: 'chainNode',
          position: { x: 0, y: 0 },
          data: {
            role,
            userId: member.userId,
            email: member.email,
            rank: member.partnerRank,
            metrics,
          },
        });
      });
    }

    // 2. Add partner tree nodes
    partnerTree.forEach((partner) => {
      if (partner.partner_rank === 'None') return; // Skip non-partners

      const isDirectPartner = partner.parentUserId === userId;
      const role = isDirectPartner ? 'direct_partner' : 'indirect_partner';

      const metrics = [
        { label: 'Keep %', value: `${partner.reward_percentage}%` },
        { label: ' Upline %', value: `${(100 - partner.reward_percentage)}%` },
        { label: 'Lots', value: partner.total_lots.toFixed(2) },
        { label: 'Reward', value: `$${partner.total_reward.toFixed(2)}` },
      ];

      newNodes.push({
        id: partner.id,
        type: 'chainNode',
        position: { x: 0, y: 0 },
        data: {
          role,
          userId: partner.id,
          email: partner.email,
          rank: partner.partner_rank,
          metrics,
        },
      });
    });

    // 3. Create all edges AFTER all nodes are created
    // This ensures both source and target nodes exist
    const nodeIds = new Set(newNodes.map(n => n.id));
    
    // 3a. Add edges for referral chain
    if (referralChain && referralChain.chain && referralChain.chain.length > 1) {
      for (let idx = 1; idx < referralChain.chain.length; idx++) {
        const sourceMember = referralChain.chain[idx - 1];
        const targetMember = referralChain.chain[idx];
        
        // Only create edge if both nodes exist
        if (nodeIds.has(sourceMember.userId) && nodeIds.has(targetMember.userId)) {
          newEdges.push({
            id: `e-${sourceMember.userId}-${targetMember.userId}`,
            source: sourceMember.userId,
            target: targetMember.userId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'smoothstep',
            style: { stroke: '#adb5bd', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#adb5bd' },
          });
        }
      }
    }
    
    // Track existing edges to prevent duplicates
    const existingEdges = new Set(newEdges.map(e => `${e.source}-${e.target}`));
    
    // 3b. Add edges for partner tree (only if not already in referral chain)
    partnerTree.forEach((partner) => {
      if (partner.partner_rank === 'None') return; // Skip non-partners
      
      // Only create edge if both parent and child nodes exist
      if (partner.parentUserId && nodeIds.has(partner.parentUserId) && nodeIds.has(partner.id)) {
        const edgeKey = `${partner.parentUserId}-${partner.id}`;
        
        // Skip if this edge already exists (from referral chain)
        if (existingEdges.has(edgeKey)) {
          console.log('[AccountChainFlow] Skipping duplicate edge:', edgeKey);
          return;
        }
        
        const isDirectPartner = partner.parentUserId === userId;
        
        console.log('[AccountChainFlow] Adding partner tree edge:', {
          parent: partner.parentUserId,
          child: partner.id,
          email: partner.email,
        });
        
        newEdges.push({
          id: `e-${partner.parentUserId}-${partner.id}`,
          source: partner.parentUserId,
          target: partner.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: {
            stroke: isDirectPartner ? '#f59f00' : '#ae3ec9',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDirectPartner ? '#f59f00' : '#ae3ec9',
          },
        });
      }
    });

    // Debug logging
    console.log('[AccountChainFlow] Created nodes:', newNodes.length, newNodes.map(n => n.id));
    console.log('[AccountChainFlow] Referral chain:', referralChain?.chain?.map(m => m.userId));
    console.log('[AccountChainFlow] Partner tree:', partnerTree.map(p => ({ id: p.id, parent: p.parentUserId })));
    console.log('[AccountChainFlow] Created edges:', newEdges.length, newEdges.map(e => `${e.source}->${e.target}`));
    console.log('[AccountChainFlow] Node IDs set:', nodeIds);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
    
    console.log('[AccountChainFlow] Setting layouted nodes and edges');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [referralChain, partnerTree, userId, userRank, exnessTotals, setNodes, setEdges]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const csvRows = [
      ['type', 'user_id', 'email', 'partner_rank', 'reward_pct_keep_%', 'upline_share_pct_%', 'total_lots', 'total_reward_usd', 'parent_user_id', 'depth'],
    ];

    nodes.forEach((node) => {
      const data = node.data;
      csvRows.push([
        data.role,
        data.userId,
        data.email,
        data.rank,
        '', // Would need to extract from metrics
        '',
        '',
        '',
        '',
        '',
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-chain-flow.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Group gap="md">
          <Badge variant="dot" color={ROLE_STYLE.current_user.miniColor}>
            {ROLE_STYLE.current_user.label}
          </Badge>
          <Badge variant="dot" color={ROLE_STYLE.upline.miniColor}>
            {ROLE_STYLE.upline.label}
          </Badge>
          <Badge variant="dot" color={ROLE_STYLE.direct_partner.miniColor}>
            {ROLE_STYLE.direct_partner.label}
          </Badge>
          <Badge variant="dot" color={ROLE_STYLE.indirect_partner.miniColor}>
            {ROLE_STYLE.indirect_partner.label}
          </Badge>
          <Button size="xs" variant="outline" onClick={handleExportCSV}>
            Export CSV
          </Button>
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
          <Background variant="dots" color="#3a3f4b" gap={16} size={1} />
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
