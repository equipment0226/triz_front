// This only controls presentation. The API/MCP independently verify the stored
// account email through the server-side session; client input cannot grant access.
export const canTestPatent = user =>
  typeof user?.email === 'string' && user.email.trim().toLowerCase() === 'equipment0226@gmail.com';
