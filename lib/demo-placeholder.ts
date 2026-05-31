export function demoPlaceholder(label: string, width = 960, height = 1280) {
  const text = encodeURIComponent(`Demo - ${label}`);
  return `https://placehold.co/${width}x${height}/111A2E/94A3B8?text=${text}`;
}
