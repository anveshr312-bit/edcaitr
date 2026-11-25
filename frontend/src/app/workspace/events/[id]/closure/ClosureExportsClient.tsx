'use client';

import { useState, type FormEvent } from 'react';
import ImageUploadField from '../../../../../components/ImageUploadField';

interface Highlight {
  id: string;
  title: string;
  caption: string | null;
  media_type: string;
  media_ref: string;
  is_published: boolean;
}

interface Manual {
  id: string;
  title: string;
  description: string | null;
  file_ref: string;
  file_size_kb: number | null;
  is_public: boolean;
}

export default function ClosureExportsClient({
  event,
  initialHighlights,
  initialManuals,
  initialCertCount,
}: {
  event: {
    id: string;
    status: string;
    drive_folder_url: string | null;
    final_report_url: string | null;
  };
  initialHighlights: Highlight[];
  initialManuals: Manual[];
  initialCertCount: number;
}) {
  const [status, setStatus] = useState(event.status);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [manuals, setManuals] = useState<Manual[]>(initialManuals);
  const [certCount, setCertCount] = useState(initialCertCount);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Manual form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualSizeKb, setManualSizeKb] = useState('');
  const [manualPublic, setManualPublic] = useState(true);

  // Highlight form
  const [hlTitle, setHlTitle] = useState('');
  const [hlCaption, setHlCaption] = useState('');
  const [hlType, setHlType] = useState<'image' | 'video'>('image');
  const [hlRef, setHlRef] = useState('');
  const [hlPublished, setHlPublished] = useState(true);

  // Closure / Reopen
  const [reopenReason, setReopenReason] = useState('');
  const [driveUrl, setDriveUrl] = useState(event.drive_folder_url ?? '');
  const [reportUrl, setReportUrl] = useState(event.final_report_url ?? '');

  async function addManual(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/manuals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle,
          description: manualDesc,
          file_ref: manualRef,
          file_size_kb: manualSizeKb ? Number(manualSizeKb) : null,
          is_public: manualPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add manual.');
      setManuals((prev) => [...prev, data.manual]);
      setManualTitle('');
      setManualDesc('');
      setManualRef('');
      setManualSizeKb('');
      setMessage('Manual added.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  async function addHighlight(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hlTitle,
          caption: hlCaption,
          media_type: hlType,
          media_ref: hlRef,
          is_published: hlPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add highlight.');
      setHighlights((prev) => [...prev, data.highlight]);
      setHlTitle('');
      setHlCaption('');
      setHlRef('');
      setMessage('Highlight added.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleHighlightPublish(h: Highlight) {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/highlights`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlight_id: h.id, is_published: !h.is_published }),
      });
      if (res.ok) {
        setHighlights((prev) =>
          prev.map((x) => (x.id === h.id ? { ...x, is_published: !x.is_published } : x))
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function issueCertificates(onlyAttended: boolean) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/certificates/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ only_attended: onlyAttended }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Certificate issuance failed.');
      setCertCount((c) => c + Number(data.issued_count ?? 0));
      setMessage(`Issued ${data.issued_count} new certificate(s).`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  async function saveLinks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_folder_url: driveUrl || null,
          final_report_url: reportUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save internal links.');
      setMessage('Internal Drive & report links saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  async function transition(action: 'close' | 'archive' | 'reopen') {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/closure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reopenReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Transition failed.');
      setStatus(action === 'close' ? 'closed' : action === 'archive' ? 'archived' : 'wrap_up');
      setReopenReason('');
      setMessage(`Event ${action} completed.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {message && (
        <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', fontWeight: 500, margin: 0 }}>
          {message}
        </p>
      )}

      {/* Manuals */}
      <section className="card">
        <h2>Event Manuals &amp; Handbooks</h2>
        <p className="mono-meta" style={{ margin: 0 }}>
          Documents guideline: PDF, DOCX, or PPTX · Max 10 MB (or shared Google Drive link)
        </p>
        {manuals.length > 0 && (
          <ul style={{ paddingLeft: 18 }}>
            {manuals.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong> ({m.is_public ? 'Public' : 'Internal'})
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addManual}>
          <label>
            Manual Title *
            <input type="text" required value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="e.g. Participant Rulebook" />
          </label>
          <label>
            Description
            <input type="text" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} />
          </label>
          <label>
            Document URL / Link *
            <input type="url" required value={manualRef} onChange={(e) => setManualRef(e.target.value)} placeholder="https://drive.google.com/..." />
          </label>
          <label>
            File Size (KB, optional)
            <input type="number" min={1} max={10240} value={manualSizeKb} onChange={(e) => setManualSizeKb(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={manualPublic} onChange={(e) => setManualPublic(e.target.checked)} style={{ width: 'auto' }} />
            Visible on public event page &amp; Participant Portal
          </label>
          <button type="submit" disabled={busy}>Add Manual</button>
        </form>
      </section>

      {/* Post-Event Highlights */}
      <section className="card">
        <h2>Post-Event Highlights</h2>
        {highlights.length > 0 && (
          <ul style={{ paddingLeft: 18 }}>
            {highlights.map((h) => (
              <li key={h.id} style={{ marginBottom: 6 }}>
                <strong>{h.title}</strong> [{h.media_type}] — {h.is_published ? 'Published' : 'Hidden'}{' '}
                <button type="button" disabled={busy} onClick={() => void toggleHighlightPublish(h)} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>
                  {h.is_published ? 'Unpublish' : 'Publish'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addHighlight}>
          <label>
            Highlight Title *
            <input type="text" required value={hlTitle} onChange={(e) => setHlTitle(e.target.value)} />
          </label>
          <label>
            Caption
            <input type="text" value={hlCaption} onChange={(e) => setHlCaption(e.target.value)} />
          </label>
          <label>
            Media Type
            <select value={hlType} onChange={(e) => setHlType(e.target.value as 'image' | 'video')}>
              <option value="image">Image (Auto-WebP)</option>
              <option value="video">Video Link</option>
            </select>
          </label>
          {hlType === 'image' ? (
            <ImageUploadField label="Highlight Image *" folder="highlights" value={hlRef} onChange={setHlRef} />
          ) : (
            <label>
              Video URL * <span className="mono-meta">(Recommended ratio: 16:9 or 9:16 · Max 100 MB in Drive)</span>
              <input type="url" required value={hlRef} onChange={(e) => setHlRef(e.target.value)} placeholder="https://drive.google.com/..." />
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={hlPublished} onChange={(e) => setHlPublished(e.target.checked)} style={{ width: 'auto' }} />
            Publish immediately on public &amp; participant event page
          </label>
          <button type="submit" disabled={busy || !hlRef}>Add Highlight</button>
        </form>
      </section>

      {/* Certificates & Exports */}
      <section className="card">
        <h2>Certificates &amp; Exports</h2>
        <p className="mono-meta" style={{ margin: 0 }}>Certificates issued so far: {certCount}</p>
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void issueCertificates(true)}>
            Issue Certificates (Checked-in Only)
          </button>
          <button type="button" disabled={busy} onClick={() => void issueCertificates(false)}>
            Issue to All Confirmed
          </button>
        </div>

        <div className="actions-row" style={{ marginTop: 12 }}>
          <a href={`/api/events/${event.id}/exports/tasks?format=xlsx`} className="btn">Tasks (.xlsx)</a>
          <a href={`/api/events/${event.id}/exports/tasks?format=pdf`} className="btn">Tasks (.pdf)</a>
          <a href={`/api/events/${event.id}/exports/registrations?format=xlsx`} className="btn">Registrations (.xlsx)</a>
          <a href={`/api/events/${event.id}/exports/attendance?format=xlsx`} className="btn">Attendance (.xlsx)</a>
          <a href={`/api/events/${event.id}/exports/attendance?format=pdf`} className="btn">Attendance (.pdf)</a>
        </div>
      </section>

      {/* Internal Records & Closure */}
      <section className="card">
        <h2>Event Closure &amp; Internal Records (Current status: {status})</h2>
        <form onSubmit={saveLinks}>
          <label>
            Internal Google Drive Folder URL (admin-only)
            <input type="url" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
          </label>
          <label>
            Final Event Report URL (admin-only)
            <input type="url" value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>Save Internal Links</button>
        </form>

        <div className="actions-row">
          {status !== 'closed' && status !== 'archived' && (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void transition('close')}>
              Close Event (Stop Registrations &amp; Check-ins)
            </button>
          )}
          {status === 'closed' && (
            <button type="button" disabled={busy} onClick={() => void transition('archive')}>
              Archive Event
            </button>
          )}
        </div>

        {(status === 'closed' || status === 'archived') && (
          <div style={{ display: 'grid', gap: 8, marginTop: 12, maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Recorded reason to reopen (min 5 chars)"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
            />
            <button type="button" disabled={busy || reopenReason.trim().length < 5} onClick={() => void transition('reopen')}>
              Reopen Event
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
