-- Import missionaries from the Mission Ready Tracker spreadsheet
-- All 5 missionaries with their 20-step checklists and notes from the sheet
-- Checkboxes are unchecked by default since the web export couldn't capture checkbox state

-- First, get the stake_id (use the first stake available)
DO $$
DECLARE
  v_stake_id UUID;
  v_rylee_id UUID;
  v_ty_id UUID;
  v_josh_id UUID;
  v_rachel_id UUID;
  v_lorelai_id UUID;
  v_brayden_id UUID;
  v_abby_id UUID;
  v_kade_id UUID;
  v_gid_id UUID;
  v_ryland_id UUID;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  -- Insert missionaries
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Rylee Fowers', v_stake_id, 'preparing')
  RETURNING id INTO v_rylee_id;

  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Ty Chambers', v_stake_id, 'preparing')
  RETURNING id INTO v_ty_id;

  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Josh Davis', v_stake_id, 'preparing')
  RETURNING id INTO v_josh_id;

  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Rachel Lee', v_stake_id, 'preparing')
  RETURNING id INTO v_rachel_id;

  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Lorelai Peterson', v_stake_id, 'preparing')
  RETURNING id INTO v_lorelai_id;

  -- ===== Rylee Fowers =====
  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_rylee_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_rylee_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_rylee_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_rylee_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_rylee_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_rylee_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_rylee_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_rylee_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_rylee_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_rylee_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_rylee_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_rylee_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_rylee_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, 'Assigned 12/16/25', 13),
    (v_rylee_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_rylee_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_rylee_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_rylee_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_rylee_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_rylee_id, 19, 'Setting Apart Scheduled', FALSE, 'Contact Brother Lester to schedule', 19),
    (v_rylee_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Ty Chambers =====
  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_ty_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_ty_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_ty_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_ty_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_ty_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_ty_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_ty_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_ty_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_ty_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_ty_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_ty_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_ty_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_ty_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_ty_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_ty_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_ty_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_ty_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_ty_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_ty_id, 19, 'Setting Apart Scheduled', FALSE, 'Contact Brother Lester to schedule', 19),
    (v_ty_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Josh Davis =====
  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_josh_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_josh_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_josh_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_josh_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_josh_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_josh_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_josh_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_josh_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_josh_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_josh_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_josh_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_josh_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_josh_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_josh_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_josh_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_josh_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_josh_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_josh_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_josh_id, 19, 'Setting Apart Scheduled', FALSE, 'Contact Brother Lester to schedule', 19),
    (v_josh_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Rachel Lee =====
  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_rachel_id, 1, 'Read The Book of Mormon', FALSE, 'March 20th', 1),
    (v_rachel_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_rachel_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_rachel_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_rachel_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_rachel_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_rachel_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_rachel_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_rachel_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_rachel_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_rachel_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_rachel_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_rachel_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_rachel_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_rachel_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_rachel_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_rachel_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_rachel_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_rachel_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_rachel_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Lorelai Peterson =====
  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_lorelai_id, 1, 'Read The Book of Mormon', FALSE, 'Will read it again', 1),
    (v_lorelai_id, 2, 'D&C 121', FALSE, 'Left off in vs 37', 2),
    (v_lorelai_id, 3, 'Missionary Growth Path', FALSE, 'Being created', 3),
    (v_lorelai_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_lorelai_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_lorelai_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_lorelai_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_lorelai_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_lorelai_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, 'Promised me it will be done', 9),
    (v_lorelai_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_lorelai_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_lorelai_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_lorelai_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_lorelai_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_lorelai_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_lorelai_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_lorelai_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_lorelai_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_lorelai_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_lorelai_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Brayden Burnett =====
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Brayden Burnett', v_stake_id, 'preparing')
  RETURNING id INTO v_brayden_id;

  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_brayden_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_brayden_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_brayden_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_brayden_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_brayden_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_brayden_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_brayden_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_brayden_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_brayden_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_brayden_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_brayden_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_brayden_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_brayden_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_brayden_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_brayden_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_brayden_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_brayden_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_brayden_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_brayden_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_brayden_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Abby Hoffman =====
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Abby Hoffman', v_stake_id, 'preparing')
  RETURNING id INTO v_abby_id;

  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_abby_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_abby_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_abby_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_abby_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_abby_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_abby_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_abby_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_abby_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_abby_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_abby_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_abby_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_abby_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_abby_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_abby_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_abby_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_abby_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_abby_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_abby_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_abby_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_abby_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Kade Ashcroft =====
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Kade Ashcroft', v_stake_id, 'preparing')
  RETURNING id INTO v_kade_id;

  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_kade_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_kade_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_kade_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_kade_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_kade_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_kade_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_kade_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_kade_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_kade_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_kade_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_kade_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_kade_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_kade_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_kade_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_kade_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_kade_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_kade_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_kade_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_kade_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_kade_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Gid Vandertoolen =====
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Gid Vandertoolen', v_stake_id, 'preparing')
  RETURNING id INTO v_gid_id;

  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_gid_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_gid_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_gid_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_gid_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_gid_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_gid_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_gid_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_gid_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_gid_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_gid_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_gid_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_gid_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_gid_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_gid_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_gid_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_gid_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_gid_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_gid_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_gid_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_gid_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

  -- ===== Ryland Haney =====
  INSERT INTO mission_ready_missionaries (id, missionary_name, stake_id, status)
  VALUES (gen_random_uuid(), 'Ryland Haney', v_stake_id, 'preparing')
  RETURNING id INTO v_ryland_id;

  INSERT INTO mission_ready_progress (missionary_id, task_number, task_name, completed, notes, display_order) VALUES
    (v_ryland_id, 1, 'Read The Book of Mormon', FALSE, NULL, 1),
    (v_ryland_id, 2, 'D&C 121', FALSE, NULL, 2),
    (v_ryland_id, 3, 'Missionary Growth Path', FALSE, NULL, 3),
    (v_ryland_id, 4, 'Melchizedek Priesthood', FALSE, NULL, 4),
    (v_ryland_id, 5, 'Endowment', FALSE, NULL, 5),
    (v_ryland_id, 6, 'Submit name to work in the temple', FALSE, NULL, 6),
    (v_ryland_id, 7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', FALSE, NULL, 7),
    (v_ryland_id, 8, 'Adjusting to Missionary Life', FALSE, NULL, 8),
    (v_ryland_id, 9, 'Missionary Standards for Disciples of Jesus Christ', FALSE, NULL, 9),
    (v_ryland_id, 10, 'The Fourth Missionary', FALSE, NULL, 10),
    (v_ryland_id, 11, 'Growth Mindset', FALSE, NULL, 11),
    (v_ryland_id, 12, 'Using Technology Wisely and Righteously', FALSE, NULL, 12),
    (v_ryland_id, 13, 'Study & Teach the Gospel (PMG chp. 3)', FALSE, NULL, 13),
    (v_ryland_id, 14, 'Teach to Build Faith (PMG chp. 10)', FALSE, NULL, 14),
    (v_ryland_id, 15, 'Help People Make & Keep Commitments (PMG chp. 11)', FALSE, NULL, 15),
    (v_ryland_id, 16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', FALSE, NULL, 16),
    (v_ryland_id, 17, 'Papers Submitted', FALSE, NULL, 17),
    (v_ryland_id, 18, 'Call Received', FALSE, NULL, 18),
    (v_ryland_id, 19, 'Setting Apart Scheduled', FALSE, NULL, 19),
    (v_ryland_id, 20, 'Seek Christlike Attributes (PMG chp. 6)', FALSE, NULL, 20);

END $$;
