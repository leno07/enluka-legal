import { prisma } from "./prisma";

const TENANT_MODELS = new Set([
  "Matter",
  "EscalationPolicy",
  "AuditLog",
]);

export function tenantPrisma(firmId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) {
          return query(args);
        }

        const readOps = [
          "findMany",
          "findFirst",
          "findFirstOrThrow",
          "findUnique",
          "findUniqueOrThrow",
          "count",
          "aggregate",
          "groupBy",
        ];

        if (readOps.includes(operation)) {
          (args as any).where = { ...(args as any).where, firmId };
        }

        if (operation === "create") {
          (args as any).data = { ...(args as any).data, firmId };
        }

        if (operation === "createMany") {
          const data = (args as any).data;
          if (Array.isArray(data)) {
            (args as any).data = data.map((d: any) => ({ ...d, firmId }));
          } else {
            (args as any).data = { ...data, firmId };
          }
        }

        if (operation === "update" || operation === "updateMany") {
          (args as any).where = { ...(args as any).where, firmId };
        }

        if (operation === "delete" || operation === "deleteMany") {
          (args as any).where = { ...(args as any).where, firmId };
        }

        return query(args);
      },
    },
  });
}
