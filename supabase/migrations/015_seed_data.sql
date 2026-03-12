-- 015: Seed initial data

-- =============================================================
-- Villages
-- =============================================================
INSERT INTO villages (name, code, description) VALUES
  ('AIE', 'AIE', 'Analytical Instrumentation and Environment Village'),
  ('MTP', 'MTP', 'Materials Testing and Processing Village'),
  ('CT',  'CT',  'Chemical Technology Village'),
  ('ATC', 'ATC', 'Advanced Technology Center Village')
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- Labs (2 per village — adjust as needed)
-- =============================================================
INSERT INTO labs (village_id, name, code, location)
SELECT v.id, 'Lab A', v.code || '-LA', 'Building 1, Floor 1'
FROM villages v
ON CONFLICT (code) DO NOTHING;

INSERT INTO labs (village_id, name, code, location)
SELECT v.id, 'Lab B', v.code || '-LB', 'Building 1, Floor 2'
FROM villages v
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- System Settings
-- =============================================================
INSERT INTO system_settings (key, value, description) VALUES
  ('ppm_threshold_warning',    '{"value": 30}',  'PPM reading above this triggers a Warning status'),
  ('ppm_threshold_quarantine', '{"value": 100}', 'PPM reading above this triggers Quarantine'),
  ('po_number_format',         '{"prefix": "PO", "separator": "-"}', 'PO number format configuration')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================================
-- Sample Item Master (representative chemicals)
-- =============================================================
INSERT INTO item_master (name, cas_number, category, unit, is_peroxide, is_regulated, min_stock_level, storage_requirements) VALUES
  ('Acetone',                    '67-64-1',   'chemical_reagent', 'L',        false, false, 5.0,  'Store in flammable cabinet, away from heat sources'),
  ('Ethanol (95%)',              '64-17-5',   'chemical_reagent', 'L',        false, false, 10.0, 'Store in cool, ventilated area away from ignition sources'),
  ('Methanol',                   '67-56-1',   'chemical_reagent', 'L',        false, true,  5.0,  'Store in flammable cabinet, controlled substance storage'),
  ('Diethyl ether',              '60-29-7',   'peroxide',         'L',        true,  false, 2.0,  'Refrigerated, away from light. Peroxide-forming — monitor regularly'),
  ('Tetrahydrofuran (THF)',      '109-99-9',  'peroxide',         'L',        true,  false, 2.0,  'Refrigerated. Peroxide-forming chemical — requires regular testing'),
  ('Hydrochloric Acid (37%)',    '7647-01-0', 'chemical_reagent', 'L',        false, false, 3.0,  'Acid cabinet storage, secondary containment required'),
  ('Sulfuric Acid (98%)',        '7664-93-9', 'chemical_reagent', 'L',        false, false, 3.0,  'Acid cabinet, separated from bases'),
  ('Sodium Hydroxide pellets',   '1310-73-2', 'chemical_reagent', 'kg',       false, false, 2.0,  'Keep dry, store in airtight container'),
  ('pH Buffer Solution 4.0',     NULL,        'calibration_std',  'bottle',   false, false, 5.0,  'Store at room temperature'),
  ('pH Buffer Solution 7.0',     NULL,        'calibration_std',  'bottle',   false, false, 5.0,  'Store at room temperature'),
  ('Conductivity Standard 1413', NULL,        'calibration_std',  'bottle',   false, false, 3.0,  'Store at room temperature'),
  ('Nitrogen Gas (99.999%)',     '7727-37-9', 'gas',              'cylinder', false, false, 1.0,  'Store upright, chained to wall. Keep away from heat sources'),
  ('Argon Gas (99.999%)',        '7440-37-1', 'gas',              'cylinder', false, false, 1.0,  'Store upright, secured. Inert asphyxiant — ventilation required'),
  ('Disposable Nitrile Gloves',  NULL,        'material_supply',  'box',      false, false, 10.0, 'Store in dry, cool location'),
  ('Safety Goggles',             NULL,        'material_supply',  'pcs',      false, false, 5.0,  'Clean and inspect before use')
ON CONFLICT DO NOTHING;
