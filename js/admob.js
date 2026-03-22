// ─── AdMob ───
const AdMobPlugin = window.Capacitor?.Plugins?.AdMob;
const IS_NATIVE = !!window.Capacitor?.isNativePlatform?.();

// 테스트 ID (배포 전 실제 ID로 교체)
const AD_IDS = {
  interstitial: IS_NATIVE
    ? "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"   // 실제 전면광고 ID 입력
    : "ca-app-pub-3940256099942544/4411468910",  // Google 테스트 ID
  rewarded: IS_NATIVE
    ? "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"   // 실제 리워드광고 ID 입력
    : "ca-app-pub-3940256099942544/1712485313",  // Google 테스트 ID
};

async function initAdMob() {
  if (!AdMobPlugin) return;
  await AdMobPlugin.initialize({ testingDevices: [], initializeForTesting: !IS_NATIVE });
  await prepareInterstitial();
}

async function prepareInterstitial() {
  if (!AdMobPlugin) return;
  try {
    await AdMobPlugin.prepareInterstitial({ adId: AD_IDS.interstitial });
  } catch (e) {
    console.warn("interstitial prepare failed", e);
  }
}

async function showInterstitial() {
  if (!AdMobPlugin) return;
  try {
    await AdMobPlugin.showInterstitial();
  } catch (e) {
    console.warn("interstitial show failed", e);
  }
  // 다음 게임을 위해 미리 준비
  await prepareInterstitial();
}

async function showRewardAd() {
  if (!AdMobPlugin) {
    // 네이티브가 아닌 환경에서는 바로 보상 지급
    HP.gain();
    return true;
  }
  try {
    await AdMobPlugin.prepareRewardVideoAd({ adId: AD_IDS.rewarded });
    const result = await AdMobPlugin.showRewardVideoAd();
    if (result?.reward) {
      HP.gain();
      return true;
    }
  } catch (e) {
    console.warn("reward ad failed", e);
  }
  return false;
}

