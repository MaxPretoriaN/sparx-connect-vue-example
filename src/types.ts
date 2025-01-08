import type { Provider } from "everscale-inpage-provider";

export enum TvmProviderEvent {
  REQUEST_PROVIDER = "tvm:requestProvider",
  ANNOUNCE_PROVIDER = "tvm:announceProvider",
}

export enum TvmProviderNames {
  SparxWallet = "SparX Wallet",
}

export interface TvmAnnounceProviderEvent extends CustomEvent {
  type: TvmProviderEvent.ANNOUNCE_PROVIDER;
  detail: TvmProviderDetail;
}

export interface TvmProviderDetail {
  info: TvmProviderInfo;
  provider: Provider;
}

export interface TvmProviderInfo {
  name: string;
  rdns?: string;
}
