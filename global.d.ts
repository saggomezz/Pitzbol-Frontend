declare module "*.css" {
  const content: string;
  export default content;
}

declare module "next-pwa" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withPWA: (config?: any) => (nextConfig: any) => any;
  export default withPWA;
}
