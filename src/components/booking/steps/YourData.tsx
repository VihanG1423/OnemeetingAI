"use client";

import {
  Building2,
  User,
  Mail,
  Phone,
  UserCheck,
  Receipt,
  Leaf,
} from "lucide-react";
import type { BookingFormData } from "../BookingWizard";

interface YourDataProps {
  formData: BookingFormData;
  updateForm: (partial: Partial<BookingFormData>) => void;
}

export default function YourData({ formData, updateForm }: YourDataProps) {
  return (
    <div className="space-y-6">
      {/* Contact info */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-5">Contact Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Company name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateForm({ companyName: e.target.value })}
                placeholder="Your company"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Your name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => updateForm({ contactName: e.target.value })}
                placeholder="Full name"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateForm({ contactEmail: e.target.value })}
                placeholder="you@company.com"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Phone number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateForm({ contactPhone: e.target.value })}
                placeholder="+31 6 12345678"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-white mb-1.5">CC email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              value={formData.ccEmail}
              onChange={(e) => updateForm({ ccEmail: e.target.value })}
              placeholder="For multiple recipients: info@info.nl; sd@info.nl"
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">On-site contact person</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={formData.onsiteContactPerson}
                onChange={(e) => updateForm({ onsiteContactPerson: e.target.value })}
                placeholder="Contact person at venue"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Invoice reference</label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={formData.invoiceReference}
                onChange={(e) => updateForm({ invoiceReference: e.target.value })}
                placeholder="PO number or reference"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Climate Neutral */}
      <div className="rounded-2xl p-6 bg-green-500/10 border border-green-500/20">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-400" />
          Climate neutral
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          We have calculated the CO2 emissions for each event. For a small contribution, you can voluntarily offset
          the emissions from your meeting by investing in verified carbon offset projects. At OneMeeting, we believe
          it&apos;s important to contribute to a better and cleaner world.
        </p>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.climateNeutral}
            onChange={() => updateForm({ climateNeutral: !formData.climateNeutral })}
            className="accent-green-500 w-5 h-5"
          />
          <span className="text-sm font-medium text-green-300">
            Yes, I want a climate-neutral arrangement
          </span>
        </label>
      </div>
    </div>
  );
}
