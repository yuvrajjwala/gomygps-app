// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  return <div style={{ flex: 1, background: '#000' }} />;
}

export function useBottomTabOverflow() {
  return 0;
}
