"use client";

import {
  CalendarDays,
  Clock,
  Users,
  Layout,
  UtensilsCrossed,
  Speaker,
  Hotel,
  FileText,
  Plus,
} from "lucide-react";
import { meetingTypes, roomLayoutOptions } from "@/types";
import type { Venue } from "@/types";
import type { BookingFormData } from "../BookingWizard";

interface ComposeMeetingProps {
  venue: Venue;
  formData: BookingFormData;
  updateForm: (partial: Partial<BookingFormData>) => void;
}

export default function ComposeMeeting({ venue, formData, updateForm }: ComposeMeetingProps) {
  return (
    <div className="space-y-6">
      {/* Date & Time */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-om-orange" />
          Date & Time
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateForm({ date: e.target.value })}
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Time of</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="time"
                value={formData.timeFrom}
                onChange={(e) => updateForm({ timeFrom: e.target.value })}
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Time to</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="time"
                value={formData.timeTo}
                onChange={(e) => updateForm({ timeTo: e.target.value })}
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!formData.isMultiDay}
              onChange={() => updateForm({ isMultiDay: false })}
              className="accent-[#FF6B35]"
            />
            <span className="text-sm text-white/80">Single day</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={formData.isMultiDay}
              onChange={() => updateForm({ isMultiDay: true })}
              className="accent-[#FF6B35]"
            />
            <span className="text-sm text-white/80">Multiple consecutive days</span>
          </label>
        </div>

        {formData.isMultiDay && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-1.5">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateForm({ endDate: e.target.value })}
              className="glass-input w-full max-w-xs px-4 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Meeting Type & Layout */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Layout className="h-4 w-4 text-om-orange" />
          Meeting Setup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Meeting type</label>
            <select
              value={formData.meetingType}
              onChange={(e) => updateForm({ meetingType: e.target.value })}
              className="glass-select w-full px-4 py-2.5 text-sm"
            >
              <option value="">Select</option>
              {meetingTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Number of persons *</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="number"
                min={1}
                max={venue.capacity}
                value={formData.attendees}
                onChange={(e) => updateForm({ attendees: Number(e.target.value) })}
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
            <p className="text-xs mt-1 text-white/40">Max capacity: {venue.capacity}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-1.5">Room layout</label>
          <select
            value={formData.roomLayout}
            onChange={(e) => updateForm({ roomLayout: e.target.value })}
            className="glass-select w-full max-w-xs px-4 py-2.5 text-sm"
          >
            <option value="">Select</option>
            {roomLayoutOptions.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => updateForm({ needsSubRooms: !formData.needsSubRooms })}
          className="flex items-center gap-2 text-sm text-om-orange hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          I need sub-rooms
        </button>
      </div>

      {/* Program */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-om-orange" />
          Program & Requirements
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-1.5">
            What is the program during the meeting?
          </label>
          <textarea
            value={formData.programDescription}
            onChange={(e) => updateForm({ programDescription: e.target.value })}
            placeholder="Maximum 500 characters"
            maxLength={500}
            rows={3}
            className="glass-input w-full px-4 py-3 text-sm resize-none"
          />
          <p className="text-xs mt-1 text-white/30">
            {500 - formData.programDescription.length} characters remaining
          </p>
        </div>
      </div>

      {/* Catering */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-om-orange" />
          Catering
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["breakfast", "lunch", "drinks", "dinner"] as const).map((item) => (
            <label
              key={item}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.catering[item]
                  ? "bg-om-orange/10 border-om-orange/30"
                  : "bg-white/[0.03] border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.catering[item]}
                onChange={() =>
                  updateForm({
                    catering: { ...formData.catering, [item]: !formData.catering[item] },
                  })
                }
                className="accent-[#FF6B35] w-4 h-4"
              />
              <span className="text-sm text-white capitalize">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AV Resources */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Speaker className="h-4 w-4 text-om-orange" />
          Audiovisual resources
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { key: "projector", label: "Projector" },
            { key: "flip_chart", label: "Flip chart" },
            { key: "microphone", label: "Microphone" },
            { key: "sound_system", label: "Sound system" },
          ] as const).map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.avResources[item.key]
                  ? "bg-om-orange/10 border-om-orange/30"
                  : "bg-white/[0.03] border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.avResources[item.key]}
                onChange={() =>
                  updateForm({
                    avResources: {
                      ...formData.avResources,
                      [item.key]: !formData.avResources[item.key],
                    },
                  })
                }
                className="accent-[#FF6B35] w-4 h-4"
              />
              <span className="text-sm text-white">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hotel Rooms */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Hotel className="h-4 w-4 text-om-orange" />
          Hotel rooms
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Request one or more hotel rooms with your quote request.
        </p>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.needsHotelRooms}
            onChange={() => updateForm({ needsHotelRooms: !formData.needsHotelRooms })}
            className="accent-[#FF6B35] w-4 h-4"
          />
          <span className="text-sm text-white">Yes, I need hotel rooms</span>
        </label>
        {formData.needsHotelRooms && (
          <textarea
            value={formData.hotelRoomDetails}
            onChange={(e) => updateForm({ hotelRoomDetails: e.target.value })}
            placeholder="How many rooms, single/double, check-in/out dates..."
            rows={2}
            className="glass-input w-full mt-3 px-4 py-3 text-sm resize-none"
          />
        )}
      </div>

      {/* Other considerations */}
      <div className="glass-card p-6">
        <label className="block text-sm font-medium text-white mb-1.5">
          Other things to consider?
        </label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => updateForm({ specialRequests: e.target.value })}
          placeholder="Any special requirements, dietary needs..."
          maxLength={500}
          rows={3}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
        />
        <p className="text-xs mt-1 text-white/30">
          {500 - formData.specialRequests.length} characters remaining
        </p>
      </div>
    </div>
  );
}
