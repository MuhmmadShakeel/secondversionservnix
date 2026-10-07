export const name = '005_service_booking_pending_index'

export const up = `
  CREATE UNIQUE INDEX IF NOT EXISTS service_bookings_one_pending_idx
  ON service_bookings(service_id, buyer_user_id) WHERE status = 'pending';
`
