export async function notifyUser(client, userId, bookingId, message) {
  if (!userId) return
  await client.query(
    'INSERT INTO notifications (user_id, booking_id, message) VALUES ($1, $2, $3)',
    [userId, bookingId, message],
  )
}
