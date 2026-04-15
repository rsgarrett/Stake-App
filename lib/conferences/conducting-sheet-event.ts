export interface ConductingSheetEvent {
  title: string
  theme?: string | null
  presiding_authority?: string | null
  start_date: string
  end_date: string
  location?: string | null
  event_type: string
}
