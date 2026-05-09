const Ads = {
  _AIT_BANNER_ID: "ait.v2.live.03eedeea76004935",
  _AIT_REWARDED_ID: "ait.v2.live.8ce0789a13fd4caf",
  _ADMOB_BANNER_ID: "ca-app-pub-6333702424406257/7254375923",
  _ADMOB_REWARDED_ID: "ca-app-pub-6333702424406257/8739894162",

  _aitBanner: null,
  _admobInitialized: false,
  _bannerVisible: false,

  isAIT() {
    return !!window.__AIT__;
  },
  isCapacitor() {
    return !!window.Capacitor && !window.__AIT__;
  },

  async init() {
    if (this.isCapacitor()) await this._initAdMob();
    else if (this.isAIT()) this._initTossAds();
    this.showBanner();
  },

  // ── 배너 ──
  showBanner() {
    if (this._bannerVisible) return;
    this._bannerVisible = true;
    if (this.isAIT()) this._showAITBanner();
    else if (this.isCapacitor()) this._showAdMobBanner();
  },

  hideBanner() {
    if (!this._bannerVisible) return;
    this._bannerVisible = false;
    if (this.isAIT()) this._hideAITBanner();
    else if (this.isCapacitor()) window.Capacitor?.Plugins?.AdMob?.hideBanner();
  },

  resumeBanner() {
    if (this._bannerVisible) return;
    this._bannerVisible = true;
    if (this.isAIT()) this._showAITBanner();
    else if (this.isCapacitor())
      window.Capacitor?.Plugins?.AdMob?.resumeBanner();
  },

  // ── 리워드 ──
  async showRewarded() {
    if (this.isAIT()) return this._showAITRewarded();
    if (this.isCapacitor()) return this._showAdMobRewarded();
    return true;
  },

  // ── AIT 배너 ──
  _initTossAds() {
    const TossAds = window.__AIT__?.TossAds;
    if (!TossAds?.initialize?.isSupported?.()) return;
    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          const { loadFullScreenAd } = window.__AIT__ || {};
          if (loadFullScreenAd?.isSupported?.()) {
            loadFullScreenAd({
              options: { adGroupId: this._AIT_REWARDED_ID },
              onEvent: () => {},
              onError: () => {},
            });
          }
        },
      },
    });
  },

  _showAITBanner() {
    const TossAds = window.__AIT__?.TossAds;
    if (!TossAds?.attachBanner) return;
    const el = document.getElementById("introBannerAd");
    if (!el) return;
    el.style.display = "block";
    this._aitBanner = TossAds.attachBanner(this._AIT_BANNER_ID, el, {
      theme: "dark",
      callbacks: {
        onNoFill: () => {
          el.style.display = "none";
        },
        onAdFailedToRender: () => {
          el.style.display = "none";
        },
      },
    });
  },

  _hideAITBanner() {
    if (this._aitBanner) {
      this._aitBanner.destroy();
      this._aitBanner = null;
    }
    const el = document.getElementById("introBannerAd");
    if (el) el.style.display = "none";
  },

  // ── AIT 리워드 ──
  _showAITRewarded() {
    return new Promise((resolve) => {
      const { showFullScreenAd, loadFullScreenAd } = window.__AIT__ || {};
      if (!showFullScreenAd?.isSupported?.()) {
        resolve(true);
        return;
      }
      let settled = false;
      let rewarded = false;
      const done = (val) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };

      const timer = setTimeout(() => done(true), 15000);

      showFullScreenAd({
        options: { adGroupId: this._AIT_REWARDED_ID },
        onEvent: (e) => {
          if (e.type === "userEarnedReward") rewarded = true;
          if (e.type === "dismissed") {
            clearTimeout(timer);
            if (loadFullScreenAd?.isSupported?.()) {
              loadFullScreenAd({
                options: { adGroupId: this._AIT_REWARDED_ID },
                onEvent: () => {},
                onError: () => {},
              });
            }
            done(rewarded);
          }
          if (e.type === "failedToShow") {
            clearTimeout(timer);
            done(true);
          }
        },
        onError: () => {
          clearTimeout(timer);
          done(true);
        },
      });
    });
  },

  // ── AdMob 초기화 ──
  async _initAdMob() {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || this._admobInitialized) return;
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ["simulator"],
      });
      this._admobInitialized = true;
    } catch (e) {
      console.error("AdMob init error:", e);
    }
  },

  // ── AdMob 배너 ──
  async _showAdMobBanner() {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return;
    try {
      await AdMob.showBanner({
        adId: this._ADMOB_BANNER_ID,
        adSize: "BANNER",
        position: "BOTTOM_CENTER",
        margin: 0,
      });
    } catch (e) {
      console.error("AdMob banner error:", e);
    }
  },

  // ── AdMob 리워드 ──
  async _showAdMobRewarded() {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return true;
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("ad load timeout")), 10000),
      );
      await Promise.race([
        AdMob.prepareRewardVideoAd({ adId: this._ADMOB_REWARDED_ID }),
        timeout,
      ]);
      return new Promise((resolve) => {
        let rewarded = false;
        let rl, dl;
        const cleanup = () => {
          rl?.remove();
          dl?.remove();
        };
        AdMob.addListener("onRewardedVideoAdReward", () => {
          rewarded = true;
        }).then((h) => {
          rl = h;
        });
        AdMob.addListener("onRewardedVideoAdDismissed", () => {
          cleanup();
          resolve(rewarded);
        }).then((h) => {
          dl = h;
        });
        AdMob.showRewardVideoAd().catch(() => {
          cleanup();
          resolve(false);
        });
      });
    } catch (e) {
      console.error("AdMob rewarded error:", e);
      return false;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => Ads.init());
