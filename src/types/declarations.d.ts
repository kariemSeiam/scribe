// CSS side-effect imports (e.g. import '@/styles/globals.css')
declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}
