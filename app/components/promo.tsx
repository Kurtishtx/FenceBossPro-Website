'use client';
/* Offer codes on sign-up (11/17: GROUP3 for Facebook groups, plus SAVE50-XXXXXX codes).
 *
 * Every SprayBossPro sign-up form on this site (SignupModal + the copies inlined in ~28 pages)
 * renders <PromoCodeField n={n} /> in step 1, sends promoCodeFor(n) to manage-users 'create',
 * and calls promoAfterSignup(n, result) on success. The code is optional and never blocks a
 * signup: manage-users ignores a bad one and returns promo.message, which we show.
 *
 * Prefill order: ?code= in the URL (the button in the code email), then the code this browser
 * got from the exit popup (localStorage). */
import { useEffect, useRef } from 'react';

export const PROMO_FN = 'https://knjdbgroiyhvqwrpqzcx.supabase.co/functions/v1/promo-capture';
export const PROMO_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
export const LS_SEEN = 'sbp_promo_offer_seen';
export const LS_CODE = 'sbp_promo_code';
export const LS_SIGNED_UP = 'sbp_signed_up';

export function lsGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
export function lsSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }

const CODE_RE = /^SAVE50-[A-Z2-9]{6}$/;

// The code to prefill, if any.
export function prefillCode(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('code');
    if (q) return q.trim().toUpperCase().slice(0, 20);
  } catch { /* ignore */ }
  const saved = (lsGet(LS_CODE) || '').toUpperCase();
  return CODE_RE.test(saved) ? saved : '';
}

// Fill every code box on the page (the popup's "Start your free trial" uses this).
export function fillPromoInputs(code: string) {
  document.querySelectorAll<HTMLInputElement>('input[data-sbp-promo]').forEach((el) => { if (!el.value) el.value = code; });
}

export function promoCodeFor(n: number): string {
  const el = document.getElementById('sbp' + n + '-promo') as HTMLInputElement | null;
  return (el?.value || '').trim();
}

// After a successful signup: remember it (no more popups) and say what happened to the code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function promoAfterSignup(n: number, result: any) {
  lsSet(LS_SIGNED_UP, '1');
  const msg = result?.promo?.message;
  if (!msg) return;
  const box = document.getElementById('sbp' + n + '-success');
  if (!box) return;
  const p = document.createElement('div');
  p.setAttribute('role', 'status');
  p.style.cssText = 'margin:12px auto 0;max-width:330px;font-size:13px;font-weight:600;line-height:1.5;color:' + (result.promo.applied ? '#15803d' : '#9a3412');
  p.textContent = msg;
  const cd = document.getElementById('sbp' + n + '-countdown');
  if (cd && cd.parentNode === box) box.insertBefore(p, cd); else box.appendChild(p);
}

const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: '#333', textTransform: 'uppercase', boxSizing: 'border-box' };

export function PromoCodeField({ n }: { n: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const checked = useRef('');

  const check = () => {
    const el = ref.current, note = noteRef.current;
    if (!el || !note) return;
    const v = el.value.trim();
    if (v === checked.current) return;
    checked.current = v;
    if (!v) { note.style.display = 'none'; return; }
    fetch(PROMO_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PROMO_ANON },
      body: JSON.stringify({ action: 'check', code: v, product: 'fencebosspro' }),
    }).then((r) => r.json()).then((d) => {
      if (!d?.message || el.value.trim() !== v) return;
      note.textContent = d.message;
      note.style.color = d.valid ? '#15803d' : '#9a3412';
      note.style.display = 'block';
    }).catch(() => { /* the real check happens at signup */ });
  };

  useEffect(() => {
    const c = prefillCode();
    if (c && ref.current && !ref.current.value) { ref.current.value = c; check(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginBottom: '18px' }}>
      <label htmlFor={`sbp${n}-promo`} style={labelStyle}>Offer code <span style={{ textTransform: 'none', fontWeight: 400, color: '#999' }}>(optional)</span></label>
      <input id={`sbp${n}-promo`} data-sbp-promo="1" ref={ref} type="text" placeholder="Example: GROUP3" autoComplete="off" spellCheck={false} autoCapitalize="characters" maxLength={20} onBlur={check} style={inputStyle} />
      <div ref={noteRef} aria-live="polite" style={{ display: 'none', fontSize: '12px', marginTop: '5px', lineHeight: 1.4 }}></div>
    </div>
  );
}
