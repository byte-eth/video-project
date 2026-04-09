<route lang="json5">
{
  name: "selectPet",
}
</route>

<script setup lang="ts">
import { getPetImg, getPetVideo } from '@/utils/common';

const router = useRouter();

type ElementType = 'wood' | 'metal' | 'fire' | 'water' | 'earth';

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
  element: ElementType;
  image: string;
  video?: string;
  traits: PetTraits;
}

const ELEMENT_LABEL_MAP: Record<ElementType, string> = {
  wood: '木',
  metal: '金',
  fire: '火',
  water: '水',
  earth: '土',
};

const ELEMENT_BG_CLASS_MAP: Record<ElementType, string> = {
  wood: 'bg-[#8BC34A]',
  metal: 'bg-[#9E9E9E]',
  fire: 'bg-[#FF5722]',
  water: 'bg-[#2196F3]',
  earth: 'bg-[#795548]',
};

const PETS: ReadonlyArray<Pet> = [
  {
    id: 'qinglong',
    name: '青龙',
    element: 'wood',
    image: 'dragon_1.png',
    traits: {
      play: 'active',
      clean: 'long-lasting',
    },
  },
  {
    id: 'baihu',
    name: '白虎',
    element: 'metal',
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
    element: 'fire',
    image: 'phoenix_1.png',
    traits: {
      clean: 'high-frequency',
      feed: 'effect',
    },
  },
  {
    id: 'xuanwu',
    name: '玄武',
    element: 'water',
    image: 'tortoise_1.png',
    traits: {
      clean: 'low-frequency',
      play: 'slow-decline',
    },
  },
  {
    id: 'qilin',
    name: '麒麟',
    element: 'earth',
    image: 'kylin_1.png',
    video: 'kylin_1v.mp4',
    traits: {
      balanced: true,
      interaction: 'rich',
    },
  },
];

const selectedPetId = ref<string | null>(null);
const petName = ref('');
const trimmedPetName = computed(() => petName.value.trim());
const canConfirm = computed(() => Boolean(selectedPetId.value && trimmedPetName.value));

const getElementBadgeClass = (element: ElementType) => ELEMENT_BG_CLASS_MAP[element];

const selectPet = (petId: string) => {
  selectedPetId.value = petId;
};

const confirmPet = () => {
  if (!canConfirm.value || !selectedPetId.value)
    return;

  router.replace({
    path: '/pet',
    query: {
      petId: selectedPetId.value,
      petName: trimmedPetName.value,
    },
  });
};
</script>

<template>
  <div class="bg-gradient-to-b from-blue-100 to-purple-100 min-h-screen w-full flex flex-col overflow-y-auto">
    <div class="flex flex-col items-center min-h-screen w-full" :class="{ 'pb-200px': selectedPetId }">
      <div class="text-center px-20px pt-24px pb-8px">
        <h1 class="text-32px font-700 text-green-800">
          选择你的神兽
        </h1>
        <p class="mt-10px text-12px text-#64748b lh-18px">
          领养后可在互动页积累经验并升级
        </p>
      </div>
      <div
        class="w-full grid grid-cols-2 gap-20px p-20px bg-[rgba(255,255,255,0.7)] rounded-20px shadow-[0_8px_32px_rgba(31,38,135,0.15)] backdrop-blur-4px border-1 border-solid border-[rgba(255,255,255,0.18)]">
        <div
          v-for="pet in PETS"
          :key="pet.id"
          class="bg-gradient-to-br from-[rgba(255,255,255,0.9)] to-[rgba(255,255,255,0.7)] rounded-20px p-15px text-center cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative overflow-hidden backdrop-blur-4px border-2 border-solid border-transparent"
          :class="{ 'shadow-[0_10px_28px_rgba(76,175,80,0.35)] border-#4CAF50 bg-gradient-to-br from-[rgba(236,253,245,0.95)] to-[rgba(255,255,255,0.9)]': selectedPetId === pet.id }"
          @click="selectPet(pet.id)">
          <video
            v-if="pet.video"
            :key="pet.id"
            class="pet-card-video w-full h-auto object-contain mb-10px rounded-15px transition-all duration-300 relative z-2 bg-[rgba(255,255,255,0.8)] shadow-[0_4px_8px_rgba(0,0,0,0.1)] pointer-events-none"
            :class="{ 'shadow-[0_0_0_2px_rgba(76,175,80,0.25)]': selectedPetId === pet.id }"
            :src="getPetVideo(pet.video)"
            :poster="getPetImg(pet.image)"
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
            :src="getPetImg(pet.image)"
            :alt="pet.name"
            class="w-full h-auto object-contain mb-10px rounded-15px transition-all duration-300 relative z-2 bg-[rgba(255,255,255,0.8)] shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
            :class="{ 'shadow-[0_0_0_2px_rgba(76,175,80,0.25)]': selectedPetId === pet.id }">
          <div
            v-if="selectedPetId === pet.id"
            class="absolute top-10px right-10px z-10 w-22px h-22px rounded-999px bg-#4CAF50 text-white text-14px lh-22px font-700 shadow-[0_2px_8px_rgba(76,175,80,0.45)]">
            ✓
          </div>
          <div class="flex items-center justify-center gap-4px">
            <h3 class="text-20px font-700 text-green-800">
              {{ pet.name }}
            </h3>
            <span
              :class="`inline-block px-8px py-2px rounded-10px text-10px lh-14px text-white ${getElementBadgeClass(pet.element)}`">{{
                ELEMENT_LABEL_MAP[pet.element] }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="selectedPetId"
        class="fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom))] z-30 w-full px-16px pb-16px pt-12px bg-[rgba(255,255,255,0.92)] backdrop-blur-8px shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
        <input
          v-model="petName"
          type="text"
          placeholder="给你的神兽起个名字吧"
          class="font-['Ma_Shan_Zheng'] text-black text-20px text-center border-2 border-solid border-#4CAF50 rounded-25px py-12px px-20px outline-none w-full box-border transition-all duration-300 bg-[rgba(255,255,255,0.9)]"
          maxlength="8">
        <button
          class="bg-#4CAF50 text-white transition-all duration-300 mt-16px py-12px px-32px rounded-999px text-18px font-700 w-full"
          :disabled="!canConfirm"
          :class="{ 'opacity-50 cursor-not-allowed': !canConfirm }"
          @click="confirmPet">
          确认领取
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.pet-card-video::-webkit-media-controls {
  display: none !important;
}

.pet-card-video::-webkit-media-controls-enclosure {
  display: none !important;
}
</style>