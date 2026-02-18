import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Scale, FileCheck, Calendar, FolderOpen, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile hero banner - visible only on small screens */}
      <div className="relative md:hidden">
        <div className="relative h-52 overflow-hidden">
          <Image
            src="/hero-office.jpg"
            alt="Modern office with city skyline"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b33]/85 via-[#132240]/80 to-[#0f1b33]/95" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#10b981] shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Enluka Legal</h1>
            <p className="mt-1 text-sm text-white/70">Digital-First Practice Management</p>
          </div>
        </div>
        {/* Teal accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#2563eb] via-[#10b981] to-[#06d6a0]" />
      </div>

      {/* Desktop left panel - image hero */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <Image
          src="/hero-office.jpg"
          alt="Modern office with city skyline"
          fill
          className="object-cover"
          priority
        />
        {/* Navy + teal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b33]/92 via-[#132240]/85 to-[#064e3b]/70" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#10b981]">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Enluka Legal</span>
            </div>
            <p className="text-sm text-[#10b981]/80">Digital-First Practice Management</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight">
                Digital-First Legal<br />Practice Management
              </h1>
              <p className="mt-4 text-lg text-white/75 max-w-md">
                Automate court logistics, track deadlines with intelligent escalation, and generate compliant court bundles — all in one platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#10b981]/20 border border-[#10b981]/30">
                  <FileCheck className="h-4 w-4 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-medium">Court Direction Extraction</p>
                  <p className="text-sm text-white/50">Upload court orders and extract directions with confidence scoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2563eb]/20 border border-[#2563eb]/30">
                  <Calendar className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <div>
                  <p className="font-medium">4-Tier Deadline Escalation</p>
                  <p className="text-sm text-white/50">Automated reminders at 14 days, 7 days, 48 hours, and 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#10b981]/20 border border-[#10b981]/30">
                  <FolderOpen className="h-4 w-4 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-medium">Court Bundle Generation</p>
                  <p className="text-sm text-white/50">Assemble, paginate, and securely share trial bundles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2563eb]/20 border border-[#2563eb]/30">
                  <Shield className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <div>
                  <p className="font-medium">Full Audit Trail</p>
                  <p className="text-sm text-white/50">SRA-compliant immutable logging of all actions and decisions</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/30">
            &copy; 2026 Enluka Legal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 items-center justify-center bg-[#f8fafc] p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <LoginForm />
          <div className="rounded-lg border border-dashed border-[#2563eb]/20 bg-[#2563eb]/5 p-4">
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
