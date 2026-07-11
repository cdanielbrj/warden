export interface Realm {
  readonly name: string;
  initialize(): Promise<void>;
}
