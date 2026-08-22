import React from "react";
import { useDistrictMutations } from "@/features/district-admin/hooks/useDistrictAdminData";
import { Announcement } from "@/services/district/types";

export interface AnnouncementFormInput {
  title: string;
  message: string;
  audience: "staff" | "hospitals";
  targetIds: string[];
}

export const AnnouncementComposer: React.FC<{
  districtId: string;
  onAnnouncementPublished?: (ann: Announcement) => void;
}> = ({ districtId, onAnnouncementPublished }) => {
  const { publishAnnouncement } = useDistrictMutations();
  const [form, setForm] = React.useState<AnnouncementFormInput>({
    title: "",
    message: "",
    audience: "staff",
    targetIds: [],
  });
  const [show, setShow] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    publishAnnouncement(
      {
        title: form.title,
        message: form.message,
        audience: form.audience,
        targetIds: form.targetIds,
      },
      { id: "dadm_001", name: "District Admin", role: "District Admin" }
    );
    setShow(false);
    onAnnouncementPublished?.(form);
  };

  return (
    <div className="rounded-card border border-ink-200 p-6 shadow-card">
      <h3 className="font-medium text-ink-900 mb-4">Publish Announcement</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">Title</label>
          <input
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value as string }))
            }
            required
            className="w-full rounded border border-ink-200 px-3 py-2 focus-outline"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">Message</label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value as string }))
            }
            rows={3}
            required
            className="w-full rounded border border-ink-200 px-3 py-2 focus-outline resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-500 mb-1">Audience</label>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm((f) => ({ ...f, audience: e.target.value as AnnouncementFormInput["audience"] }))
              }
              className="w-full rounded border border-ink-200 px-3 py-2 focus-outline"
            >
              <option value="staff">Staff</option>
              <option value="hospitals">Hospitals</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">Target Hospitals</label>
            <select
              multiple
              value={form.targetIds.join(",")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targetIds: (e.target.value as string).split(",").map((v: string) => v.trim()).filter((v: string) => v.length > 0),
                }))
              }
              className="w-full rounded border border-ink-200 px-3 py-2 focus-outline"
            >
              <option value="hos_001">General Hospital</option>
              <option value="hos_002">Coimbatore Medical</option>
              <option value="hos_003">District Hospital</option>
              <option value="hos_004">Taluk Hospital</option>
              <option value="hos_005">Women & Children</option>
              <option value="hos_006">City Hospital</option>
              <option value="hos_007">Rural Hospital</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-700 focus-outline focus-outline-brand-600"
        >
          Publish Announcement
        </button>
      </form>
    </div>
  );
};