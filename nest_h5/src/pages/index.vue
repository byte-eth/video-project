<route lang="json5">
{
  name: "home",
  meta: {
    title: "Home",
    keepAlive:true,
  },
}
</route>

<script setup lang="ts">
defineOptions({
  name: 'home'
})

const router = useRouter()
</script>

<template>
  <div class="px-16px py-24px">
    <img @click="router.push('/pet/selectPet')" class="w-full h-auto rounded-12px"
      src="@/assets/images/pet/pet_banner.png" alt="">
  </div>
</template>

<style lang="less"></style>