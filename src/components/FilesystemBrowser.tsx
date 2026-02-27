'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, TreeView, TreeNode, InlineLoading } from '@carbon/react';
import * as i650Service from '@/lib/i650';

type FsNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: string[] | null;
  loading: boolean;
  error: string | null;
};

type FilesystemBrowserProps = {
  open: boolean;
  onRequestClose: () => void;
  onChoose: (path: string) => Promise<void> | void;
  rootPaths?: string[];
  acceptExtensions?: string[];
  modalHeading?: string;
};

const DEFAULT_ROOT_PATHS = ['/sw', '/tests', '/tmp'];
const DEFAULT_ACCEPT_EXTENSIONS = ['.dck', '.txt'];

function normalizeRootPath(path: string): string {
  if (!path) return '/';
  if (path === '/') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function getNodeName(path: string): string {
  if (path === '/') return '/';
  const segments = path.split('/').filter(Boolean);
  return segments.at(-1) ?? path;
}

export default function FilesystemBrowser({
  open,
  onRequestClose,
  onChoose,
  rootPaths = DEFAULT_ROOT_PATHS,
  acceptExtensions = DEFAULT_ACCEPT_EXTENSIONS,
  modalHeading = 'Choose file',
}: FilesystemBrowserProps) {
  const normalizedRoots = useMemo(
    () => Array.from(new Set(rootPaths.map(normalizeRootPath))),
    [rootPaths]
  );

  const [nodes, setNodes] = useState<Record<string, FsNode>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedExtensions = useMemo(
    () => acceptExtensions.map((ext) => ext.toLowerCase()),
    [acceptExtensions]
  );

  const isSupportedFile = useCallback((path: string): boolean => {
    if (normalizedExtensions.length === 0) return true;
    const lower = path.toLowerCase();
    return normalizedExtensions.some((ext) => lower.endsWith(ext));
  }, [normalizedExtensions]);

  const initializeRoots = useMemo(() => {
    const rootNodes: Record<string, FsNode> = {};
    for (const root of normalizedRoots) {
      rootNodes[root] = {
        name: getNodeName(root),
        path: root,
        isDirectory: true,
        children: null,
        loading: false,
        error: null,
      };
    }
    return rootNodes;
  }, [normalizedRoots]);

  const loadDirectory = useCallback(async (path: string): Promise<void> => {
    setNodes((prev) => ({
      ...prev,
      [path]: {
        ...(prev[path] ?? {
          name: getNodeName(path),
          path,
          isDirectory: true,
          children: null,
          loading: false,
          error: null,
        }),
        loading: true,
        error: null,
      },
    }));

    try {
      const entries = await i650Service.listFilesystemDirectory(path);
      const sorted = [...entries].sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setNodes((prev) => {
        const next = { ...prev };
        next[path] = {
          ...(next[path] ?? {
            name: getNodeName(path),
            path,
            isDirectory: true,
            children: null,
            loading: false,
            error: null,
          }),
          children: sorted.map((entry) => entry.path),
          loading: false,
          error: null,
        };

        for (const entry of sorted) {
          next[entry.path] = {
            name: entry.name,
            path: entry.path,
            isDirectory: entry.isDirectory,
            children: entry.isDirectory ? (next[entry.path]?.children ?? null) : [],
            loading: false,
            error: null,
          };
        }

        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load directory';
      setNodes((prev) => ({
        ...prev,
        [path]: {
          ...(prev[path] ?? {
            name: getNodeName(path),
            path,
            isDirectory: true,
            children: null,
            loading: false,
            error: null,
          }),
          loading: false,
          error: message,
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setNodes(initializeRoots);
    setSelectedPath(null);
    setErrorMessage(null);
    setExpanded(new Set());
  }, [initializeRoots, open]);

  const handleToggle = (path: string, isExpanded: boolean): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });

    if (!isExpanded && selectedPath && (selectedPath === path || selectedPath.startsWith(`${path}/`))) {
      setSelectedPath(null);
    }

    const node = nodes[path];
    if (isExpanded && node?.isDirectory && node.children === null && !node.loading) {
      void loadDirectory(path);
    }
  };

  const selectedNode = selectedPath ? nodes[selectedPath] : undefined;
  const canSubmit = Boolean(
    selectedNode && !selectedNode.isDirectory && isSupportedFile(selectedNode.path) && !busy
  );

  const handleSubmit = async (): Promise<void> => {
    if (!selectedNode || selectedNode.isDirectory || !isSupportedFile(selectedNode.path)) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await onChoose(selectedNode.path);
      onRequestClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to choose file');
    } finally {
      setBusy(false);
    }
  };

  const renderNode = (path: string): React.ReactNode => {
    const node = nodes[path];
    if (!node) return null;

    const children = node.isDirectory
      ? (
          <>
            {node.loading && <TreeNode id={`loading:${path}`} label="Loading..." disabled />}
            {node.error && <TreeNode id={`error:${path}`} label={`Error: ${node.error}`} disabled />}
            {!node.loading && !node.error && (node.children ?? []).map((childPath) => renderNode(childPath))}
          </>
        )
      : null;

    const disabled = !node.isDirectory && !isSupportedFile(node.path);

    return (
      <TreeNode
        key={node.path}
        id={node.path}
        value={node.path}
        label={node.name}
        isExpanded={expanded.has(node.path)}
        onToggle={(eventOrExpanded: unknown) => {
          const nextExpanded = typeof eventOrExpanded === 'boolean'
            ? eventOrExpanded
            : !expanded.has(node.path);
          handleToggle(node.path, nextExpanded);
        }}
        disabled={disabled}
      >
        {children}
      </TreeNode>
    );
  };

  const handleTreeMouseDownCapture = (event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[role="treeitem"]')) {
      // Prevent browser focus scrolling while still allowing click selection.
      event.preventDefault();
    }
  };

  return (
    <Modal
      open={open}
      size="md"
      modalHeading={modalHeading}
      primaryButtonText="Choose file"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!canSubmit}
      onRequestSubmit={() => {
        void handleSubmit();
      }}
      onRequestClose={onRequestClose}
    >
      <div style={{ minHeight: '20rem' }}>
        {busy && (
          <div style={{ marginBottom: '1rem' }}>
            <InlineLoading description="Loading file" status="active" />
          </div>
        )}
        {errorMessage && <p style={{ color: 'var(--cds-support-error)', marginBottom: '1rem' }}>{errorMessage}</p>}
        <div onMouseDownCapture={handleTreeMouseDownCapture}>
          <TreeView
            label="Emulator filesystem"
            selected={selectedPath ? [selectedPath] : []}
            onSelect={(_, payload) => {
              const id = typeof payload.id === 'string' ? payload.id : null;
              if (!id || !nodes[id]) return;
              if (nodes[id].isDirectory) {
                const willExpand = !expanded.has(id);
                handleToggle(id, willExpand);
                return;
              }
              setSelectedPath(id);
            }}
          >
            {normalizedRoots.map((root) => renderNode(root))}
          </TreeView>
        </div>
      </div>
    </Modal>
  );
}
