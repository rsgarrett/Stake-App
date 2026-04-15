-- Allow presidency_member to be null when "Who is making the visit" is not yet assigned
ALTER TABLE conference_ministering_visits ALTER COLUMN presidency_member DROP NOT NULL;
