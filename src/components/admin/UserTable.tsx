"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { format } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  requester: "Requester",
  focal_point: "Focal Point",
  staff: "Staff",
  compliance: "Compliance",
};

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  status: string;
  created_at: string;
  villages?: { name: string } | null;
  labs?: { name: string } | null;
}

interface UserTableProps {
  users: UserRow[];
  loading?: boolean;
}

const columns: Column<UserRow>[] = [
  {
    key: "full_name",
    header: "Name",
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
          {row.full_name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {row.email}
        </p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (row) =>
      row.role ? (
        <Badge variant="purple">{ROLE_LABELS[row.role] ?? row.role}</Badge>
      ) : (
        <span style={{ color: "var(--color-text-muted)" }}>—</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <Badge variant={statusVariant(row.status)}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: "village",
    header: "Village / Lab",
    render: (row) => (
      <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {row.villages?.name ?? "—"}
        <br />
        <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
          {row.labs?.name ?? ""}
        </span>
      </div>
    ),
  },
  {
    key: "created_at",
    header: "Registered",
    sortable: true,
    render: (row) => (
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {format(new Date(row.created_at), "dd MMM yyyy")}
      </span>
    ),
  },
];

export function UserTable({ users, loading }: UserTableProps) {
  return (
    <DataTable
      columns={columns}
      data={users}
      keyFn={(r) => r.id}
      loading={loading}
    />
  );
}
