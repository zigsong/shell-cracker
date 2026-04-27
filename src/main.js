import { SafeAreaInsets, GoogleAdMob, generateHapticFeedback } from '@apps-in-toss/web-framework';

function applySafeAreaInsets({ top, bottom, left, right }) {
  const s = document.documentElement.style;
  s.setProperty('--sat', `${top}px`);
  s.setProperty('--sab', `${bottom}px`);
  s.setProperty('--sal', `${left}px`);
  s.setProperty('--sar', `${right}px`);
}

applySafeAreaInsets(SafeAreaInsets.get());
SafeAreaInsets.subscribe({ onEvent: applySafeAreaInsets });

// Expose to game scripts (loaded as global <script> tags)
window.__AIT__ = { GoogleAdMob, generateHapticFeedback };
