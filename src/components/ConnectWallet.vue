<script setup lang="ts">
import {
  TvmProviderEvent,
  TvmProviderNames,
  type TvmAnnounceProviderEvent,
} from "@/types";
import { cutAddress } from "@/utils/format";
import { Buffer as BufferPolyfill } from "buffer";
import {
  ProviderRpcClient,
  StaticProviderAdapter,
} from "everscale-inpage-provider";
import { computed, onMounted, onUnmounted, ref } from "vue";

const provider = ref<ProviderRpcClient | null>(null);
const account = ref<{ address: string; publicKey: string } | null>(null);
const signature = ref<string | null>(null);
const accountAddress = computed(() => {
  return account.value ? cutAddress(account.value.address) : null;
});

function init() {
  window.addEventListener(
    TvmProviderEvent.ANNOUNCE_PROVIDER,
    onProviderAnnounced
  );
  window.dispatchEvent(new Event(TvmProviderEvent.REQUEST_PROVIDER));
}

async function connect() {
  if (!provider.value) {
    return;
  }

  try {
    const { accountInteraction } = await provider.value.requestPermissions({
      permissions: ["basic", "accountInteraction"],
    });

    account.value = accountInteraction
      ? {
          address: accountInteraction.address.toString(),
          publicKey: accountInteraction.publicKey,
        }
      : null;
  } catch {
    account.value = null;
  }
}

async function signMessage() {
  if (!account.value || !provider.value) {
    return;
  }

  try {
    const testMessage = "Please sign this test message";

    const base64Msg = BufferPolyfill.from(testMessage, "utf-8").toString(
      "base64"
    );
    const publicKey = account.value.publicKey;

    const result = await provider.value.signData({
      data: base64Msg,
      publicKey: publicKey,
    });

    signature.value = result.signature;
  } catch {
    signature.value = null;
  }
}

async function disconnect() {
  account.value = null;

  if (!provider.value) {
    return;
  }

  provider.value.disconnect();
}

async function onProviderAnnounced(event: Event) {
  const data = event as TvmAnnounceProviderEvent;

  if (!data.detail?.provider) {
    return;
  }

  if (data.detail.info.name !== TvmProviderNames.SparxWallet) {
    return;
  }

  const rpcClient = new ProviderRpcClient({
    provider: new StaticProviderAdapter(data.detail.provider),
  });

  await rpcClient.ensureInitialized();

  const state = await rpcClient.getProviderState();

  account.value = state.permissions.accountInteraction
    ? {
        address: state.permissions.accountInteraction.address.toString(),
        publicKey: state.permissions.accountInteraction.publicKey,
      }
    : null;
  provider.value = rpcClient;
}

function dispose() {
  window.removeEventListener(
    TvmProviderEvent.ANNOUNCE_PROVIDER,
    onProviderAnnounced
  );
}

onMounted(() => {
  init();
});

onUnmounted(() => {
  dispose();
});
</script>

<template>
  <main>
    <div class="container">
      <div class="account" v-if="!account">
        <button @click="connect">Connect Wallet</button>
      </div>

      <div class="account" v-if="!!account">
        <span>Wallet: {{ accountAddress }}</span>

        <button @click="signMessage">Sign Message</button>
        <button @click="disconnect">Disconnect</button>
      </div>
    </div>
  </main>
</template>

<style lang="css" scoped>
.container {
  margin: 32px;
}

.container button {
  padding: 8px;
}

.account {
  display: flex;
  flex-direction: column;
  justify-items: center;
  align-items: center;
  gap: 16px;
}
</style>
