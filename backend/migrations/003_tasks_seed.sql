-- Task 种子数据（SMD 项目，id=2）
-- Asset tasks: cat_rig(5), forest_bg(6), sword_prop(7)
-- Shot tasks:  SQ010_0010(10), SQ010_0020(11), SQ020_0010(12)

INSERT INTO entities (type, code, project_id, attributes, links) VALUES
  ('Task', 'Rigging',   2,
   '{"sg_status_list": "ip",  "sg_step": "Rigging",  "due_date": "2026-05-01"}'::jsonb,
   '{"entity": {"id": 5, "type": "Asset", "name": "cat_rig"}}'::jsonb),

  ('Task', 'Skinning',  2,
   '{"sg_status_list": "wtg", "sg_step": "Rigging",  "due_date": "2026-05-15"}'::jsonb,
   '{"entity": {"id": 5, "type": "Asset", "name": "cat_rig"}}'::jsonb),

  ('Task', 'Modeling',  2,
   '{"sg_status_list": "fin", "sg_step": "Model",    "due_date": "2026-04-10"}'::jsonb,
   '{"entity": {"id": 6, "type": "Asset", "name": "forest_bg"}}'::jsonb),

  ('Task', 'Texturing', 2,
   '{"sg_status_list": "ip",  "sg_step": "Surface",  "due_date": "2026-04-20"}'::jsonb,
   '{"entity": {"id": 6, "type": "Asset", "name": "forest_bg"}}'::jsonb),

  ('Task', 'Modeling',  2,
   '{"sg_status_list": "fin", "sg_step": "Model",    "due_date": "2026-04-05"}'::jsonb,
   '{"entity": {"id": 7, "type": "Asset", "name": "sword_prop"}}'::jsonb),

  ('Task', 'Animation', 2,
   '{"sg_status_list": "ip",  "sg_step": "Anim",     "due_date": "2026-05-10"}'::jsonb,
   '{"entity": {"id": 10, "type": "Shot", "name": "SQ010_0010"}}'::jsonb),

  ('Task', 'Comp',      2,
   '{"sg_status_list": "wtg", "sg_step": "Comp",     "due_date": "2026-05-20"}'::jsonb,
   '{"entity": {"id": 10, "type": "Shot", "name": "SQ010_0010"}}'::jsonb),

  ('Task', 'Animation', 2,
   '{"sg_status_list": "wtg", "sg_step": "Anim",     "due_date": "2026-05-12"}'::jsonb,
   '{"entity": {"id": 11, "type": "Shot", "name": "SQ010_0020"}}'::jsonb),

  ('Task', 'Lighting',  2,
   '{"sg_status_list": "wtg", "sg_step": "Light",    "due_date": "2026-06-01"}'::jsonb,
   '{"entity": {"id": 12, "type": "Shot", "name": "SQ020_0010"}}'::jsonb),

  ('Task', 'Comp',      2,
   '{"sg_status_list": "wtg", "sg_step": "Comp",     "due_date": "2026-06-10"}'::jsonb,
   '{"entity": {"id": 12, "type": "Shot", "name": "SQ020_0010"}}'::jsonb);
