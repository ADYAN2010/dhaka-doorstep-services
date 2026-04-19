import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Megaphone, TrendingUp, Users, MousePointerClick, Mail,
  Plus, Tag, Pause, Play, Copy, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/marketing")({
  component: MarketingPage,
});

type Promo = {
  id: string; code: string; discount: string; uses: number; cap: number;
  status: "active" | "paused" | "ended"; expires: string;
};
type Campaign = {
  id: string; name: string; channel: "email" | "sms" | "social" | "google";
  status: "live" | "draft" | "paused"; sent: number; opened: number; clicked: number; converted: number; spend: number;
};

const SEED_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Eid cleaning rush", channel: "email", status: "live", sent: 12480, opened: 4992, clicked: 1248, converted: 184, spend: 0 },
  { id: "c2", name: "Gulshan AC service blast", channel: "sms", status: "live", sent: 3200, opened: 3200, clicked: 412, converted: 89, spend: 4800 },
  { id: "c3", name: "Provider recruitment Q2", channel: "google", status: "live", sent: 0, opened: 22000, clicked: 1840, converted: 47, spend: 28500 },
  { id: "c4", name: "First-time customer 20% off", channel: "social", status: "paused", sent: 0, opened: 18400, clicked: 920, converted: 132, spend: 12000 },
  { id: "c5", name: "Monsoon plumbing reminder", channel: "email", status: "draft", sent: 0, opened: 0, clicked: 0, converted: 0, spend: 0 },
];

const SEED_PROMOS: Promo[] = [
  { id: "p1", code: "WELCOME20", discount: "20% off first booking", uses: 412, cap: 1000, status: "active", expires: "2026-12-31" },
  { id: "p2", code: "EID2026", discount: "৳200 off", uses: 1842, cap: 2000, status: "active", expires: "2026-04-30" },
  { id: "p3", code: "GULSHAN15", discount: "15% Gulshan only", uses: 89, cap: 500, status: "active", expires: "2026-06-30" },
  { id: "p4", code: "SUMMER", discount: "10% off AC services", uses: 220, cap: 220, status: "ended", expires: "2025-09-30" },
];

function MarketingPage() {
  const [promos, setPromos] = useState<Promo[]>(SEED_PROMOS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS);
  const [createOpen, setCreateOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);

  function togglePromo(id: string) {
    setPromos((prev) => prev.map((p) => p.id === id ? { ...p, status: p.status === "active" ? "paused" : "active" } : p));
    toast.success("Status updated");
  }
  function copyCode(code: string) { navigator.clipboard.writeText(code); toast.success(`Copied ${code}`); }
  function deletePromo(id: string) { setPromos((prev) => prev.filter((p) => p.id !== id)); toast.success("Promo removed"); }

  function toggleCampaign(id: string) {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === "live" ? "paused" : "live" } : c));
    toast.success("Campaign updated");
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + c.sent, opened: acc.opened + c.opened,
      clicked: acc.clicked + c.clicked, converted: acc.converted + c.converted, spend: acc.spend + c.spend,
    }),
    { sent: 0, opened: 0, clicked: 0, converted: 0, spend: 0 },
  );
  const cac = totals.converted ? Math.round(totals.spend / totals.converted) : 0;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketing"
        title="Campaigns & promotions"
        description="Run campaigns, manage promo codes, and track funnel performance across channels."
        actions={
          <>
            <CreatePromoDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={(p) => setPromos((prev) => [{ ...p, id: crypto.randomUUID() }, ...prev])} />
            <CreateCampaignDialog open={campaignOpen} onOpenChange={setCampaignOpen} onCreate={(c) => setCampaigns((prev) => [{ ...c, id: crypto.randomUUID() }, ...prev])} />
          </>
        }
      />

      {/* Funnel cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Funnel icon={Mail} label="Reached" value={totals.sent + totals.opened} accent />
        <Funnel icon={MousePointerClick} label="Engaged" value={totals.clicked} />
        <Funnel icon={Users} label="Converted" value={totals.converted} highlight />
        <Funnel icon={TrendingUp} label="Spend (BDT)" value={totals.spend} prefix="৳" />
        <Funnel icon={Tag} label="CAC (BDT)" value={cac} prefix="৳" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Channel performance */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active campaigns</div>
            <div className="text-base font-semibold">Performance</div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Reach</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const reach = c.sent + c.opened;
                  const ctr = reach ? ((c.clicked / Math.max(1, reach)) * 100).toFixed(1) : "0.0";
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">Spend: ৳{c.spend.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{c.channel}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{reach.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{c.converted.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{ctr}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === "live" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                          c.status === "paused" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.status}</span>
                        {c.status !== "draft" && (
                          <Button size="icon" variant="ghost" onClick={() => toggleCampaign(c.id)} className="h-7 w-7">
                            {c.status === "live" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Channel mix bar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channel mix</div>
          <div className="mt-1 text-base font-semibold">By conversions</div>
          <div className="mt-4 space-y-3">
            {(["email", "sms", "social", "google"] as const).map((ch) => {
              const sum = campaigns.filter((c) => c.channel === ch).reduce((s, c) => s + c.converted, 0);
              const pct = totals.converted ? (sum / totals.converted) * 100 : 0;
              return (
                <div key={ch}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium capitalize">{ch}</span>
                    <span className="text-muted-foreground">{sum} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Promo codes */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Promo codes</div>
          <div className="text-base font-semibold">Active discounts</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((p) => {
                const pct = Math.min(100, (p.uses / Math.max(1, p.cap)) * 100);
                return (
                  <TableRow key={p.id}>
                    <TableCell><code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{p.code}</code></TableCell>
                    <TableCell className="text-sm">{p.discount}</TableCell>
                    <TableCell className="w-48">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.uses}/{p.cap}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.expires).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                        p.status === "paused" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyCode(p.code)}><Copy className="h-3.5 w-3.5" /></Button>
                      {p.status !== "ended" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePromo(p.id)}>
                          {p.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deletePromo(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Funnel({ icon: Icon, label, value, accent, highlight, prefix }: { icon: typeof Megaphone; label: string; value: number; accent?: boolean; highlight?: boolean; prefix?: string }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : highlight ? "text-emerald-600" : ""}`} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{prefix}{value.toLocaleString()}</div>
    </div>
  );
}

function CreatePromoDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (p: Omit<Promo, "id">) => void }) {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [cap, setCap] = useState("100");
  const [expires, setExpires] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Tag className="h-3.5 w-3.5" /> New promo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create promo code</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME20" /></div>
          <div><Label>Discount description</Label><Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="20% off first booking" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Max uses</Label><Input type="number" value={cap} onChange={(e) => setCap(e.target.value)} /></div>
            <div><Label>Expires</Label><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!code || !discount) return toast.error("Code and discount are required");
            onCreate({ code, discount, cap: Number(cap) || 100, uses: 0, status: "active", expires: expires || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) });
            toast.success("Promo created");
            onOpenChange(false); setCode(""); setDiscount(""); setCap("100"); setExpires("");
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateCampaignDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (c: Omit<Campaign, "id">) => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Campaign["channel"]>("email");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" /> New campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create campaign</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Campaign name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Eid cleaning rush" /></div>
          <div><Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Campaign["channel"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Name required");
            onCreate({ name, channel, status: "draft", sent: 0, opened: 0, clicked: 0, converted: 0, spend: 0 });
            toast.success("Campaign drafted");
            onOpenChange(false); setName("");
          }}>Save draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
