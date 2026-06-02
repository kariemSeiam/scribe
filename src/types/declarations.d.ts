// CSS side-effect imports (e.g. import '@/styles/globals.css')
declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}

// Next.js replaces process.env.NEXT_PUBLIC_* at build time.
// Declare the minimal shape tsc needs to see.
declare const process: { env: Record<string, string | undefined> }
