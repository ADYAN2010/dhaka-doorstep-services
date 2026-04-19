/**
 * Example calls into the Express backend.
 * Import these from React components or hooks — never import `mysql2` in the frontend.
 */
import { api } from "./api-client";

export type Service = {
  id: number;
  name: string;
  description: string | null;
  base_price: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

// GET /api/test-db
export function pingDatabase() {
  return api<{ ok: boolean; db?: { ok: number; server_time: string; db: string } }>(
    "/api/test-db",
  );
}

// GET /api/services?limit=50&offset=0
export function listServices(params: { limit?: number; offset?: number } = {}) {
  return api<{ data: Service[]; limit: number; offset: number }>("/api/services", {
    query: params,
  });
}

// GET /api/services/:id
export function getService(id: number) {
  return api<{ data: Service }>(`/api/services/${id}`);
}

// POST /api/services
export function createService(input: {
  name: string;
  description?: string | null;
  base_price?: number;
  is_active?: boolean;
}) {
  return api<{ data: Service }>("/api/services", { method: "POST", body: input });
}

// PATCH /api/services/:id
export function updateService(id: number, input: Partial<Omit<Service, "id">>) {
  return api<{ data: Service }>(`/api/services/${id}`, { method: "PATCH", body: input });
}

// DELETE /api/services/:id
export function deleteService(id: number) {
  return api<void>(`/api/services/${id}`, { method: "DELETE" });
}

/* -------------------------------------------------------------------------
   React usage example (drop into any component):

   import { useEffect, useState } from "react";
   import { listServices, type Service } from "@/lib/api-examples";

   export function ServicesList() {
     const [items, setItems] = useState<Service[]>([]);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       listServices({ limit: 20 })
         .then((res) => setItems(res.data))
         .catch((e) => setError(e.message));
     }, []);

     if (error) return <p>Error: {error}</p>;
     return <ul>{items.map((s) => <li key={s.id}>{s.name}</li>)}</ul>;
   }
------------------------------------------------------------------------- */
