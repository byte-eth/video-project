<route lang="json5">
{
  name: "pet",
}
</route>

<script setup lang="ts">
import { showToast } from 'vant';
import { getPetImg, getPetVideo } from '@/utils/common';

const route = useRoute();
const router = useRouter();

type ActionKey = 'feed' | 'play' | 'clean';

interface PetTraits {
  play?: string;
  clean?: string;
  feed?: string;
  balanced?: boolean;
  interaction?: string;
}

interface Pet {
  id: string;
  name: string;
  image: string;
  video?: string;
  traits: PetTraits;
}

interface PetStatus {
  hunger: number;
  bored: number;
  cleanliness: number;
}

interface CurrentPet extends Pet {
  customName: string;
  status: PetStatus;
  level: number;
  exp: number;
}

const expToNext = (level: number) => 72 + (level - 1) * 28;

const EXP_PER_INTERACTION = 10;
const EXP_BONUS_FIRST_CAP = 18;

interface ActionTextSet {
  ongoing: string[];
  done: string[];
  full: string[];
}

const pets = [
  {
    id: 'qinglong',
    name: '青龙',
    image: 'dragon_1.png',
    traits: {
      play: 'active',
      clean: 'long-lasting',
    },
  },
  {
    id: 'baihu',
    name: '白虎',
    image: 'tiger_1.png',
    video: 'tiger_1v.mp4',
    traits: {
      feed: 'fast',
      play: 'low-frequency',
    },
  },
  {
    id: 'zhuque',
    name: '朱雀',
    image: 'phoenix_1.png',
    traits: {
      clean: 'high-frequency',
      feed: 'effect',
    },
  },
  {
    id: 'xuanwu',
    name: '玄武',
    image: 'tortoise_1.png',
    traits: {
      clean: 'low-frequency',
      play: 'slow-decline',
    },
  },
  {
    id: 'qilin',
    name: '麒麟',
    image: 'kylin_1.png',
    video: 'kylin_1v.mp4',
    traits: {
      balanced: true,
      interaction: 'rich',
    },
  },
] as const satisfies ReadonlyArray<Pet>;

const currentPet = ref<CurrentPet | null>(null);
const message = ref('');
const messageTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const statusTicker = ref<ReturnType<typeof setInterval> | null>(null);
const showExpRules = ref(false);
const petVideoRef = ref<HTMLVideoElement | null>(null);

watch(showExpRules, (open) => {
  const el = petVideoRef.value;
  if (!el)
    return;
  if (open)
    el.pause();
  else
    void el.play().catch(() => {});
});

const expRuleLines = [
  '每次喂养、玩耍或清洁在对应数值未满时，都会获得基础成长经验。',
  '当饱食、心情或洁净中任意一项在本轮从未满首次升到 100% 时，额外获得一笔经验。',
  '对应项已满时继续点击不会增加状态，也不会获得经验。',
  '升级所需经验会随等级提高而增加；等级目前仅作展示，不影响互动数值规则。',
] as const;

const expRuleDotColors = ['#a78bfa', '#3b82f6', '#22c55e', '#6366f1'] as const;

const expProgress = computed(() => {
  const pet = currentPet.value;
  if (!pet)
    return null;
  const need = expToNext(pet.level);
  const pct = need > 0 ? Math.min(100, Math.round((pet.exp / need) * 1000) / 10) : 0;
  return {
    level: pet.level,
    exp: pet.exp,
    need,
    pct,
  };
});

const grantExp = (amount: number) => {
  if (!currentPet.value || amount <= 0)
    return;

  const pet = currentPet.value;
  pet.exp += amount;
  let gainedLevels = 0;
  while (pet.exp >= expToNext(pet.level)) {
    pet.exp -= expToNext(pet.level);
    pet.level += 1;
    gainedLevels += 1;
  }
  if (gainedLevels > 0) {
    showToast({
      message: gainedLevels === 1
        ? `恭喜升级到 Lv.${pet.level}！`
        : `连升 ${gainedLevels} 级！当前 Lv.${pet.level}`,
      duration: 2200,
    });
  }
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const showMessage = (msg: string) => {
  if (messageTimer.value)
    clearTimeout(messageTimer.value);
  message.value = '';
  requestAnimationFrame(() => {
    message.value = msg;
    messageTimer.value = setTimeout(() => {
      message.value = '';
      messageTimer.value = null;
    }, 3000);
  });
};

const pickRandom = (texts: string[]) => texts[Math.floor(Math.random() * texts.length)];

const actionTexts: Record<ActionKey, ActionTextSet> = {
  feed: {
    ongoing: [
      '吃得香香的，继续投喂我吧~',
      '这口真满足，再来一点！',
      '好吃！体力正在恢复中。',
      '真是美味，肚子暖暖的。',
      '再喂几次我就要满血啦！',
    ],
    done: [
      '饱食值已拉满，太满足了！',
      '我已经吃得圆滚滚啦！',
      '吃饱啦，今天状态很稳。',
      '这顿完美，能量充满！',
    ],
    full: [
      '我已经吃饱啦，先歇会儿~',
      '肚子满满，不用再喂啦！',
      '再吃就要撑到了，嘿嘿。',
      '现在是饱腹状态，感谢主人！',
    ],
  },
  play: {
    ongoing: [
      '好玩！我们继续！',
      '心情上升中，再互动一下~',
      '我越来越开心啦！',
      '这个游戏很对我胃口！',
      '再玩几轮就能满心情啦！',
    ],
    done: [
      '心情值满格，今天超开心！',
      '玩耍效果拔群，我兴奋到起飞！',
      '快乐已拉满，状态超棒！',
      '现在的我，开心值爆表！',
    ],
    full: [
      '我现在已经超开心啦！',
      '心情满分，先缓一缓~',
      '开心值已经封顶啦！',
      '现在正高兴着呢，嘿嘿。',
    ],
  },
  clean: {
    ongoing: [
      '清爽了不少，再整理一下吧！',
      '洗香香进度提升中~',
      '舒服！我变得更干净了。',
      '继续清洁，马上焕然一新！',
      '再来几次我就亮晶晶啦！',
    ],
    done: [
      '洁净值已满，闪闪发亮！',
      '现在超级干净，手感一流！',
      '清洁完成，状态清清爽爽！',
      '太棒了，我已经一尘不染！',
    ],
    full: [
      '我已经很干净啦，不用再洗咯~',
      '洁净度满满，状态很好！',
      '现在超清爽，先这样就好。',
      '已经洗到发亮啦！',
    ],
  },
};

const requiredSteps = (action: ActionKey) => {
  const pet = currentPet.value;
  if (!pet)
    return 3;

  if (action === 'feed') {
    if (pet.traits.feed === 'fast')
      return 1;
    if (pet.traits.feed === 'effect')
      return 2;
    if (pet.traits.balanced)
      return 2;
    return 3;
  }

  if (action === 'play') {
    if (pet.traits.play === 'active')
      return 1;
    if (pet.traits.play === 'slow-decline')
      return 2;
    if (pet.traits.play === 'low-frequency')
      return 4;
    if (pet.traits.balanced)
      return 2;
    return 3;
  }

  if (pet.traits.clean === 'low-frequency' || pet.traits.clean === 'long-lasting')
    return 1;
  if (pet.traits.balanced)
    return 2;
  if (pet.traits.clean === 'high-frequency')
    return 4;
  return 3;
};

const addProgress = (action: ActionKey) => {
  if (!currentPet.value)
    return;

  const steps = requiredSteps(action);
  const gain = Math.ceil(100 / steps);
  const statusKey = action === 'feed'
    ? 'hunger'
    : action === 'play'
      ? 'bored'
      : 'cleanliness';

  const oldValue = currentPet.value.status[statusKey];
  if (oldValue >= 100) {
    showMessage(pickRandom(actionTexts[action].full));
    return;
  }

  const newValue = clamp(oldValue + gain);
  currentPet.value.status[statusKey] = newValue;

  grantExp(EXP_PER_INTERACTION);
  if (oldValue < 100 && newValue >= 100)
    grantExp(EXP_BONUS_FIRST_CAP);

  if (newValue >= 100) {
    showMessage(pickRandom(actionTexts[action].done));
    return;
  }

  showMessage(pickRandom(actionTexts[action].ongoing));
};

const feed = () => addProgress('feed');
const play = () => addProgress('play');
const clean = () => addProgress('clean');

const startStatusTimers = () => {
  stopStatusTimers();
  statusTicker.value = setInterval(() => {
    if (!currentPet.value)
      return;
    const decayByAction = (action: ActionKey) => requiredSteps(action) <= 2 ? 6 : 4;
    currentPet.value.status.hunger = clamp(currentPet.value.status.hunger - decayByAction('feed'));
    currentPet.value.status.bored = clamp(currentPet.value.status.bored - decayByAction('play'));
    currentPet.value.status.cleanliness = clamp(currentPet.value.status.cleanliness - decayByAction('clean'));
  }, 20 * 1000);
};

const stopStatusTimers = () => {
  if (statusTicker.value)
    clearInterval(statusTicker.value);
  statusTicker.value = null;
};

const statusList = computed(() => {
  if (!currentPet.value)
    return [];
  return [
    {
      key: 'hunger',
      label: '饱食',
      icon: 'fire-o',
      value: currentPet.value.status.hunger,
      color: '#f59e0b',
    },
    {
      key: 'bored',
      label: '心情',
      icon: 'smile-o',
      value: currentPet.value.status.bored,
      color: '#3b82f6',
    },
    {
      key: 'cleanliness',
      label: '洁净',
      icon: 'like-o',
      value: currentPet.value.status.cleanliness,
      color: '#22c55e',
    },
  ];
});

onMounted(() => {
  const petId = `${route.query.petId || ''}`;
  const petName = `${route.query.petName || ''}`.trim();
  const pet = pets.find(item => item.id === petId);

  if (!pet || !petName) {
    router.replace('/pet/selectPet');
    return;
  }

  currentPet.value = {
    ...pet,
    customName: petName,
    status: {
      hunger: 45,
      bored: 45,
      cleanliness: 45,
    },
    level: 1,
    exp: 0,
  };
  startStatusTimers();
});

onUnmounted(() => {
  stopStatusTimers();
  if (messageTimer.value)
    clearTimeout(messageTimer.value);
});
</script>

<template>
  <div
    v-if="currentPet"
    class="bg-gradient-to-b from-blue-100 to-purple-100 min-h-screen w-full flex flex-col">
    <div class="relative flex flex-col min-h-screen pb-176px">
      <div class="px-14px pt-18px">
        <div class="rounded-16px bg-[rgba(255,255,255,0.88)] backdrop-blur-6px p-12px shadow-[0_8px_22px_rgba(31,41,55,0.12)]">
          <div class="flex items-center justify-between mb-10px">
            <div class="flex items-center gap-6px">
              <van-icon name="paw-o" size="18" color="#22c55e" />
              <div class="text-16px font-600 text-#0f172a">
                {{ currentPet.customName }}
              </div>
            </div>
            <div class="text-12px text-#64748b">
              {{ currentPet.name }}
            </div>
          </div>
          <div class="grid grid-cols-3 gap-8px">
            <div
              v-for="item in statusList"
              :key="item.key"
              class="rounded-10px px-8px py-7px bg-[rgba(255,255,255,0.7)]">
              <div class="flex items-center gap-4px mb-4px">
                <van-icon :name="item.icon" :color="item.color" />
                <span class="text-11px text-#475569">{{ item.label }}</span>
              </div>
              <div class="w-full h-7px rounded-999px bg-[rgba(148,163,184,0.25)] overflow-hidden mb-3px">
                <div class="h-full rounded-999px transition-all duration-300" :style="{ width: `${item.value}%`, background: item.color }" />
              </div>
              <div class="text-11px font-600" :style="{ color: item.color }">
                {{ item.value }}%
              </div>
            </div>
          </div>
          <div
            v-if="expProgress"
            class="mt-12px pt-12px b-t-1 b-t-solid b-t-[rgba(148,163,184,0.35)]">
            <div class="flex items-center justify-between gap-8px mb-8px">
              <div class="flex items-center gap-8px min-w-0">
                <span class="shrink-0 rounded-8px bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-11px font-700 px-8px py-3px">
                  Lv.{{ expProgress.level }}
                </span>
                <span class="text-12px font-600 text-#334155 truncate">成长经验</span>
              </div>
              <button
                type="button"
                class="shrink-0 inline-flex items-center gap-5px py-5px pr-11px pl-9px rounded-999px border-1 border-solid border-[rgba(34,197,94,0.42)] bg-[rgba(255,255,255,0.95)] shadow-[0_2px_10px_rgba(34,197,94,0.12)] lh-1 transition-all duration-150 active:scale-97 active:shadow-[0_1px_6px_rgba(34,197,94,0.14)]"
                @click="showExpRules = true">
                <van-icon name="question-o" class="shrink-0 !text-#15803d" size="14" />
                <span class="text-11px font-600 text-#14532d tracking-[0.02em]">规则说明</span>
              </button>
            </div>
            <div class="w-full h-9px rounded-999px bg-[rgba(148,163,184,0.22)] overflow-hidden mb-6px">
              <div
                class="h-full rounded-999px transition-all duration-300 bg-gradient-to-r from-violet-500 to-indigo-500"
                :style="{ width: `${expProgress.pct}%` }" />
            </div>
            <div class="flex items-center justify-between text-11px text-#64748b">
              <span>{{ expProgress.exp }} / {{ expProgress.need }} 经验</span>
              <span class="text-#94a3b8">升级时超出部分保留至下一级</span>
            </div>
          </div>

          <div class="text-11px text-#64748b mt-8px">
            饱食 / 心情 / 洁净会随时间缓慢下降，记得及时互动
          </div>
        </div>
      </div>

      <van-popup
        v-model:show="showExpRules"
        position="bottom"
        round
        teleport="body"
        overlay-class="pet-exp-rules-overlay"
        class="pet-exp-rules-popup">
        <div
          class="pet-exp-rules-sheet-inner relative flex flex-col max-h-78vh overflow-hidden rounded-tl-20px rounded-tr-20px border-1 border-b-0 border-solid border-[rgba(255,255,255,0.85)] bg-[linear-gradient(165deg,#eef2ff_0%,#f5f3ff_32%,rgba(255,255,255,0.98)_58%,#f8fafc_100%)] shadow-[0_-12px_48px_rgba(79,70,229,0.14)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-120px rounded-tl-20px rounded-tr-20px overflow-hidden opacity-95">
            <div
              class="absolute -top-40px left-1/2 h-140px w-140px -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.26)_0%,rgba(167,139,250,0.08)_45%,transparent_72%)]" />
            <div
              class="absolute -top-20px -right-24px h-100px w-100px rounded-full bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.22)_0%,rgba(96,165,250,0.06)_48%,transparent_74%)]" />
          </div>

          <div class="relative shrink-0 w-36px h-4px mt-12px mx-auto rounded-999px bg-[rgba(148,163,184,0.4)]" />

          <header class="relative shrink-0 px-20px pt-16px pb-18px text-center">
            <div
              class="relative mx-auto mb-10px flex h-48px w-48px items-center justify-center rounded-16px bg-[rgba(255,255,255,0.92)] shadow-[0_8px_24px_rgba(99,102,241,0.2)] ring-1 ring-solid ring-[rgba(167,139,250,0.35)]">
              <div
                class="absolute inset-2px rounded-14px bg-[linear-gradient(135deg,rgba(237,233,254,0.95)_0%,rgba(224,231,255,0.9)_100%)]" />
              <van-icon class="relative z-1" name="star-o" size="22" color="#6366f1" />
            </div>
            <h2
              class="m-0 mb-8px text-19px font-700 lh-26px tracking-[0.02em] bg-[linear-gradient(92deg,#4f46e5_0%,#7c3aed_42%,#0f172a_100%)] bg-clip-text text-transparent">
              成长规则
            </h2>
            <p class="m-0 mx-auto max-w-280px text-12px lh-18px text-#64748b">
              经验怎么来、升级怎么算，下面几条看完就懂
            </p>
          </header>

          <div
            class="relative flex-1 min-h-0 overflow-y-auto pr-18px pl-12px pt-4px pb-10px [-webkit-overflow-scrolling:touch]">
            <div class="relative">
              <div
                class="pointer-events-none absolute left-12px top-28px bottom-28px w-3px -translate-x-1/2 rounded-999px bg-[linear-gradient(180deg,#c4b5fd_0%,#818cf8_42%,#34d399_100%)] opacity-85" />
              <ul class="m-0 p-0 list-none">
                <li
                  v-for="(line, idx) in expRuleLines"
                  :key="idx"
                  class="grid grid-cols-[24px_minmax(0,1fr)] gap-x-12px items-center pb-16px last:pb-0">
                  <div class="relative z-1 flex items-center justify-center self-center">
                    <span
                      class="box-border h-14px w-14px shrink-0 rounded-999px bg-white shadow-[0_2px_10px_rgba(99,102,241,0.22)]"
                      :style="{ border: `2px solid ${expRuleDotColors[idx]}` }" />
                  </div>
                  <div
                    class="min-w-0 rounded-14px bg-[rgba(255,255,255,0.78)] px-14px py-12px shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-solid ring-[rgba(148,163,184,0.14)]">
                    <p class="m-0 text-13px lh-22px text-#334155 font-500">
                      {{ line }}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <footer
            class="relative shrink-0 px-18px pt-10px pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.65)_28%,rgba(255,255,255,0.92)_100%)]">
            <van-button
              block
              round
              class="pet-exp-rules-ok !h-46px !text-15px !font-600 !border-none !text-white !shadow-[0_8px_22px_rgba(99,102,241,0.38)]"
              @click="showExpRules = false">
              知道了
            </van-button>
          </footer>
        </div>
      </van-popup>

      <div class="relative w-full h-42vh flex justify-center items-center overflow-hidden flex-grow mt-8px">
        <video
          v-if="currentPet.video"
          ref="petVideoRef"
          :key="currentPet.id"
          class="pet-display-video max-w-80% max-h-80% object-contain transition-transform duration-300 rounded-16px pointer-events-none"
          :src="getPetVideo(currentPet.video)"
          :poster="getPetImg(currentPet.image)"
          muted
          loop
          autoplay
          playsinline
          webkit-playsinline
          disable-picture-in-picture
          controlslist="nodownload noplaybackrate nofullscreen"
          preload="auto"
        />
        <img
          v-else
          :src="getPetImg(currentPet.image)"
          :alt="currentPet.name"
          class="max-w-80% max-h-80% object-contain transition-transform duration-300 rounded-16px"
        >
        <div
          v-if="message"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgba(255,255,255,0.95)] px-18px py-10px rounded-20px text-15px text-black/70 lh-20px z-100 animate-float shadow-[0_8px_20px_rgba(15,23,42,0.14)] ws-nowrap">
          {{ message }}
        </div>
      </div>

      <div
        class="fixed left-12px right-12px bottom-[calc(env(safe-area-inset-bottom)+10px)] rounded-18px bg-[rgba(255,255,255,0.94)] backdrop-blur-8px shadow-[0_8px_24px_rgba(15,23,42,0.18)] px-12px py-12px z-50">
        <div class="flex items-center justify-between gap-8px">
          <button
            class="flex-1 h-78px rounded-14px flex flex-col justify-center items-center gap-2px bg-#fff7ed b-1 b-solid b-#fed7aa text-#f59e0b active:scale-98 transition-transform duration-150"
            @click="feed">
            <div class="w-28px h-28px rounded-14px bg-white flex items-center justify-center">
              <van-icon name="fire-o" size="16" />
            </div>
            <span class="text-12px font-600 lh-14px">喂养</span>
            <span class="text-10px lh-10px opacity-80">{{ requiredSteps('feed') }}次满</span>
          </button>
          <button
            class="flex-1 h-78px rounded-14px flex flex-col justify-center items-center gap-2px bg-#eff6ff b-1 b-solid b-#bfdbfe text-#3b82f6 active:scale-98 transition-transform duration-150"
            @click="play">
            <div class="w-28px h-28px rounded-14px bg-white flex items-center justify-center">
              <van-icon name="smile-o" size="16" />
            </div>
            <span class="text-12px font-600 lh-14px">玩耍</span>
            <span class="text-10px lh-10px opacity-80">{{ requiredSteps('play') }}次满</span>
          </button>
          <button
            class="flex-1 h-78px rounded-14px flex flex-col justify-center items-center gap-2px bg-#ecfdf5 b-1 b-solid b-#bbf7d0 text-#22c55e active:scale-98 transition-transform duration-150"
            @click="clean">
            <div class="w-28px h-28px rounded-14px bg-white flex items-center justify-center">
              <van-icon name="like-o" size="16" />
            </div>
            <span class="text-12px font-600 lh-14px">清洁</span>
            <span class="text-10px lh-10px opacity-80">{{ requiredSteps('clean') }}次满</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@keyframes float {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(20px);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(-20px);
  }
}

.animate-float {
  animation: float 3s ease-out forwards;
}

.pet-display-video::-webkit-media-controls {
  display: none !important;
}

.pet-display-video::-webkit-media-controls-enclosure {
  display: none !important;
}

/* 毛玻璃仅做在遮罩上；面板为实色渐变，避免重复 blur */
:global(.pet-exp-rules-overlay) {
  background: rgba(15, 23, 42, 0.18) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

:global(.pet-exp-rules-popup.van-popup) {
  overflow: visible;
  background: transparent !important;
  max-height: 78vh;
}

/* 内容区单独一层即可，勿在 .van-popup 上写 transform，避免盖住 Vant 的 translateY 过渡 */
.pet-exp-rules-sheet-inner {
  transform: translateZ(0);
}

:deep(.pet-exp-rules-ok.van-button) {
  background: linear-gradient(135deg, #a78bfa 0%, #6366f1 46%, #4f46e5 100%) !important;
}
</style>
