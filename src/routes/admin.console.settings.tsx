import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings as SettingsIcon, Building2, Globe, Bell, Plug, Save,
  CreditCard, Mail, Phone, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/console/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Settings"
        title="Platform settings"
        description="Business info, regional defaults, notifications, and integrations."
      />

      <Tabs defaultValue="general">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="general"><Building2 className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="regional"><Globe className="h-3.5 w-3.5" /> Regional</TabsTrigger>
          <TabsTrigger value="booking"><CreditCard className="h-3.5 w-3.5" /> Booking</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="h-3.5 w-3.5" /> Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="regional"><RegionalTab /></TabsContent>
        <TabsContent value="booking"><BookingTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ icon: Icon, title, description, children, footer }: { icon: typeof SettingsIcon; title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
      {footer && <div className="flex justify-end border-t border-border p-4">{footer}</div>}
    </div>
  );
}

function GeneralTab() {
  const [name, setName] = useState("ServiceHub Bangladesh");
  const [email, setEmail] = useState("hello@servicehub.bd");
  const [phone, setPhone] = useState("+880 1700-000000");
  const [address, setAddress] = useState("House 12, Road 4, Dhanmondi, Dhaka 1205");
  return (
    <Card icon={Building2} title="Business information" description="Shown on invoices and customer receipts." footer={<Button onClick={() => toast.success("Saved")}><Save className="h-3.5 w-3.5" /> Save</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Business name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label><Mail className="mr-1 inline h-3 w-3" />Support email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label><Phone className="mr-1 inline h-3 w-3" />Support phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label><MapPin className="mr-1 inline h-3 w-3" />Address</Label><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      </div>
    </Card>
  );
}

function RegionalTab() {
  const [currency, setCurrency] = useState("BDT");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [language, setLanguage] = useState("en");
  const [taxRate, setTaxRate] = useState("0");
  return (
    <Card icon={Globe} title="Regional & tax" description="Defaults applied to all transactions and dates." footer={<Button onClick={() => toast.success("Regional saved")}><Save className="h-3.5 w-3.5" /> Save</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BDT">৳ BDT — Bangladeshi Taka</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">€ EUR</SelectItem>
              <SelectItem value="INR">₹ INR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Dhaka">Asia/Dhaka (UTC+6)</SelectItem>
              <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Date format</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Default language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="bn">বাংলা — Bengali</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>VAT / Tax rate (%)</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
      </div>
    </Card>
  );
}

function BookingTab() {
  const [allowGuest, setAllowGuest] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [requirePhone, setRequirePhone] = useState(true);
  const [leadTime, setLeadTime] = useState("2");
  const [cancelHours, setCancelHours] = useState("4");
  const [defaultCommission, setDefaultCommission] = useState("15");
  return (
    <Card icon={CreditCard} title="Booking rules" description="Control how customers book and how providers are matched." footer={<Button onClick={() => toast.success("Booking rules saved")}><Save className="h-3.5 w-3.5" /> Save</Button>}>
      <div className="space-y-3">
        <ToggleRow label="Allow guest bookings" description="Customers can book without creating an account" value={allowGuest} onChange={setAllowGuest} />
        <ToggleRow label="Auto-assign providers" description="Match the closest available provider automatically" value={autoAssign} onChange={setAutoAssign} />
        <ToggleRow label="Require phone verification" description="Send OTP before confirming a booking" value={requirePhone} onChange={setRequirePhone} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div><Label>Min lead time (hours)</Label><Input type="number" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} /></div>
        <div><Label>Free cancel window (hours)</Label><Input type="number" value={cancelHours} onChange={(e) => setCancelHours(e.target.value)} /></div>
        <div><Label>Default commission (%)</Label><Input type="number" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} /></div>
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [providerNotify, setProviderNotify] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  return (
    <Card icon={Bell} title="Notification preferences" description="Defaults for transactional and digest alerts." footer={<Button onClick={() => toast.success("Notification prefs saved")}><Save className="h-3.5 w-3.5" /> Save</Button>}>
      <div className="space-y-3">
        <ToggleRow label="Email receipts to customers" description="On payment confirmation" value={emailReceipts} onChange={setEmailReceipts} />
        <ToggleRow label="SMS alerts" description="Booking confirmations, OTPs, status updates" value={smsAlerts} onChange={setSmsAlerts} />
        <ToggleRow label="Notify providers of new leads" description="Push + SMS within 60s of unassigned booking" value={providerNotify} onChange={setProviderNotify} />
        <ToggleRow label="Admin daily digest" description="Summary of bookings, revenue, and applications" value={dailyDigest} onChange={setDailyDigest} />
      </div>
    </Card>
  );
}

function IntegrationsTab() {
  const integrations = [
    { id: "stripe", name: "Stripe", description: "Card payments worldwide", connected: false },
    { id: "bkash", name: "bKash", description: "Bangladesh's leading mobile wallet", connected: true },
    { id: "nagad", name: "Nagad", description: "Mobile financial service", connected: true },
    { id: "twilio", name: "Twilio SMS", description: "Programmable messaging & OTP", connected: true },
    { id: "sendgrid", name: "SendGrid", description: "Transactional email", connected: false },
    { id: "google", name: "Google Maps", description: "Geocoding & routing", connected: true },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {integrations.map((i) => (
        <div key={i.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{i.name}</span>
              {i.connected && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Live</span>}
            </div>
            <div className="text-xs text-muted-foreground">{i.description}</div>
          </div>
          <Button size="sm" variant={i.connected ? "outline" : "default"} onClick={() => toast.success(i.connected ? `${i.name} disconnected` : `${i.name} connected`)}>
            {i.connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      ))}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}
