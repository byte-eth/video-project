<template>
	<van-nav-bar class="nav-bar" :class="{ 'no-bg': !isBg }" z-index="999" :title="props.title" left-arrow fixed
		:placeholder="props.placeholder" safe-area-inset-top :border="false" @click-left="props.isBack && router.back()">
		<template #left>
			<slot name="left">
				<van-icon name="arrow-left" size="20" />
			</slot>
		</template>
		<template #title>
			<slot name="title"></slot>
		</template>
		<template #right>
			<slot name="right"></slot>
		</template>
	</van-nav-bar>
</template>
<script setup>
import { defineProps } from 'vue';
import { useRouter } from "vue-router";

const props = defineProps({
	title: {
		type: String,
		default: ''
	},
	// 是否显示背景颜色
	isBg: {
		type: Boolean,
		default: true
	},
	// 固定在顶部时，是否在标签位置生成一个等高的占位元素
	placeholder: {
		type: Boolean,
		default: true
	},
	// 是否默认点击左侧返回
	isBack: {
		type: Boolean,
		default: true
	}
})

const router = useRouter();

</script>
<style lang="less" scoped>
.nav-bar {
	--van-nav-bar-background: #fff;
	--van-nav-bar-icon-color: #14161A;
	--van-nav-bar-text-color: #14161A;
	--van-nav-bar-title-text-color: #14161A;
	--van-nav-bar-arrow-size: 20px;
	// --van-nav-bar-title-font-size: 16px;
	// --van-font-weight-bold: 600;

	/deep/.van-nav-bar__title {
		line-height: 20px;
	}
}

.no-bg {
	--van-nav-bar-background: transparent !important;
}
</style>