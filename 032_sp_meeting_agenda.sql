-- Stake Presidency Meeting Agenda - Perpetual weekly agenda system

-- Each row = one week's agenda
CREATE TABLE IF NOT EXISTS sp_meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID REFERENCES stakes(id),
  meeting_date DATE NOT NULL,
  meeting_time TEXT DEFAULT '8:00 PM',

  -- Opening section
  conducting TEXT,
  opening_prayer TEXT,
  closing_prayer TEXT,
  stake_goal TEXT DEFAULT 'Stake Vision',
  handbook_trainer TEXT,
  handbook_topic TEXT,

  -- Calendar items (JSON array of {date, time, event})
  calendar_items JSONB DEFAULT '[]'::jsonb,

  -- Agenda planning notes
  agenda_planning_notes TEXT,

  -- Callings section notes
  callings_notes TEXT,
  stake_business_notes TEXT,

  -- God's Work items (JSON array of {core_area, item, notes, status})
  gods_work_items JSONB DEFAULT '[]'::jsonb,

  -- General meeting notes
  general_notes TEXT,

  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(stake_id, meeting_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sp_meeting_agendas_date ON sp_meeting_agendas(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_sp_meeting_agendas_stake ON sp_meeting_agendas(stake_id);

-- RLS
ALTER TABLE sp_meeting_agendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_meeting_agendas_select" ON sp_meeting_agendas
  FOR SELECT USING (true);

CREATE POLICY "sp_meeting_agendas_insert" ON sp_meeting_agendas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sp_meeting_agendas_update" ON sp_meeting_agendas
  FOR UPDATE USING (true);

CREATE POLICY "sp_meeting_agendas_delete" ON sp_meeting_agendas
  FOR DELETE USING (true);
