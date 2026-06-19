export {};

declare global {
  interface Window {
    go?: {
      main?: {
        App?: {
          Greet(name: string): Promise<string>;
        };
      };
    };
  }
}
