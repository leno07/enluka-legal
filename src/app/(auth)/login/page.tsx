import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Scale, FileCheck, Calendar, FolderOpen, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - image hero */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <Image
          src="/Hero-Legal/screenshot.jpg"
          alt="Legal practice management"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.15_0.05_240)]/90 via-[oklch(0.20_0.05_240)]/80 to-[oklch(0.30_0.12_175)]/75" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Enluka Legal</span>
            </div>
            <p className="text-sm text-white/60">Digital-First Practice Management</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight">
                Digital-First Legal<br />Practice Management
              </h1>
              <p className="mt-4 text-lg text-white/80 max-w-md">
                Automate court logistics, track deadlines with intelligent escalation, and generate compliant court bundles — all in one platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Court Direction Extraction</p>
                  <p className="text-sm text-white/60">Upload court orders and extract directions with confidence scoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">4-Tier Deadline Escalation</p>
                  <p className="text-sm text-white/60">Automated reminders at 14 days, 7 days, 48 hours, and 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Court Bundle Generation</p>
                  <p className="text-sm text-white/60">Assemble, paginate, and securely share trial bundles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Full Audit Trail</p>
                  <p className="text-sm text-white/60">SRA-compliant immutable logging of all actions and decisions</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/40">
            &copy; 2026 Enluka Legal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md space-y-6">
          <LoginForm />
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-muted-foreground/80 font-mono">
              <p>admin@demo-legal.co.uk / Admin123!</p>
              <p>solicitor@demo-legal.co.uk / Solicitor123!</p>
              <p>paralegal@demo-legal.co.uk / Paralegal123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
