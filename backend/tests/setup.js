/**
 * Test setup helpers for InsForge PostgreSQL-based integration tests.
 *
 * Design: A SINGLETON mock client is created once for the process lifetime.
 * All test files import { insforgeMock } and register it as their module mock.
 * This ensures the same in-memory store is shared across the app import chain.
 */

import { jest } from "@jest/globals";

/** Shared in-memory store — keyed by table name. */
export const store = {
  users:   [],
  foods:   [],
  orders:  [],
  coupons: [],
  notifications: [],
  coupon_uses: [],
  rider_locations: [],
};

/** Reset all tables between tests. */
export const clearDatabase = () => {
  store.users   = [];
  store.foods   = [];
  store.orders  = [];
  store.coupons = [];
  store.notifications = [];
  store.coupon_uses = [];
  store.rider_locations = [];
};

/** No-op helpers kept for API compatibility. */
export const connect       = async () => {};
export const closeDatabase = async () => {};

// ── Query builder ─────────────────────────────────────────────────────────────

const makeQuery = (table) => {
  let _filters       = [];
  let _isUpdate      = false;
  let _isDelete      = false;
  let _isInsert      = false;
  let _insertPayload = null;
  let _updatePayload = null;
  let _single        = false;

  const chain = {
    select:      ()        => chain,
    insert:      (rows)    => { _isInsert = true; _insertPayload = rows; return chain; },
    update:      (payload) => { _isUpdate = true; _updatePayload = payload; return chain; },
    delete:      ()        => { _isDelete = true; return chain; },
    eq:          (col, val)=> { _filters.push({ col, val, op: 'eq' }); return chain; },
    is:          (col, val)=> { _filters.push({ col, val, op: 'is' }); return chain; },
    gt:          ()        => chain,
    order:       ()        => chain,
    range:       ()        => chain,
    maybeSingle: ()        => { _single = true; return chain; },
    single:      ()        => { _single = true; return chain; },
    onConflict:  ()        => chain,
    upsert:      (payload) => { _isInsert = true; _insertPayload = payload; return chain; },
    in:          ()        => chain,

    // Thenable so await works
    then: (resolve) => {
      const rows = store[table] || [];

      // ── INSERT ──────────────────────────────────────────────────────────────
      if (_isInsert) {
        // SDK accepts single object OR array — normalise to array
        const payloadArr = Array.isArray(_insertPayload) ? _insertPayload : [_insertPayload];
        const newRows = payloadArr.map((r) => ({
          id:           `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          created_at:   new Date().toISOString(),
          // food defaults
          is_deleted:   false,
          is_available: true,
          stock_count:  100,
          // user defaults
          role:         'user',
          cart_data:    {},
          addresses:    [],
          // order defaults
          status:       'Food Processing',
          payment:      false,
          ...r,
        }));
        store[table].push(...newRows);
        // When .maybeSingle() is chained, return first row; otherwise return array
        const result = _single ? newRows[0] : newRows;
        return resolve({ data: result, error: null });
      }

      const matches = () =>
        rows.filter((row) =>
          _filters.every(({ col, val, op }) => {
            if (op === 'is') return row[col] === val;   // strict equality for booleans/null
            return String(row[col]) === String(val);     // default: eq
          })
        );

      // ── DELETE ──────────────────────────────────────────────────────────────
      if (_isDelete) {
        store[table] = rows.filter(
          (row) => !_filters.every(({ col, val }) => String(row[col]) === String(val))
        );
        return resolve({ data: null, error: null });
      }

      // ── UPDATE ──────────────────────────────────────────────────────────────
      if (_isUpdate) {
        store[table] = rows.map((row) => {
          const hit = _filters.every(({ col, val }) => String(row[col]) === String(val));
          return hit ? { ...row, ..._updatePayload } : row;
        });
        const updated = matches();
        const result  = _single ? (updated[0] ?? null) : updated;
        return resolve({ data: result, error: null });
      }

      // ── SELECT ──────────────────────────────────────────────────────────────
      const selected = matches();
      const result   = _single ? (selected[0] ?? null) : selected;
      return resolve({ data: result, error: null, count: selected.length });
    },
  };
  return chain;
};

// ── Singleton InsForge mock ───────────────────────────────────────────────────

export const insforgeMock = {
  database: {
    from: (table) => makeQuery(table),
  },
  storage: {
    from: () => ({
      // Accept File | Blob | Buffer — InsForge SDK expects Blob in the real SDK
      upload: jest.fn().mockResolvedValue({
        data: {
          key:  'mock/path.webp',
          url:  'https://mock-cdn.insforge.app/food-images/mock.webp',
          size: 1024,
        },
        error: null,
      }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://mock-cdn.insforge.app/food-images/mock.webp' } }),
      remove: jest.fn().mockResolvedValue({ data: { message: 'deleted' }, error: null }),
    }),
  },
  auth: {
    tokenManager: { accessToken: 'mock-anon-key' },
  },
};

/** @deprecated Use insforgeMock directly. Kept for backwards-compat. */
export const buildInsforgeMock = () => insforgeMock;
