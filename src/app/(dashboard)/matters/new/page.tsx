import { MatterForm } from "@/components/matters/matter-form";

export default function NewMatterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Matter</h1>
        <p className="text-muted-foreground">
          Create a new legal matter to track directions and deadlines
        </p>
      </div>
      <MatterForm />
    </div>
  );
}
