-- moderator_id was declared both `not null` and `on delete set null` — a
-- direct contradiction. Deleting a staff member's account correctly tries
-- to null out their moderation_actions.moderator_id (to preserve the audit
-- trail rather than cascade-deleting history), but the not-null constraint
-- then rejects that, so the delete failed outright with a 500. Confirmed by
-- actually trying to delete a test admin account during Phase 7 testing.
alter table public.moderation_actions alter column moderator_id drop not null;
