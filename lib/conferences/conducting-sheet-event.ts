export interface ConductingSheetEvent {
  title: string
  theme?: string | null
  presiding_authority?: string | null
  start_date: string
  end_date: string
  location?: string | null
  event_type: string
  /** From the Stake Business tab — flows into the welcome sheet's stand recognition. */
  stand_seating?: string | null
}
