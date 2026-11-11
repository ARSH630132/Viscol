"use client";

import { ArrowRight, Banknote, CheckCircle2, Clock3, FileText, Landmark, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getMe, type AuthUser } from "@/lib/auth-client";
import { managementFetch } from "@/lib/management-client";

type LoanProvider = {
  id: number;
  name: string;
  providerType: string;
  loanType: string;
  description: string;
  eligibility: string;
  interestRate: string;
  maximumAmount: string;
  requiredDocuments: string[];
  processDetails: string;
  contactInformation: string;
  isVisible: boolean;
  isActive: boolean;
};

type LoanApplication = {
  id: number;
  userId: number;
  providerId: number | null;
  providerName: string;
  loanType: string;
  studentName: string;
  studentMobile: string;
  studentEmail: string;
  course: string;
  collegeName: string;
  requestedAmount: number;
  coBorrowerName: string;
  coBorrowerRelationship: string;
  message: string | null;
  status: "Submitted" | "UnderReview" | "Approved" | "Rejected";
  adminRemark: string | null;
  createdAt: string;
  updatedAt: string;
};

const emptyProvider: Omit<LoanProvider, "id"> = {
  name: "",
  providerType: "",
  loanType: "",
  description: "",
  eligibility: "",
  interestRate: "",
  maximumAmount: "",
  requiredDocuments: [],
  processDetails: "",
  contactInformation: "",
  isVisible: true,
  isActive: true,
};

const statusLabel: Record<LoanApplication["status"], string> = {
  Submitted: "Submitted",
  UnderReview: "Under review",
  Approved: "Approved",
  Rejected: "Rejected",
};

const currency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function StudentLoans() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [providers, setProviders] = useState<LoanProvider[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [activeTab, setActiveTab] = useState<"providers" | "applications">("providers");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const applicationFormRef = useRef<HTMLElement | null>(null);
  const [providerId, setProviderId] = useState("");
  const [course, setCourse] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [coBorrowerName, setCoBorrowerName] = useState("");
  const [coBorrowerRelationship, setCoBorrowerRelationship] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMe().then((currentUser) => {
      setUser(currentUser);
      if (currentUser?.role === "College") return null;
      return Promise.all([
        managementFetch<{ data: LoanProvider[] }>("/loans/providers"),
        managementFetch<{ data: LoanApplication[] }>("/loans/applications"),
      ]).then(([providerResult, applicationResult]) => {
        setProviders(providerResult.data);
        setApplications(applicationResult.data);
        setProviderId(String(providerResult.data[0]?.id ?? ""));
      });
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to load loan information");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showApplicationForm) {
      applicationFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showApplicationForm]);

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await managementFetch<{ data: LoanApplication; sheetSync?: { synced: boolean; message?: string } }>("/loans/applications", {
        method: "POST",
        body: JSON.stringify({
          providerId: Number(providerId),
          course,
          collegeName,
          requestedAmount: Number(requestedAmount),
          coBorrowerName,
          coBorrowerRelationship,
          message,
        }),
      });
      setApplications((current) => [result.data, ...current]);
      setCourse("");
      setCollegeName("");
      setRequestedAmount("");
      setCoBorrowerName("");
      setCoBorrowerRelationship("");
      setMessage("");
      if (result.sheetSync?.synced) toast.success("Your loan application has been submitted");
      else toast.warning(result.sheetSync?.message || "Your loan was saved in the platform, but Google Sheets was not updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your application");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === "College") {
    return (
      <Card className="p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Loan services are not available to College accounts</h1>
      </Card>
    );
  }

  if (loading) return <Card className="p-8 text-center text-muted-foreground">Loading loan information…</Card>;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-[#122629] p-6 text-white sm:p-8">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-300"><Banknote className="h-4 w-4" /> Student finance</p>
        <h1 className="mt-2 text-3xl font-bold">Education Loans</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">Explore active loan providers, submit an application, and follow its status from one place.</p>
      </header>

      <nav aria-label="Loan sections" className="flex gap-2 overflow-x-auto border-b border-[#1d4143] pb-3">
        <button
          type="button"
          aria-current={activeTab === "providers" ? "page" : undefined}
          onClick={() => setActiveTab("providers")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "providers"
              ? "bg-teal-500 text-[#062224]"
              : "text-slate-300 hover:bg-[#123638] hover:text-white"
          }`}
        >
          <Landmark className="h-4 w-4" /> Available Loan Providers
        </button>
        <button
          type="button"
          aria-current={activeTab === "applications" ? "page" : undefined}
          onClick={() => setActiveTab("applications")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "applications"
              ? "bg-teal-500 text-[#062224]"
              : "text-slate-300 hover:bg-[#123638] hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" /> My Loan Applications ({applications.length})
        </button>
      </nav>

      {activeTab === "providers" ? (
      <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Available providers</h2>
          <p className="mt-1 text-sm text-muted-foreground">Only providers currently enabled by the platform are shown.</p>
        </div>
        {providers.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {providers.map((provider) => (
              <Card key={provider.id} className="premium-card space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></span>
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.providerType} · {provider.loanType}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">Available</span>
                </div>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
                <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
                  <p><span className="block text-xs text-muted-foreground">Interest rate</span><strong>{provider.interestRate}</strong></p>
                  <p><span className="block text-xs text-muted-foreground">Maximum loan</span><strong>{provider.maximumAmount}</strong></p>
                </div>
                <details className="group text-sm">
                  <summary className="cursor-pointer font-medium text-primary">Eligibility, documents & process</summary>
                  <div className="mt-3 space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">Eligibility:</strong> {provider.eligibility}</p>
                    <p><strong className="text-foreground">Documents:</strong> {provider.requiredDocuments.join(", ") || "Contact provider"}</p>
                    <p><strong className="text-foreground">Process:</strong> {provider.processDetails}</p>
                    <p><strong className="text-foreground">Contact:</strong> {provider.contactInformation}</p>
                  </div>
                </details>
                <Button
                  type="button"
                  onClick={() => {
                    setProviderId(String(provider.id));
                    setShowApplicationForm(true);
                  }}
                  className="w-full bg-teal-500 text-[#062224] hover:bg-teal-400 sm:w-auto"
                >
                  Apply for Loan <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        ) : <Card className="p-8 text-center text-muted-foreground">There are no loan providers available right now.</Card>}
      </section>

      {showApplicationForm ? <section ref={applicationFormRef} id="loan-application-form" className="scroll-mt-24">
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">Apply for an education loan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your name and contact details are securely taken from your signed-in account.</p>
          </div>
          {providers.length ? (
            <form onSubmit={submitApplication} className="space-y-4">
              <Field label="Loan provider">
                <select required value={providerId} onChange={(event) => setProviderId(event.target.value)} className={fieldClass}>
                  {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} — {provider.loanType}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student"><input value={user?.name ?? ""} readOnly className={fieldClass} /></Field>
                <Field label="Registered email"><input value={user?.email ?? ""} readOnly className={fieldClass} /></Field>
                <Field label="Course / program"><input required value={course} onChange={(event) => setCourse(event.target.value)} className={fieldClass} placeholder="e.g. B.Tech Computer Science" /></Field>
                <Field label="College / institution"><input required value={collegeName} onChange={(event) => setCollegeName(event.target.value)} className={fieldClass} placeholder="Enter institution name" /></Field>
                <Field label="Requested amount (₹)"><input required min="1" max="1000000000" type="number" value={requestedAmount} onChange={(event) => setRequestedAmount(event.target.value)} className={fieldClass} /></Field>
                <Field label="Co-borrower name"><input required value={coBorrowerName} onChange={(event) => setCoBorrowerName(event.target.value)} className={fieldClass} /></Field>
                <Field label="Relationship to student"><input required value={coBorrowerRelationship} onChange={(event) => setCoBorrowerRelationship(event.target.value)} className={fieldClass} /></Field>
              </div>
              <Field label="Additional information (optional)"><Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={3000} placeholder="Share any details that may help process your request" /></Field>
              <Button type="submit" disabled={submitting || !providers.length}>{submitting ? "Submitting…" : "Submit loan application"}</Button>
            </form>
          ) : (
            <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Applications will be available when a provider is enabled by the Admin.</p>
          )}
        </Card>
      </section> : null}
      </div>
      ) : (
      <section className="space-y-4">
        <Card className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><FileText className="h-5 w-5 text-primary" /> My applications</h2>
            <p className="mt-1 text-sm text-muted-foreground">Application details are visible only to you and the Admin team.</p>
          </div>
          {applications.length ? applications.map((application) => (
            <article key={application.id} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{application.providerName}</h3><p className="text-sm text-muted-foreground">{application.loanType}</p></div>
                <StatusBadge status={application.status} />
              </div>
              <p className="text-sm text-muted-foreground">{application.course} · {application.collegeName}</p>
              <p className="text-sm font-medium">{currency(application.requestedAmount)}</p>
              {application.adminRemark ? <p className="rounded-lg bg-muted/50 p-3 text-sm"><strong>Admin note:</strong> {application.adminRemark}</p> : null}
              <p className="text-xs text-muted-foreground">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
            </article>
          )) : <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">You have not submitted any loan applications yet.</p>}
        </Card>
      </section>
      )}
    </div>
  );
}

export function AdminLoanManagement({ section, onSectionChange }: {
  section: "providers" | "applications";
  onSectionChange: (section: "providers" | "applications") => void;
}) {
  const [providers, setProviders] = useState<LoanProvider[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Omit<LoanProvider, "id">>(emptyProvider);
  const [documentText, setDocumentText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const request = section === "providers"
      ? managementFetch<{ data: LoanProvider[] }>("/admin/loan-providers").then((result) => setProviders(result.data))
      : managementFetch<{ data: LoanApplication[] }>("/admin/loan-applications").then((result) => setApplications(result.data));
    request.catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to load loan administration data");
    }).finally(() => setLoading(false));
  }, [section]);

  const beginNewProvider = () => {
    setDraft(emptyProvider);
    setDocumentText("");
    setEditingId(null);
    setEditorOpen(true);
  };

  const editProvider = (provider: LoanProvider) => {
    const { id, ...providerDraft } = provider;
    setDraft(providerDraft);
    setDocumentText(provider.requiredDocuments.join("\n"));
    setEditingId(id);
    setEditorOpen(true);
  };

  const saveProvider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const input = { ...draft, requiredDocuments: documentText.split("\n").map((item) => item.trim()).filter(Boolean) };
    try {
      const result = await managementFetch<{ data: LoanProvider }>(
        editingId ? `/admin/loan-providers/${editingId}` : "/admin/loan-providers",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(input) },
      );
      setProviders((current) => editingId
        ? current.map((provider) => provider.id === result.data.id ? result.data : provider)
        : [...current, result.data].sort((first, second) => first.name.localeCompare(second.name)));
      setDraft(emptyProvider);
      setDocumentText("");
      setEditingId(null);
      setEditorOpen(false);
      toast.success(editingId ? "Loan provider updated" : "Loan provider added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save loan provider");
    } finally {
      setSaving(false);
    }
  };

  const toggleProviderVisibility = async (provider: LoanProvider) => {
    try {
      const result = await managementFetch<{ data: LoanProvider }>(`/admin/loan-providers/${provider.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: !provider.isVisible }),
      });
      setProviders((current) => current.map((item) => item.id === result.data.id ? result.data : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update provider visibility");
    }
  };

  const deactivateProvider = async (provider: LoanProvider) => {
    if (!window.confirm(`Deactivate ${provider.name}? Existing applications will be retained.`)) return;
    try {
      const result = await managementFetch<{ data: LoanProvider }>(`/admin/loan-providers/${provider.id}`, { method: "DELETE" });
      setProviders((current) => current.map((item) => item.id === result.data.id ? result.data : item));
      toast.success("Loan provider deactivated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to deactivate provider");
    }
  };

  const saveApplication = async (applicationId: number, status: LoanApplication["status"], adminRemark: string) => {
    try {
      const result = await managementFetch<{ data: LoanApplication; sheetSync?: { synced: boolean; message?: string } }>(`/admin/loan-applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminRemark }),
      });
      setApplications((current) => current.map((item) => item.id === applicationId ? result.data : item));
      if (result.sheetSync?.synced) toast.success("Application status updated");
      else toast.warning(result.sheetSync?.message || "Application status was saved, but Google Sheets was not updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update application");
      throw error;
    }
  };

  if (loading) {
    return (
      <div>
        <AdminLoanTabs section={section} onSectionChange={onSectionChange} />
        <Card className="premium-card p-8 text-center text-slate-300">Loading loan {section}…</Card>
      </div>
    );
  }

  if (section === "applications") {
    return (
      <div>
      <AdminLoanTabs section={section} onSectionChange={onSectionChange} />
      <Card className="overflow-hidden rounded-2xl border-[#1d5655] bg-[#0b2426] text-[#e8f1f2] shadow-xl shadow-black/10">
        <div className="border-b border-[#1d5655] bg-[#0a2022] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-300"><FileText className="h-4 w-4" /> Student finance</p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">Track Submitted Loan Applications</h2>
              <p className="mt-1 text-sm text-slate-400">Review student requests and post status updates for applicants.</p>
            </div>
            <span className="rounded-full border border-teal-800 bg-teal-950/60 px-3 py-1.5 text-sm font-medium text-teal-300">
              {applications.length} {applications.length === 1 ? "application" : "applications"}
            </span>
          </div>
        </div>
        {applications.length ? (
          <div className="space-y-4 p-4 sm:p-5">
            {applications.map((application) => <AdminApplication key={application.id} application={application} onSave={saveApplication} />)}
          </div>
        ) : (
          <div className="p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#1d5655] bg-[#071b1d] text-teal-300"><FileText className="h-5 w-5" /></span>
            <p className="mt-3 font-medium text-white">No loan applications yet</p>
            <p className="mt-1 text-sm text-slate-400">Student submissions will appear here for review.</p>
          </div>
        )}
      </Card>
      </div>
    );
  }

  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const visibleProviders = providers.filter((provider) => provider.isActive && provider.isVisible).length;

  return (
    <div className="space-y-5">
      <AdminLoanTabs section={section} onSectionChange={onSectionChange} />
      <Card className="overflow-hidden rounded-2xl border-[#1d5655] bg-[#0b2426] text-[#e8f1f2] shadow-xl shadow-black/10">
        <div className="border-b border-[#1d5655] bg-[#0a2022] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-300"><Landmark className="h-4 w-4" /> Student finance</p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">Loan Providers</h2>
              <p className="mt-1 text-sm text-slate-400">Manage provider details and control which offers students can see.</p>
            </div>
            <Button type="button" onClick={beginNewProvider} className="bg-teal-500 text-[#062224] hover:bg-teal-400"><Plus className="h-4 w-4" /> Add provider</Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total providers", count: providers.length, color: "text-white" },
              { label: "Active", count: activeProviders, color: "text-emerald-300" },
              { label: "Visible to students", count: visibleProviders, color: "text-teal-300" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#1d4143] bg-[#071b1d] px-4 py-3">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.count}</p>
              </div>
            ))}
          </div>
        </div>
        {editorOpen ? (
          <form onSubmit={saveProvider} className="m-4 space-y-5 rounded-2xl border border-teal-800/80 bg-[#081f21] p-4 sm:m-5 sm:p-5">
            <div className="border-b border-[#1d4143] pb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">{editingId ? "Update listing" : "Provider setup"}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{editingId ? "Edit loan provider" : "Add a loan provider"}</h3>
              <p className="mt-1 text-sm text-slate-400">Configure the information shown on the student loan page.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider / bank name"><input required maxLength={160} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={adminFieldClass} /></Field>
              <Field label="Provider type"><input required maxLength={120} value={draft.providerType} onChange={(event) => setDraft({ ...draft, providerType: event.target.value })} className={adminFieldClass} placeholder="Bank, NBFC, financial institution" /></Field>
              <Field label="Loan type"><input required maxLength={120} value={draft.loanType} onChange={(event) => setDraft({ ...draft, loanType: event.target.value })} className={adminFieldClass} /></Field>
              <Field label="Interest rate"><input required maxLength={120} value={draft.interestRate} onChange={(event) => setDraft({ ...draft, interestRate: event.target.value })} className={adminFieldClass} placeholder="e.g. From 8.5% p.a." /></Field>
              <Field label="Maximum loan amount"><input required maxLength={120} value={draft.maximumAmount} onChange={(event) => setDraft({ ...draft, maximumAmount: event.target.value })} className={adminFieldClass} /></Field>
              <Field label="Contact / application information"><input required maxLength={1000} value={draft.contactInformation} onChange={(event) => setDraft({ ...draft, contactInformation: event.target.value })} className={adminFieldClass} /></Field>
            </div>
            <Field label="Description"><Textarea required maxLength={3000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={adminTextareaClass} /></Field>
            <Field label="Eligibility criteria"><Textarea required maxLength={3000} value={draft.eligibility} onChange={(event) => setDraft({ ...draft, eligibility: event.target.value })} className={adminTextareaClass} /></Field>
            <Field label="Required documents (one per line)"><Textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} className={adminTextareaClass} /></Field>
            <Field label="Application process"><Textarea required maxLength={3000} value={draft.processDetails} onChange={(event) => setDraft({ ...draft, processDetails: event.target.value })} className={adminTextareaClass} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-[#1d4143] bg-[#071b1d] p-4 text-sm">
                <input type="checkbox" checked={draft.isVisible} onChange={(event) => setDraft({ ...draft, isVisible: event.target.checked })} className="mt-0.5 accent-teal-400" />
                <span><strong className="block text-slate-100">Visible to students</strong><span className="mt-1 block text-xs text-slate-400">Show this provider in the student loan listings.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-[#1d4143] bg-[#071b1d] p-4 text-sm">
                <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} className="mt-0.5 accent-teal-400" />
                <span><strong className="block text-slate-100">Provider is active</strong><span className="mt-1 block text-xs text-slate-400">Allow students to view and apply to this provider.</span></span>
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#1d4143] pt-4">
              <Button type="button" variant="outline" onClick={() => { setEditorOpen(false); setDraft(emptyProvider); setDocumentText(""); setEditingId(null); }} className="border-[#1d5655] bg-transparent text-slate-300 hover:bg-[#123638] hover:text-white">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-teal-500 text-[#062224] hover:bg-teal-400">{saving ? "Saving…" : editingId ? "Save changes" : "Add provider"}</Button>
            </div>
          </form>
        ) : null}

        {providers.length ? (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            {providers.map((provider) => (
              <article key={provider.id} className="flex min-w-0 flex-col rounded-2xl border border-[#1d5655] bg-[#0a2022] p-5 transition-colors hover:border-teal-700/80">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-teal-900 bg-[#071b1d] text-teal-300"><Landmark className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{provider.name}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        provider.isActive && provider.isVisible
                          ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                          : provider.isActive
                            ? "border-amber-800 bg-amber-950/50 text-amber-300"
                            : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}>
                      {!provider.isActive ? "Inactive" : provider.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-teal-300">{provider.providerType} · {provider.loanType}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{provider.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[#163b3e] bg-[#071b1d] p-3">
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Interest rate</p><p className="mt-1 font-semibold text-teal-300">{provider.interestRate}</p></div>
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Maximum amount</p><p className="mt-1 font-semibold text-amber-300">{provider.maximumAmount}</p></div>
                </div>
                <div className="mt-4 flex-1 space-y-3 text-sm">
                  <p><strong className="text-slate-200">Eligibility:</strong> <span className="text-slate-400">{provider.eligibility}</span></p>
                  <div>
                    <strong className="text-slate-200">Required documents</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {provider.requiredDocuments.length ? provider.requiredDocuments.map((document, index) => (
                        <span key={`${provider.id}-${index}`} className="rounded-lg border border-[#1d4143] bg-[#071b1d] px-2.5 py-1.5 text-xs text-slate-300">{document}</span>
                      )) : <span className="text-slate-400">No documents listed</span>}
                    </div>
                  </div>
                  <p><strong className="text-slate-200">Process:</strong> <span className="text-slate-400">{provider.processDetails}</span></p>
                  <p><strong className="text-slate-200">Contact:</strong> <span className="text-slate-400">{provider.contactInformation}</span></p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#1d4143] pt-4">
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleProviderVisibility(provider)} disabled={!provider.isActive} className="border-[#1d5655] bg-[#071b1d] text-slate-200 hover:bg-[#123638] hover:text-white">
                    {provider.isVisible ? "Hide from students" : "Show to students"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => editProvider(provider)} className="border-[#1d5655] bg-[#071b1d] text-slate-200 hover:bg-[#123638] hover:text-white">Edit details</Button>
                  {provider.isActive ? <Button type="button" size="sm" variant="destructive" onClick={() => void deactivateProvider(provider)}><Trash2 className="h-4 w-4" /> Deactivate</Button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#1d5655] bg-[#071b1d] text-teal-300"><Landmark className="h-5 w-5" /></span>
            <p className="mt-3 font-medium text-white">No loan providers configured</p>
            <p className="mt-1 text-sm text-slate-400">Add a provider to make its loan details available to students.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminLoanTabs({ section, onSectionChange }: {
  section: "providers" | "applications";
  onSectionChange: (section: "providers" | "applications") => void;
}) {
  return (
    <nav aria-label="Loan management sections" className="mb-5 flex gap-2 overflow-x-auto border-b border-[#1d4143] pb-3">
      <button
        type="button"
        aria-current={section === "providers" ? "page" : undefined}
        onClick={() => onSectionChange("providers")}
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          section === "providers"
            ? "bg-teal-500 text-[#062224]"
            : "text-slate-300 hover:bg-[#123638] hover:text-white"
        }`}
      >
        <Banknote className="h-4 w-4" /> Loan Providers
      </button>
      <button
        type="button"
        aria-current={section === "applications" ? "page" : undefined}
        onClick={() => onSectionChange("applications")}
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          section === "applications"
            ? "bg-teal-500 text-[#062224]"
            : "text-slate-300 hover:bg-[#123638] hover:text-white"
        }`}
      >
        <FileText className="h-4 w-4" /> Loan Applications
      </button>
    </nav>
  );
}

function AdminApplication({ application, onSave }: {
  application: LoanApplication;
  onSave: (id: number, status: LoanApplication["status"], remark: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(application.status);
  const [remark, setRemark] = useState(application.adminRemark ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(application.id, status, remark);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-[#1d5655] bg-[#071b1d] p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            <span className="font-mono font-semibold text-teal-300">APP-{new Date(application.createdAt).getFullYear()}-{String(application.id).padStart(4, "0")}</span>
            <span className="px-2">·</span>
            Submitted on {new Date(application.createdAt).toLocaleDateString()}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{application.providerName}</h3>
          <p className="text-sm text-slate-400">{application.studentName} · {application.studentEmail} · {application.studentMobile}</p>
        </div>
        <StatusBadge status={application.status} />
      </header>

      <div className="my-4 border-t border-[#1d4143]" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <p className="text-sm text-slate-400">Course / Institution</p>
          <p className="mt-1 font-semibold text-slate-100">{application.course}</p>
          <p className="text-sm text-slate-400">{application.collegeName}</p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Requested amount</p>
          <p className="mt-1 text-lg font-bold text-amber-300">{currency(application.requestedAmount)}</p>
          <p className="mt-1 text-sm text-slate-400">
            Co-borrower: <span className="text-slate-200">{application.coBorrowerName} ({application.coBorrowerRelationship})</span>
          </p>
          {application.message ? <p className="mt-2 text-sm text-slate-400"><strong className="text-slate-200">Student note:</strong> {application.message}</p> : null}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Admin remark / updates</p>
            {application.adminRemark
              ? <p className="mt-1 text-sm italic text-slate-300">{application.adminRemark}</p>
              : <p className="mt-1 text-sm text-slate-500">No update shared yet.</p>}
          </div>
          <label className="block space-y-1.5 text-xs font-medium text-slate-300">
            Update status
            <select value={status} onChange={(event) => setStatus(event.target.value as LoanApplication["status"])} className={adminFieldClass}>
              <option value="Submitted">Submitted</option><option value="UnderReview">Under review</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
            </select>
          </label>
          <Textarea maxLength={3000} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="Add an update for the student" className={`${adminTextareaClass} min-h-20`} aria-label="Admin update for student" />
          <Button type="button" size="sm" onClick={() => void save()} disabled={saving} className="w-full bg-teal-500 text-[#062224] hover:bg-teal-400">{saving ? "Saving…" : "Save update"}</Button>
        </div>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>;
}

function StatusBadge({ status }: { status: LoanApplication["status"] }) {
  const Icon = status === "Approved" ? CheckCircle2 : status === "UnderReview" ? Clock3 : FileText;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"><Icon className="h-3.5 w-3.5" />{statusLabel[status]}</span>;
}

const fieldClass = "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const adminFieldClass = "h-10 w-full rounded-lg border border-[#1d5655] bg-[#071b1d] px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500";
const adminTextareaClass = "min-h-24 rounded-lg border-[#1d5655] bg-[#071b1d] text-sm text-white placeholder:text-slate-500 focus-visible:ring-teal-500";
