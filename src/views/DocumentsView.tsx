import { defineComponent, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHrisStore } from '@/stores/hris'
import { useDocStore } from '@/stores/documents'
import { useSession } from '@/stores/session'
import { onText } from '@/lib/form'
import { DOC_CATEGORIES, REQUIRED_DOCS, type DocCategory } from '@/types'
import Icon from '@/components/Icon'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
const fileIconName = (mime: string): string =>
  mime === 'application/pdf' ? 'fileText' : mime.startsWith('image/') ? 'image' : 'file'

export default defineComponent({
  name: 'DocumentsView',
  setup() {
    const store = useHrisStore()
    const docs = useDocStore()
    const session = useSession()
    const route = useRoute()

    // Employees this session may manage documents for.
    const people = computed(() => session.scopedEmployees)

    const selectedId = ref<string>(
      session.isEmployee
        ? (session.current?.id ?? '')
        : (route.query.emp as string) || people.value[0]?.id || '',
    )
    const uploadCategory = ref<DocCategory>('Signed Contract')
    const dragOver = ref(false)
    const busy = ref(false)
    const error = ref('')

    const selected = computed(() => store.getEmployee(selectedId.value))
    const myDocs = computed(() => docs.byEmployee(selectedId.value))

    const checklist = computed(() =>
      REQUIRED_DOCS.map((cat) => ({ cat, has: docs.hasCategory(selectedId.value, cat) })),
    )
    const completion = computed(() => {
      const have = checklist.value.filter((c) => c.has).length
      return Math.round((have / REQUIRED_DOCS.length) * 100)
    })

    // stats scoped to the people in view
    const scopeDocs = computed(() => {
      const ids = new Set(people.value.map((e) => e.id))
      return docs.docs.filter((d) => ids.has(d.employeeId))
    })
    const totalDocs = computed(() => scopeDocs.value.length)
    const totalBytes = computed(() => scopeDocs.value.reduce((s, d) => s + d.size, 0))
    const completeEmployees = computed(
      () => people.value.filter((e) => REQUIRED_DOCS.every((cat) => docs.hasCategory(e.id, cat))).length,
    )

    async function handleFiles(files: FileList | null): Promise<void> {
      if (!files || !selectedId.value) return
      error.value = ''
      busy.value = true
      for (const file of Array.from(files)) {
        const res = await docs.upload(selectedId.value, uploadCategory.value, file)
        if (!res.ok) error.value = res.error ?? 'Upload failed.'
      }
      busy.value = false
    }

    function onDrop(e: DragEvent): void {
      e.preventDefault()
      dragOver.value = false
      void handleFiles(e.dataTransfer?.files ?? null)
    }

    return () => (
      <>
        <div class="grid stats mb">
          <div class="card stat">
            <div class="label">Documents stored</div>
            <div class="val">{totalDocs.value}</div>
            <div class="sub">{formatSize(totalBytes.value)} in IndexedDB</div>
          </div>
          <div class="card stat">
            <div class="label">Complete 201 files</div>
            <div class="val">
              {completeEmployees.value}/{people.value.length}
            </div>
            <div class="sub">all required docs on file</div>
          </div>
          <div class="card stat">
            <div class="label">This employee</div>
            <div class="val">{completion.value}%</div>
            <div class="sub">required documents complete</div>
          </div>
          <div class="card stat">
            <div class="label">Accepted types</div>
            <div class="val" style="font-size: 18px">PDF · JPG · PNG</div>
            <div class="sub">up to 10 MB each</div>
          </div>
        </div>

        {!session.isEmployee && (
          <div class="toolbar">
            <div class="field" style="margin: 0; min-width: 260px">
              <label>Employee</label>
              <select value={selectedId.value} onChange={onText((v) => (selectedId.value = v))}>
                {people.value.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selected.value ? (
          <div class="grid two">
            {/* Upload + checklist */}
            <div>
              <div class="card pad mb">
                <div class="card-h" style="border: none; padding: 0 0 12px">
                  Upload a document
                </div>
                <div class="field">
                  <label>Document type</label>
                  <select
                    value={uploadCategory.value}
                    onChange={onText((v) => (uploadCategory.value = v as DocCategory))}
                  >
                    {DOC_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  class="dropzone"
                  style={{
                    border: dragOver.value ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                    background: dragOver.value ? 'var(--primary-soft)' : 'var(--surface-2)',
                    borderRadius: '14px',
                    padding: '26px 18px',
                    textAlign: 'center',
                    transition: '0.15s',
                  }}
                  onDragover={(e: DragEvent) => {
                    e.preventDefault()
                    dragOver.value = true
                  }}
                  onDragleave={() => (dragOver.value = false)}
                  onDrop={onDrop}
                >
                  <div style="margin-bottom: 8px; color: var(--primary)">
                    <Icon name="upload" size={30} stroke={1.6} />
                  </div>
                  <div style="font-weight: 700; margin-bottom: 4px">
                    Drag &amp; drop, or choose a file
                  </div>
                  <div class="muted" style="font-size: 12px; margin-bottom: 12px">
                    Tagged as “{uploadCategory.value}” · PDF, JPG, PNG · max 10 MB
                  </div>
                  <label class="btn sm" style="display: inline-block">
                    {busy.value ? 'Uploading…' : 'Browse files'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      style="display: none"
                      onChange={(e: Event) => {
                        const input = e.target as HTMLInputElement
                        void handleFiles(input.files)
                        input.value = ''
                      }}
                    />
                  </label>
                </div>
                {error.value && (
                  <p style="color: var(--red); font-size: 13px; margin-top: 10px">{error.value}</p>
                )}
              </div>

              <div class="card">
                <div class="card-h">
                  201 file checklist
                  <span class={['chip', completion.value === 100 ? 'green' : 'amber']}>
                    {completion.value}% complete
                  </span>
                </div>
                <table>
                  <tbody>
                    {checklist.value.map((c) => (
                      <tr key={c.cat}>
                        <td>{c.cat}</td>
                        <td class="num">
                          {c.has ? (
                            <span class="chip green">
                              <Icon name="check" size={13} /> On file
                            </span>
                          ) : (
                            <span class="chip red">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document list */}
            <div class="card">
              <div class="card-h">
                {selected.value.firstName} {selected.value.lastName}'s documents
                <span class="muted" style="font-size: 13px; font-weight: 400">
                  {myDocs.value.length} file(s)
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th class="num">Size</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myDocs.value.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span style="margin-right: 8px; color: var(--primary)">
                          <Icon name={fileIconName(d.mimeType)} size={16} />
                        </span>
                        {d.fileName}
                        <div class="muted" style="font-size: 12px; margin-left: 26px">
                          uploaded {d.uploadedOn}
                        </div>
                      </td>
                      <td>
                        <span class="chip blue">{d.category}</span>
                      </td>
                      <td class="num muted">{formatSize(d.size)}</td>
                      <td class="num">
                        <button class="btn sm ghost" onClick={() => void docs.openInTab(d.id)}>
                          <Icon name="eye" size={14} /> View
                        </button>
                        <button class="btn sm ghost" title="Download" onClick={() => void docs.download(d)}>
                          <Icon name="download" size={14} />
                        </button>
                        <button class="btn sm danger" title="Delete" onClick={() => void docs.remove(d.id)}>
                          <Icon name="trash" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myDocs.value.length === 0 && (
                    <tr>
                      <td colspan="4" class="empty">
                        No documents uploaded yet for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div class="card empty">Select an employee to manage their documents.</div>
        )}
      </>
    )
  },
})
