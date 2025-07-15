export function getQueryWebsocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;

  return new WebSocket(`${protocol}://${host}/api/ws/nl-query`);
}
