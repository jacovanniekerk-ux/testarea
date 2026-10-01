/*
 * school-tech-edit.js
 * ------------------------------------------------------------------
 * The "Edit school technology" modal used from the Culture Walkthrough
 * page's infrastructure cards. School-issued technology (computer
 * labs, smart classrooms, learner devices, connectivity) can fall out
 * of date as a school's own resourcing changes, so this lets an
 * advisor correct it on the spot — in two steps:
 *
 *   1. An editable card, pre-filled with the 4 current values.
 *   2. On "Submit Changes", a confirmation step listing exactly what
 *      will change (old -> new, only for fields actually edited) and
 *      warning that this is a permanent, shared update — not specific
 *      to this walkthrough.
 *
 * Saving calls updateSchoolTechnology() in schools.js, which updates
 * the schools row AND writes an audit entry per changed field
 * (who / what / when) in one atomic call. See
 * sql/school_technology_edits_setup.sql for the database side.
 *
 * Usage:
 *   openSchoolTechEditModal({
 *     school,                  // the cached school row (cemis_number, school_name, computer_labs, ...)
 *     advisor,                 // { id, full_name }
 *     onSaved(updatedSchool),  // called once, right after a successful save
 *   });
 */
import { updateSchoolTechnology } from './schools.js';

const FIELD_META = [
  { key: 'computer_labs', label: 'Computer Labs', placeholder: 'e.g. 1, or "None"' },
  { key: 'smart_classrooms', label: 'Smart Classrooms', placeholder: 'e.g. 4' },
  { key: 'learner_devices', label: 'Learner Devices', placeholder: 'e.g. 1:1 tablets, or "None"' },
  { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Fibre, LTE, None' },
];

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// What the cards already show for a blank value (schools.js / the
// cards render missing values as "None") — matched here so the
// editable form and the confirmation screen agree with what the
// advisor is used to seeing.
const displayValue = (v) => (v === null || v === undefined || String(v).trim() === '' ? '' : String(v));

export function openSchoolTechEditModal({ school, advisor, onSaved }) {
  document.getElementById('school-tech-edit-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'school-tech-edit-modal';
  overlay.className = 'no-print fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  document.body.appendChild(overlay);

  let step = 'edit'; // 'edit' | 'confirm' | 'saving' | 'done' | 'error'
  let errorMessage = '';
  const values = {};
  FIELD_META.forEach((f) => { values[f.key] = displayValue(school[f.key]); });

  function changedEntries() {
    return FIELD_META.filter((f) => displayValue(school[f.key]) !== values[f.key].trim()).map((f) => ({
      ...f,
      oldValue: displayValue(school[f.key]),
      newValue: values[f.key].trim(),
    }));
  }

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape' && step !== 'saving') close();
  }
  document.addEventListener('keydown', onKey);

  function renderEditStep() {
    const fieldsHtml = FIELD_META.map(
      (f) => `
        <div>
          <label class="field-label block mb-1">${esc(f.label)}</label>
          <input type="text" data-tech-field="${f.key}" value="${esc(values[f.key])}" placeholder="${esc(f.placeholder)}"
                 class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
        </div>`
    ).join('');

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 pt-6 pb-4">
          <div class="flex items-center gap-2 mb-1">
            <i class="fa-solid fa-pen text-[#001489]"></i>
            <h2 class="text-sm font-black text-[#001489]">Edit School Technology</h2>
          </div>
          <p class="text-xs text-slate-500">${esc(school.school_name || 'This school')} — correct these if the school's actual resourcing has changed.</p>
        </div>
        <div class="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3">${fieldsHtml}</div>
        ${errorMessage ? `<p class="px-6 pt-3 text-xs font-semibold text-red-600">${esc(errorMessage)}</p>` : ''}
        <div class="px-6 py-4 mt-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button type="button" data-close class="text-xs font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
          <button type="button" data-next class="btn-primary font-extrabold text-xs px-5 py-2.5 rounded-lg transition uppercase">Submit Changes</button>
        </div>
      </div>`;

    overlay.querySelector('[data-close]').addEventListener('click', close);
    overlay.querySelectorAll('[data-tech-field]').forEach((input) => {
      input.addEventListener('input', (e) => { values[e.target.getAttribute('data-tech-field')] = e.target.value; });
    });
    overlay.querySelector('[data-next]').addEventListener('click', () => {
      const changes = changedEntries();
      if (changes.length === 0) {
        errorMessage = 'No changes to submit — edit at least one field first.';
        renderEditStep();
        return;
      }
      errorMessage = '';
      step = 'confirm';
      renderConfirmStep(changes);
    });
  }

  function renderConfirmStep(changes) {
    const rows = changes
      .map(
        (c) => `
        <div class="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
          <span class="text-xs font-bold text-slate-600 shrink-0">${esc(c.label)}</span>
          <span class="text-xs text-right">
            <span class="text-slate-400 line-through">${esc(c.oldValue || 'None')}</span>
            <i class="fa-solid fa-arrow-right mx-1.5 text-slate-300"></i>
            <span class="font-bold text-[#001489]">${esc(c.newValue || 'None')}</span>
          </span>
        </div>`
      )
      .join('');

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="px-6 pt-6 pb-4 text-center">
          <div class="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-3">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 class="text-base font-black text-[#001489]">Confirm permanent update</h2>
          <p class="text-xs text-slate-500 mt-1">This changes the school's technology record for everyone, not just this walkthrough. Are you sure?</p>
        </div>
        <div class="px-6">${rows}</div>
        ${step === 'error' && errorMessage ? `<p class="px-6 pt-3 text-xs font-semibold text-red-600">${esc(errorMessage)}</p>` : ''}
        <div class="px-6 py-4 mt-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button type="button" data-back class="text-xs font-bold text-slate-500 hover:text-slate-700 transition">Back</button>
          <button type="button" data-confirm
            class="font-extrabold text-xs px-5 py-2.5 rounded-lg transition uppercase text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
            <span>Yes, Update Permanently</span>
          </button>
        </div>
      </div>`;

    overlay.querySelector('[data-back]').addEventListener('click', () => { step = 'edit'; renderEditStep(); });
    overlay.querySelector('[data-confirm]').addEventListener('click', () => save(changes));
  }

  function renderSaving() {
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden px-6 py-10 text-center">
        <i class="fa-solid fa-spinner fa-spin text-2xl text-[#001489] mb-3"></i>
        <p class="text-xs font-semibold text-slate-600">Saving changes…</p>
      </div>`;
  }

  function renderDone() {
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden px-6 py-10 text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-3">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <p class="text-sm font-bold text-slate-800">Technology record updated.</p>
      </div>`;
    setTimeout(close, 1100);
  }

  async function save(changes) {
    step = 'saving';
    renderSaving();

    const payload = {};
    changes.forEach((c) => { payload[c.key] = c.newValue; });

    const { data, error } = await updateSchoolTechnology({
      cemisNumber: school.cemis_number,
      changes: payload,
      advisorId: advisor ? advisor.id : null,
      advisorName: advisor ? advisor.full_name : null,
    });

    if (error || !data) {
      step = 'error';
      errorMessage = `Could not save: ${error ? error.message : 'unknown error'}`;
      renderConfirmStep(changes);
      return;
    }

    onSaved && onSaved(data);
    step = 'done';
    renderDone();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && step !== 'saving') close();
  });

  renderEditStep();
  overlay.querySelector('[data-tech-field]')?.focus();
}
