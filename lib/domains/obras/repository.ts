import { SupabaseClient } from "@supabase/supabase-js";
import { Obra, ObraTrashItem, CreateObraInput, UpdateObraInput } from "./entities";
import { measureDuration } from "@/lib/observability/logger";
import { cacheGet, cacheSet, generateCacheKey } from "@/lib/cache/redis";

export interface IObrasRepository {
  supportsTrash(empresaId: string): Promise<boolean>;
  listActive(empresaId: string): Promise<Obra[]>;
  listTrash(empresaId: string): Promise<ObraTrashItem[]>;
  findOneActive(empresaId: string, obraId: string): Promise<Obra | null>;
  softDelete(empresaId: string, obraId: string, deletedBy: string): Promise<boolean>;
  restore(empresaId: string, obraId: string): Promise<boolean>;
  create(empresaId: string, input: CreateObraInput, trashEnabled: boolean): Promise<void>;
  update(empresaId: string, obraId: string, input: UpdateObraInput, trashEnabled: boolean): Promise<boolean>;
}

export class SupabaseObrasRepository implements IObrasRepository {
  constructor(private supabase: SupabaseClient) {}

  async supportsTrash(empresaId: string): Promise<boolean> {
    return measureDuration("obras.supportsTrash", async () => {
      const { error } = await this.supabase
        .from("obras")
        .select("deleted_at", { head: true, count: "exact" })
        .eq("empresa_id", empresaId)
        .limit(1);
      return !error;
    }, { empresaId });
  }

  async listActive(empresaId: string): Promise<Obra[]> {
    return measureDuration("obras.listActive", async () => {
      const cacheKey = generateCacheKey("obras", "active", { empresaId });
      const cached = await cacheGet<Obra[]>(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.supabase
        .from("obras")
        .select("id, empresa_id, nome, cliente, status, progresso, created_at")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const result = (data ?? []) as Obra[];
      await cacheSet(cacheKey, result, 300); // Cache for 5 mins
      return result;
    }, { empresaId });
  }


  async listTrash(empresaId: string): Promise<ObraTrashItem[]> {
    return measureDuration("obras.listTrash", async () => {
      const { data, error } = await this.supabase
        .from("obras")
        .select("id, empresa_id, nome, cliente, status, progresso, created_at, deleted_at, deleted_by")
        .eq("empresa_id", empresaId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ObraTrashItem[];
    }, { empresaId });
  }

  async findOneActive(empresaId: string, obraId: string): Promise<Obra | null> {
    return measureDuration("obras.findOneActive", async () => {
      const { data, error } = await this.supabase
        .from("obras")
        .select("id, empresa_id, nome, cliente, status, progresso, created_at")
        .eq("empresa_id", empresaId)
        .eq("id", obraId)
        .is("deleted_at", null)
        .single();

      if (error) return null;
      return data as Obra;
    }, { empresaId, obraId });
  }

  async softDelete(empresaId: string, obraId: string, deletedBy: string): Promise<boolean> {
    return measureDuration("obras.softDelete", async () => {
      const { error, data } = await this.supabase
        .from("obras")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq("empresa_id", empresaId)
        .eq("id", obraId)
        .is("deleted_at", null)
        .select("id");

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    }, { empresaId, obraId });
  }

  async restore(empresaId: string, obraId: string): Promise<boolean> {
    return measureDuration("obras.restore", async () => {
      const { error, data } = await this.supabase
        .from("obras")
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq("empresa_id", empresaId)
        .eq("id", obraId)
        .not("deleted_at", "is", null)
        .select("id");

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    }, { empresaId, obraId });
  }

  async create(empresaId: string, input: CreateObraInput, trashEnabled: boolean): Promise<void> {
    return measureDuration("obras.create", async () => {
      const payload: Record<string, any> = {
        empresa_id: empresaId,
        nome: input.nome,
        cliente: input.cliente,
        status: input.status ?? "planejamento",
        progresso: 0,
      };

      if (trashEnabled) {
        payload.deleted_at = null;
        payload.deleted_by = null;
      }

      const { error } = await this.supabase.from("obras").insert(payload);
      if (error) throw error;
    }, { empresaId });
  }

  async update(empresaId: string, obraId: string, input: UpdateObraInput, trashEnabled: boolean): Promise<boolean> {
    return measureDuration("obras.update", async () => {
      let query = this.supabase
        .from("obras")
        .update({
          nome: input.nome,
          cliente: input.cliente,
          status: input.status,
          progresso: input.progresso,
        })
        .eq("empresa_id", empresaId)
        .eq("id", obraId);

      if (trashEnabled) {
        query = query.is("deleted_at", null);
      }

      const { error, data } = await query.select("id");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    }, { empresaId, obraId });
  }
}
