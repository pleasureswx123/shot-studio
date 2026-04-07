-- ============================================================
-- 测试种子数据
-- ============================================================

-- 项目1：动画片
INSERT INTO entities (type, code, attributes) VALUES (
  'Project', 'SMD',
  '{"name": "山猫大冒险", "sg_status": "Active", "sg_fps": 24, "sg_resx": 2048, "sg_resy": 858, "sg_description": "2D动画长片项目"}'::jsonb
);

-- 项目2：广告片
INSERT INTO entities (type, code, attributes) VALUES (
  'Project', 'ADV2026',
  '{"name": "品牌年度广告", "sg_status": "Active", "sg_fps": 25, "sg_resx": 1920, "sg_resy": 1080, "sg_description": "2026年品牌TVC制作"}'::jsonb
);

-- 项目3：已归档项目
INSERT INTO entities (type, code, attributes) VALUES (
  'Project', 'DEMO2025',
  '{"name": "Demo Reel 2025", "sg_status": "Archived", "sg_fps": 24, "sg_resx": 3840, "sg_resy": 2160, "sg_description": "内部Demo展示项目"}'::jsonb
);

-- 获取项目 id（SMD = 2, ADV2026 = 3）
-- Asset 资产（隶属于 SMD）
INSERT INTO entities (type, code, project_id, attributes) VALUES
  ('Asset', 'cat_rig',    2, '{"name": "Cat Rig", "sg_asset_type": "Character", "sg_status_list": "ip"}'::jsonb),
  ('Asset', 'forest_bg',  2, '{"name": "Forest BG", "sg_asset_type": "Environment", "sg_status_list": "wtg"}'::jsonb),
  ('Asset', 'sword_prop', 2, '{"name": "Sword Prop", "sg_asset_type": "Prop", "sg_status_list": "fin"}'::jsonb);

-- Sequence（隶属于 SMD）
INSERT INTO entities (type, code, project_id, attributes) VALUES
  ('Sequence', 'SQ010', 2, '{"name": "Opening Sequence"}'::jsonb),
  ('Sequence', 'SQ020', 2, '{"name": "Battle Sequence"}'::jsonb);

-- Shot（隶属于 SMD，Sequence SQ010 id=8）
INSERT INTO entities (type, code, project_id, links, attributes) VALUES
  ('Shot', 'SQ010_0010', 2, '{"sg_sequence": {"id": 8, "type": "Sequence", "name": "SQ010"}}'::jsonb,
   '{"sg_status_list": "wtg", "sg_cut_in": 1001, "sg_cut_out": 1048, "sg_cut_duration": 48}'::jsonb),
  ('Shot', 'SQ010_0020', 2, '{"sg_sequence": {"id": 8, "type": "Sequence", "name": "SQ010"}}'::jsonb,
   '{"sg_status_list": "ip", "sg_cut_in": 1001, "sg_cut_out": 1072, "sg_cut_duration": 72}'::jsonb),
  ('Shot', 'SQ020_0010', 2, '{"sg_sequence": {"id": 9, "type": "Sequence", "name": "SQ020"}}'::jsonb,
   '{"sg_status_list": "fin", "sg_cut_in": 1001, "sg_cut_out": 1096, "sg_cut_duration": 96}'::jsonb);
